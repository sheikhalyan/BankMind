const { getPool, sql } = require('../config/db');
const CustomerModel = require('../models/Customermodel');
const {
  notifyCustomer,
  notifyStaff,
  notifyAdmins,
  notifyAllStaff,
} = require('../utils/notifications');

// ================================================================
//  SHARED — full loan row with approval status
// ================================================================
const LOAN_SELECT = `
  SELECT
    l.loan_id,
    l.customer_id,
    l.account_id,
    l.policy_id,
    l.loan_amount,
    l.approved_amount,
    l.disbursed_amount,
    l.disbursed_at,
    l.duration_months,
    l.start_date,
    l.end_date,
    l.status,
    l.auto_deduct,
    l.created_at,
    c.full_name        AS customer_name,
    c.assigned_staff_id,
    lp.loan_type,
    lp.interest_rate,
    lp.min_amount,
    lp.max_amount,
    lp.min_months,
    lp.max_months,
    staff_ap.status    AS staff_approval_status,
    staff_ap.remarks   AS staff_approval_remarks,
    admin_ap.status    AS admin_approval_status,
    admin_ap.remarks   AS admin_approval_remarks
  FROM  Loans l
  JOIN  Customers     c  ON c.customer_id  = l.customer_id
  JOIN  Loan_Policies lp ON lp.policy_id   = l.policy_id
  LEFT JOIN Loan_Approvals staff_ap
         ON  staff_ap.loan_id       = l.loan_id
        AND  staff_ap.approver_role = 'STAFF'
  LEFT JOIN Loan_Approvals admin_ap
         ON  admin_ap.loan_id       = l.loan_id
        AND  admin_ap.approver_role = 'ADMIN'
`;

// ================================================================
//  1. CUSTOMER — APPLY FOR LOAN
//     POST /api/loans
//     Body: { policy_id, account_id, loan_amount, duration_months, auto_deduct? }
//     → Notify customer + assigned staff + all admins
// ================================================================
const applyLoan = async (req, res) => {
  const { policy_id, account_id, loan_amount, duration_months, auto_deduct } = req.body;
  const customerId = req.user.customerId;

  if (!policy_id || !account_id || !loan_amount || !duration_months)
    return res.status(400).json({ message: 'policy_id, account_id, loan_amount, and duration_months are required.' });

  try {
    const pool = await getPool();

    // Check existing active/pending loan
    const existingLoan = await pool.request()
      .input('customer_id', sql.Int, customerId)
      .query(`
        SELECT loan_id, status FROM Loans
        WHERE  customer_id = @customer_id
          AND  status IN ('PENDING', 'ACTIVE')
      `);
    if (existingLoan.recordset.length > 0)
      return res.status(400).json({
        message: `You already have a ${existingLoan.recordset[0].status.toLowerCase()} loan. Please wait until it is processed.`,
      });

    // Verify account belongs to customer and is ACTIVE
    const accResult = await pool.request()
      .input('account_id', sql.Int, account_id)
      .input('customer_id', sql.Int, customerId)
      .query(`
        SELECT account_id, status, balance FROM Accounts
        WHERE  account_id = @account_id AND customer_id = @customer_id
      `);

    if (!accResult.recordset[0])
      return res.status(404).json({ message: 'Account not found.' });
    if (accResult.recordset[0].status !== 'ACTIVE')
      return res.status(400).json({ message: 'Account must be ACTIVE to apply for a loan.' });

    // ── Minimum balance check — 10% of requested loan amount ──
    const accountBalance = parseFloat(accResult.recordset[0].balance);
    const minimumRequired = parseFloat((loan_amount * 0.10).toFixed(2));
    if (accountBalance < minimumRequired)
      return res.status(400).json({
        message: `Insufficient balance. You need at least PKR ${minimumRequired.toLocaleString('en-PK')} (10% of loan amount) in your account to apply. Your current balance is PKR ${accountBalance.toLocaleString('en-PK')}.`,
      });

    // Verify policy exists and is active
    const policyResult = await pool.request()
      .input('policy_id', sql.Int, policy_id)
      .query(`SELECT * FROM Loan_Policies WHERE policy_id = @policy_id AND is_active = 1`);
    const policy = policyResult.recordset[0];
    if (!policy)
      return res.status(404).json({ message: 'Loan policy not found or inactive.' });

    // Validate amount and duration
    if (loan_amount < policy.min_amount || loan_amount > policy.max_amount)
      return res.status(400).json({
        message: `Loan amount must be between PKR ${policy.min_amount.toLocaleString('en-PK')} and PKR ${policy.max_amount.toLocaleString('en-PK')}.`,
      });
    if (duration_months < policy.min_months || duration_months > policy.max_months)
      return res.status(400).json({
        message: `Duration must be between ${policy.min_months} and ${policy.max_months} months.`,
      });

    const insertResult = await pool.request()
      .input('customer_id', sql.Int, customerId)
      .input('account_id', sql.Int, account_id)
      .input('policy_id', sql.Int, policy_id)
      .input('loan_amount', sql.Decimal(15, 2), loan_amount)
      .input('duration_months', sql.Int, duration_months)
      .input('auto_deduct', sql.Bit, auto_deduct ? 1 : 0)
      .query(`
        INSERT INTO Loans (customer_id, account_id, policy_id, loan_amount, duration_months, auto_deduct)
        OUTPUT INSERTED.loan_id
        VALUES (@customer_id, @account_id, @policy_id, @loan_amount, @duration_months, @auto_deduct)
      `);

    const loanId = insertResult.recordset[0].loan_id;
    const customer = await CustomerModel.findById(customerId);

    await notifyCustomer({
      customer_id: customerId,
      type: 'LOAN_SUBMITTED',
      message: `Your ${policy.loan_type} loan application of PKR ${loan_amount.toLocaleString('en-PK')} has been submitted and is awaiting approval.`,
      related_id: loanId,
      related_type: 'LOAN',
    });

    if (customer?.assigned_staff_id) {
      await notifyStaff({
        user_id: customer.assigned_staff_id,
        type: 'LOAN_APPLIED',
        message: `Customer "${customer.full_name}" applied for a ${policy.loan_type} loan of PKR ${loan_amount.toLocaleString('en-PK')}. Awaiting your approval.`,
        related_id: loanId,
        related_type: 'LOAN',
      });
    }

    await notifyAdmins({
      type: 'LOAN_APPLIED',
      message: `Customer "${customer?.full_name}" applied for a ${policy.loan_type} loan of PKR ${loan_amount.toLocaleString('en-PK')}.`,
      related_id: loanId,
      related_type: 'LOAN',
    });

    return res.status(201).json({
      message: 'Loan application submitted. Awaiting staff approval.',
      loan_id: loanId,
      interest_rate: policy.interest_rate,
      minimum_balance_required: minimumRequired,
    });

  } catch (err) {
    console.error('[applyLoan]', err);
    return res.status(500).json({ error: err.message });
  }
};

// ================================================================
//  2. GET ALL LOANS
//     GET /api/loans
//     Customer → own loans only
//     Staff    → their assigned customers' loans
//     Admin    → all loans
// ================================================================
const getAllLoans = async (req, res) => {
  const role = req.user.role.toUpperCase();
  const userId = req.user.userId;
  const customerId = req.user.customerId;

  try {
    const pool = await getPool();
    const request = pool.request();
    let query = LOAN_SELECT;

    if (role === 'CUSTOMER') {
      query += ` WHERE l.customer_id = @customer_id ORDER BY l.created_at DESC`;
      request.input('customer_id', sql.Int, customerId);
    } else if (role === 'STAFF') {
      query += ` WHERE c.assigned_staff_id = @staff_id ORDER BY l.created_at DESC`;
      request.input('staff_id', sql.Int, userId);
    } else {
      query += ` ORDER BY l.created_at DESC`;
    }

    const result = await request.query(query);
    return res.json(result.recordset);

  } catch (err) {
    console.error('[getAllLoans]', err);
    return res.status(500).json({ error: err.message });
  }
};

// ================================================================
//  3. GET PENDING — STAFF LEVEL
//     GET /api/loans/pending/staff
//     Loans with no staff approval row yet
// ================================================================
const getPendingLoansForStaff = async (req, res) => {
  const staffId = req.user.userId;
  const role = req.user.role.toUpperCase();

  try {
    const pool = await getPool();
    const request = pool.request();

    let query = LOAN_SELECT + `
      WHERE l.status = 'PENDING'
        AND NOT EXISTS (
          SELECT 1 FROM Loan_Approvals la
          WHERE  la.loan_id       = l.loan_id
            AND  la.approver_role = 'STAFF'
        )
    `;

    if (role === 'STAFF') {
      query += ` AND c.assigned_staff_id = @staff_id`;
      request.input('staff_id', sql.Int, staffId);
    }

    query += ` ORDER BY l.created_at ASC`;
    const result = await request.query(query);
    return res.json(result.recordset);

  } catch (err) {
    console.error('[getPendingLoansForStaff]', err);
    return res.status(500).json({ error: err.message });
  }
};

// ================================================================
//  4. GET PENDING — ADMIN LEVEL
//     GET /api/loans/pending/admin
//     Staff approved, admin hasn't actioned yet
// ================================================================
const getPendingLoansForAdmin = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(
      LOAN_SELECT + `
      WHERE l.status = 'PENDING'
        AND EXISTS (
          SELECT 1 FROM Loan_Approvals la
          WHERE  la.loan_id       = l.loan_id
            AND  la.approver_role = 'STAFF'
            AND  la.status        = 'APPROVED'
        )
        AND NOT EXISTS (
          SELECT 1 FROM Loan_Approvals la2
          WHERE  la2.loan_id       = l.loan_id
            AND  la2.approver_role = 'ADMIN'
        )
      ORDER BY l.created_at ASC
    `);
    return res.json(result.recordset);

  } catch (err) {
    console.error('[getPendingLoansForAdmin]', err);
    return res.status(500).json({ error: err.message });
  }
};

// ================================================================
//  5. STAFF — APPROVE LOAN
//     PUT /api/loans/:loanId/staff-approve
//     Body: { approved_amount?, duration_months?, remarks? }
//     → Notify customer + all admins
// ================================================================
const staffApproveLoan = async (req, res) => {
  const { loanId } = req.params;
  const { approved_amount, duration_months, remarks } = req.body;
  const staffId = req.user.userId;

  try {
    const pool = await getPool();
    const loanResult = await pool.request()
      .input('loan_id', sql.Int, loanId)
      .query(LOAN_SELECT + ` WHERE l.loan_id = @loan_id`);

    const loan = loanResult.recordset[0];
    if (!loan)
      return res.status(404).json({ message: 'Loan not found.' });
    if (loan.assigned_staff_id !== staffId)
      return res.status(403).json({ message: 'This customer is not assigned to you.' });
    if (loan.status !== 'PENDING')
      return res.status(400).json({ message: `Loan is already ${loan.status}.` });

    const existing = await pool.request()
      .input('loan_id', sql.Int, loanId)
      .query(`SELECT approval_id FROM Loan_Approvals WHERE loan_id = @loan_id AND approver_role = 'STAFF'`);
    if (existing.recordset.length > 0)
      return res.status(409).json({ message: 'Staff approval already recorded.' });

    const finalAmount = approved_amount || loan.loan_amount;
    const finalDuration = duration_months || loan.duration_months;

    if (finalAmount < loan.min_amount || finalAmount > loan.max_amount)
      return res.status(400).json({ message: `Amount must be between ${loan.min_amount} and ${loan.max_amount}.` });
    if (finalDuration < loan.min_months || finalDuration > loan.max_months)
      return res.status(400).json({ message: `Duration must be between ${loan.min_months} and ${loan.max_months} months.` });

    await pool.request()
      .input('loan_id', sql.Int, loanId)
      .input('approver_id', sql.Int, staffId)
      .input('approved_amount', sql.Decimal(15, 2), finalAmount)
      .input('duration_months', sql.Int, finalDuration)
      .input('remarks', sql.NVarChar, remarks || null)
      .query(`
        INSERT INTO Loan_Approvals (loan_id, approver_id, approver_role, status, remarks)
        VALUES (@loan_id, @approver_id, 'STAFF', 'APPROVED', @remarks);

        UPDATE Loans
        SET    approved_amount  = @approved_amount,
               duration_months = @duration_months
        WHERE  loan_id = @loan_id;
      `);

    await Promise.all([
      notifyCustomer({
        customer_id: loan.customer_id,
        type: 'LOAN_STAFF_APPROVED',
        message: `Your ${loan.loan_type} loan has been reviewed by staff. Awaiting final admin approval.`,
        related_id: Number(loanId),
        related_type: 'LOAN',
      }),
      notifyAdmins({
        type: 'LOAN_AWAITING_ADMIN_APPROVAL',
        message: `Customer "${loan.customer_name}" ${loan.loan_type} loan approved by staff — awaiting your final approval.`,
        related_id: Number(loanId),
        related_type: 'LOAN',
      }),
    ]);

    return res.json({ message: 'Loan approved at staff level. Awaiting admin approval.' });

  } catch (err) {
    console.error('[staffApproveLoan]', err);
    return res.status(500).json({ error: err.message });
  }
};

// ================================================================
//  6. STAFF — REJECT LOAN
//     PUT /api/loans/:loanId/staff-reject
//     Body: { remarks }
//     → Notify customer + admins
// ================================================================
const staffRejectLoan = async (req, res) => {
  const { loanId } = req.params;
  const { remarks } = req.body;
  const staffId = req.user.userId;

  if (!remarks?.trim())
    return res.status(400).json({ message: 'Rejection reason (remarks) is required.' });

  try {
    const pool = await getPool();
    const loanResult = await pool.request()
      .input('loan_id', sql.Int, loanId)
      .query(LOAN_SELECT + ` WHERE l.loan_id = @loan_id`);

    const loan = loanResult.recordset[0];
    if (!loan)
      return res.status(404).json({ message: 'Loan not found.' });
    if (loan.assigned_staff_id !== staffId)
      return res.status(403).json({ message: 'This customer is not assigned to you.' });
    if (loan.status !== 'PENDING')
      return res.status(400).json({ message: `Loan is already ${loan.status}.` });

    await pool.request()
      .input('loan_id', sql.Int, loanId)
      .input('approver_id', sql.Int, staffId)
      .input('remarks', sql.NVarChar, remarks)
      .query(`
        INSERT INTO Loan_Approvals (loan_id, approver_id, approver_role, status, remarks)
        VALUES (@loan_id, @approver_id, 'STAFF', 'REJECTED', @remarks);

        UPDATE Loans SET status = 'REJECTED' WHERE loan_id = @loan_id;
      `);

    await Promise.all([
      notifyCustomer({
        customer_id: loan.customer_id,
        type: 'LOAN_REJECTED',
        message: `Your ${loan.loan_type} loan was rejected by staff. Reason: ${remarks}`,
        related_id: Number(loanId),
        related_type: 'LOAN',
      }),
      notifyAdmins({
        type: 'LOAN_REJECTED_BY_STAFF',
        message: `Customer "${loan.customer_name}" ${loan.loan_type} loan was rejected by staff. Reason: ${remarks}`,
        related_id: Number(loanId),
        related_type: 'LOAN',
      }),
    ]);

    return res.json({ message: 'Loan rejected at staff level.' });

  } catch (err) {
    console.error('[staffRejectLoan]', err);
    return res.status(500).json({ error: err.message });
  }
};

// ================================================================
//  7. ADMIN — APPROVE LOAN
//     PUT /api/loans/:loanId/admin-approve
//     Body: { remarks? }
//     Sets status = ACTIVE, calculates dates, generates repayment schedule
//     → Notify customer + assigned staff
// ================================================================
const adminApproveLoan = async (req, res) => {
  const { loanId } = req.params;
  const { remarks } = req.body;
  const adminId = req.user.userId;

  try {
    const pool = await getPool();
    const loanResult = await pool.request()
      .input('loan_id', sql.Int, loanId)
      .query(LOAN_SELECT + ` WHERE l.loan_id = @loan_id`);

    const loan = loanResult.recordset[0];
    if (!loan)
      return res.status(404).json({ message: 'Loan not found.' });
    if (loan.status !== 'PENDING')
      return res.status(400).json({ message: `Loan is already ${loan.status}.` });
    if (loan.staff_approval_status !== 'APPROVED')
      return res.status(400).json({ message: 'Staff must approve before admin.' });

    const existing = await pool.request()
      .input('loan_id', sql.Int, loanId)
      .query(`SELECT approval_id FROM Loan_Approvals WHERE loan_id = @loan_id AND approver_role = 'ADMIN'`);
    if (existing.recordset.length > 0)
      return res.status(409).json({ message: 'Admin approval already recorded.' });

    // ── INTEREST CALCULATION ─────────────────────────────────────
    // Simple Interest: EMI = (P + P×R×T/100) / N
    //   P = principal (approved_amount or loan_amount)
    //   R = annual interest rate (from policy)
    //   T = duration in years
    //   N = duration in months
    const principal = parseFloat(loan.approved_amount || loan.loan_amount);
    const annualRate = parseFloat(loan.interest_rate);        // e.g. 12.00
    const months = parseInt(loan.duration_months);        // e.g. 24
    const years = months / 12;                           // e.g. 2.0

    const totalInterest = (principal * annualRate * years) / 100;
    const totalAmount = principal + totalInterest;
    const monthlyEMI = parseFloat((totalAmount / months).toFixed(2));

    // Handle rounding — last installment gets the remainder
    const regularEMI = parseFloat((Math.floor((totalAmount / months) * 100) / 100).toFixed(2));
    const lastEMI = parseFloat((totalAmount - regularEMI * (months - 1)).toFixed(2));

    // ── START / END DATES ────────────────────────────────────────
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + months);

    // ── APPROVE LOAN ─────────────────────────────────────────────
    // ── STEP 1: Check account is not FROZEN before disbursing ────────
    const accountCheck = await pool.request()
      .input('account_id', sql.Int, loan.account_id)
      .query(`SELECT account_id, status FROM Accounts WHERE account_id = @account_id`);

    const loanAccount = accountCheck.recordset[0];
    if (!loanAccount)
      return res.status(404).json({ message: 'Loan account not found.' });
    if (loanAccount.status === 'FROZEN')
      return res.status(400).json({ message: 'Cannot disburse loan — account is frozen.' });
    if (loanAccount.status !== 'ACTIVE')
      return res.status(400).json({ message: `Cannot disburse loan — account status is ${loanAccount.status}.` });

    // ── STEP 2: Record approval + activate loan ──────────────────────
    await pool.request()
      .input('loan_id', sql.Int, loanId)
      .input('approver_id', sql.Int, adminId)
      .input('remarks', sql.NVarChar, remarks || null)
      .input('start_date', sql.Date, startDate)
      .input('end_date', sql.Date, endDate)
      .input('approved_amount', sql.Decimal(15, 2), principal)
      .query(`
    INSERT INTO Loan_Approvals (loan_id, approver_id, approver_role, status, remarks)
    VALUES (@loan_id, @approver_id, 'ADMIN', 'APPROVED', @remarks);

    UPDATE Loans
    SET    status          = 'ACTIVE',
           start_date      = @start_date,
           end_date        = @end_date,
           approved_amount = @approved_amount
    WHERE  loan_id = @loan_id;
  `);

    // ── STEP 3: DISBURSE — credit loan amount to customer account ───
    const disbursementDate = new Date();
    const dbTx = pool.transaction();
    await dbTx.begin();
    let disbursementTransactionId;

    try {
      // Credit approved amount to customer's account
      await dbTx.request()
        .input('amount', sql.Decimal(15, 2), principal)
        .input('account_id', sql.Int, loan.account_id)
        .query(`UPDATE Accounts SET balance = balance + @amount WHERE account_id = @account_id`);

      // Record as DEPOSIT transaction
      const txResult = await dbTx.request()
        .input('account_id', sql.Int, loan.account_id)
        .input('amount', sql.Decimal(15, 2), principal)
        .input('description', sql.NVarChar,
          `Loan disbursement — ${loan.loan_type} loan #${loanId} approved and credited`)
        .query(`
      INSERT INTO Transactions (to_account_id, transaction_type, amount, description)
      OUTPUT INSERTED.transaction_id
      VALUES (@account_id, 'DEPOSIT', @amount, @description)
    `);

      disbursementTransactionId = txResult.recordset[0].transaction_id;

      // Update loan disbursement fields
      await dbTx.request()
        .input('loan_id', sql.Int, loanId)
        .input('disbursed_amount', sql.Decimal(15, 2), principal)
        .input('disbursed_at', sql.DateTime, disbursementDate)
        .input('disbursed_by', sql.Int, adminId)
        .query(`
      UPDATE Loans
      SET    disbursed_amount = @disbursed_amount,
             disbursed_at     = @disbursed_at,
             disbursed_by     = @disbursed_by
      WHERE  loan_id = @loan_id
    `);

      await dbTx.commit();

    } catch (txErr) {
      try { await dbTx.rollback(); } catch (_) { }
      console.error('[adminApproveLoan] Disbursement failed:', txErr);
      return res.status(500).json({ error: `Loan approved but disbursement failed: ${txErr.message}` });
    }

    // ── GENERATE REPAYMENT SCHEDULE ──────────────────────────────
    // Due date = same day as start date every month
    // e.g. started 15 Jan → due 15 Feb, 15 Mar, etc.
    const startDay = startDate.getDate(); // e.g. 15

    for (let i = 1; i <= months; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);

      // Keep same day of month — handle month-end edge cases
      // e.g. if start is Jan 31 → Feb 28/29
      const maxDay = new Date(dueDate.getFullYear(), dueDate.getMonth() + 1, 0).getDate();
      dueDate.setDate(Math.min(startDay, maxDay));

      const emiAmount = (i === months) ? lastEMI : regularEMI;

      await pool.request()
        .input('loan_id', sql.Int, loanId)
        .input('installment_no', sql.Int, i)
        .input('amount', sql.Decimal(15, 2), emiAmount)
        .input('due_date', sql.Date, dueDate)
        .query(`
          INSERT INTO Loan_Repayments (loan_id, installment_no, amount, due_date)
          VALUES (@loan_id, @installment_no, @amount, @due_date)
        `);
    }

    // ── NOTIFICATIONS ────────────────────────────────────────────
    const notifications = [
      notifyCustomer({
        customer_id: loan.customer_id,
        type: 'LOAN_APPROVED',
        message: `Your ${loan.loan_type} loan of PKR ${principal.toLocaleString()} has been approved and PKR ${principal.toLocaleString()} has been credited to your account. Monthly EMI: PKR ${monthlyEMI.toLocaleString()} for ${months} months. Total repayment: PKR ${totalAmount.toLocaleString()} (includes PKR ${totalInterest.toLocaleString()} interest at ${annualRate}% per annum).`,
        related_id: Number(loanId),
        related_type: 'LOAN',
      }),
    ];

    if (loan.assigned_staff_id) {
      notifications.push(notifyStaff({
        user_id: loan.assigned_staff_id,
        type: 'LOAN_FULLY_APPROVED',
        message: `Customer "${loan.customer_name}" ${loan.loan_type} loan fully approved. EMI: PKR ${monthlyEMI.toLocaleString()} for ${months} months.`,
        related_id: Number(loanId),
        related_type: 'LOAN',
      }));
    }

    await Promise.all(notifications);

    return res.json({
      message: 'Loan fully approved, disbursed, and active.',
      loan_id: Number(loanId),
      principal,
      disbursed_amount: principal,
      disbursed_at: disbursementDate,
      disbursement_transaction_id: disbursementTransactionId,
      annual_rate: annualRate,
      total_interest: totalInterest,
      total_repayment: totalAmount,
      monthly_emi: monthlyEMI,
      installments: months,
      start_date: startDate,
      end_date: endDate,
      due_day_of_month: startDay,
    });

  } catch (err) {
    console.error('[adminApproveLoan]', err);
    return res.status(500).json({ error: err.message });
  }
};

// ================================================================
//  8. ADMIN — REJECT LOAN
//     PUT /api/loans/:loanId/admin-reject
//     Body: { remarks }
//     → Notify customer + assigned staff
// ================================================================
const adminRejectLoan = async (req, res) => {
  const { loanId } = req.params;
  const { remarks } = req.body;
  const adminId = req.user.userId;

  if (!remarks?.trim())
    return res.status(400).json({ message: 'Rejection reason (remarks) is required.' });

  try {
    const pool = await getPool();
    const loanResult = await pool.request()
      .input('loan_id', sql.Int, loanId)
      .query(LOAN_SELECT + ` WHERE l.loan_id = @loan_id`);

    const loan = loanResult.recordset[0];
    if (!loan)
      return res.status(404).json({ message: 'Loan not found.' });
    if (loan.status !== 'PENDING')
      return res.status(400).json({ message: `Loan is already ${loan.status}.` });

    await pool.request()
      .input('loan_id', sql.Int, loanId)
      .input('approver_id', sql.Int, adminId)
      .input('remarks', sql.NVarChar, remarks)
      .query(`
        INSERT INTO Loan_Approvals (loan_id, approver_id, approver_role, status, remarks)
        VALUES (@loan_id, @approver_id, 'ADMIN', 'REJECTED', @remarks);

        UPDATE Loans SET status = 'REJECTED' WHERE loan_id = @loan_id;
      `);

    const notifications = [
      notifyCustomer({
        customer_id: loan.customer_id,
        type: 'LOAN_REJECTED',
        message: `Your ${loan.loan_type} loan was rejected by admin. Reason: ${remarks}`,
        related_id: Number(loanId),
        related_type: 'LOAN',
      }),
    ];

    // Only notify assigned staff
    if (loan.assigned_staff_id) {
      notifications.push(notifyStaff({
        user_id: loan.assigned_staff_id,
        type: 'LOAN_REJECTED_BY_ADMIN',
        message: `Customer "${loan.customer_name}" ${loan.loan_type} loan rejected by admin. Reason: ${remarks}`,
        related_id: Number(loanId),
        related_type: 'LOAN',
      }));
    }

    await Promise.all(notifications);

    return res.json({ message: 'Loan rejected at admin level.' });

  } catch (err) {
    console.error('[adminRejectLoan]', err);
    return res.status(500).json({ error: err.message });
  }
};

const toggleAutoDeduct = async (req, res) => {
  const { loanId } = req.params;
  const { auto_deduct } = req.body;

  if (typeof auto_deduct !== 'boolean')
    return res.status(400).json({ message: 'auto_deduct boolean is required.' });

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('loan_id', sql.Int, loanId)
      .input('auto_deduct', sql.Bit, auto_deduct ? 1 : 0)
      .query(`
        UPDATE Loans
        SET auto_deduct = @auto_deduct
        OUTPUT INSERTED.loan_id, INSERTED.auto_deduct
        WHERE loan_id = @loan_id AND status = 'ACTIVE'
      `);

    const loan = result.recordset[0];
    if (!loan)
      return res.status(404).json({ message: 'Active loan not found.' });

    return res.json({
      message: `Auto-deduction ${auto_deduct ? 'enabled' : 'disabled'}.`,
      loan_id: loan.loan_id,
      auto_deduct: Boolean(loan.auto_deduct),
    });
  } catch (err) {
    console.error('[toggleAutoDeduct]', err);
    return res.status(500).json({ error: err.message });
  }
};

module.exports = {
  applyLoan,
  getAllLoans,
  getPendingLoansForStaff,
  getPendingLoansForAdmin,
  staffApproveLoan,
  staffRejectLoan,
  adminApproveLoan,
  adminRejectLoan,
  toggleAutoDeduct,
};
