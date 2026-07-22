const { getPool, sql } = require('../config/db');
const CustomerModel = require('../models/Customermodel');
const {
  notifyCustomer,
  notifyStaff,
  notifyAdmins,
} = require('../utils/notifications');

// ================================================================
//  HELPER — generate unique account number
// ================================================================
const generateAccountNumber = () =>
  'BM' + Date.now().toString().slice(-10) + Math.floor(Math.random() * 100);

// ================================================================
//  1. CUSTOMER — CREATE ACCOUNT
//     POST /api/accounts
//     Body: { account_type: 'SAVINGS' | 'CURRENT' }
//     → Notify assigned staff + admins
// ================================================================
const createAccount = async (req, res) => {
  const { account_type } = req.body;
  const customerId = req.user.customerId;

  if (!account_type)
    return res.status(400).json({ message: 'account_type is required.' });

  const validTypes = ['SAVINGS', 'CURRENT'];
  if (!validTypes.includes(account_type.toUpperCase()))
    return res.status(400).json({ message: 'account_type must be SAVINGS or CURRENT.' });

  try {
    const pool = await getPool();
    const customer = await CustomerModel.findById(customerId);

    if (!customer || customer.status !== 'ACTIVE')
      return res.status(403).json({ message: 'Your account is not active.' });

    // Check max 2 accounts
    const existing = await pool.request()
      .input('customer_id', sql.Int, customerId)
      .query(`SELECT COUNT(*) AS total FROM Accounts WHERE customer_id = @customer_id`);

    if (existing.recordset[0].total >= 2)
      return res.status(400).json({ message: 'Maximum 2 accounts allowed (1 SAVINGS + 1 CURRENT).' });

    const accountNumber = generateAccountNumber();

    const insertResult = await pool.request()
      .input('customer_id', sql.Int, customerId)
      .input('account_number', sql.NVarChar, accountNumber)
      .input('account_type', sql.NVarChar, account_type.toUpperCase())
      .query(`
        INSERT INTO Accounts (customer_id, account_number, account_type, status)
        OUTPUT INSERTED.account_id
        VALUES (@customer_id, @account_number, @account_type, 'PENDING')
      `);

    const accountId = insertResult.recordset[0].account_id;

    // Notify customer
    await notifyCustomer({
      customer_id: customerId,
      type: 'ACCOUNT_PENDING',
      message: `Your ${account_type.toUpperCase()} account request has been submitted and is awaiting staff approval.`,
      related_id: accountId,
      related_type: 'ACCOUNT',
    });

    // Notify assigned staff
    if (customer.assigned_staff_id) {
      await notifyStaff({
        user_id: customer.assigned_staff_id,
        type: 'ACCOUNT_PENDING',
        message: `Customer "${customer.full_name}" requested a new ${account_type.toUpperCase()} account. Awaiting your approval.`,
        related_id: accountId,
        related_type: 'ACCOUNT',
      });
    }

    // Notify admins
    await notifyAdmins({
      type: 'ACCOUNT_PENDING',
      message: `Customer "${customer.full_name}" requested a new ${account_type.toUpperCase()} account.`,
      related_id: accountId,
      related_type: 'ACCOUNT',
    });

    return res.status(201).json({
      message: 'Account created successfully. Awaiting staff approval.',
      account_id: accountId,
      account_number: accountNumber,
      account_type: account_type.toUpperCase(),
    });

  } catch (err) {
    if (err.message?.includes('uq_customer_account_type'))
      return res.status(400).json({ message: `You already have a ${account_type} account.` });
    console.error('[createAccount]', err);
    return res.status(500).json({ error: err.message });
  }
};

// ================================================================
//  2. STAFF — GET PENDING ACCOUNTS
//     GET /api/accounts/pending
//     Staff → their assigned customers only | Admin → all
// ================================================================
const getPendingAccounts = async (req, res) => {
  const staffId = req.user.userId;
  const role = req.user.role.toUpperCase();

  try {
    const pool = await getPool();
    const request = pool.request();

    let query = `
      SELECT
        a.account_id, a.account_number, a.account_type,
        a.balance, a.status, a.opened_date,
        c.customer_id, c.full_name AS customer_name,
        c.email AS customer_email, c.assigned_staff_id
      FROM  Accounts  a
      JOIN  Customers c ON c.customer_id = a.customer_id
      WHERE a.status = 'PENDING'
    `;

    if (role === 'STAFF') {
      query += ` AND c.assigned_staff_id = @staff_id`;
      request.input('staff_id', sql.Int, staffId);
    }

    query += ` ORDER BY a.opened_date DESC`;
    const result = await request.query(query);
    return res.json(result.recordset);

  } catch (err) {
    console.error('[getPendingAccounts]', err);
    return res.status(500).json({ error: err.message });
  }
};

// ================================================================
//  3. GET ALL ACCOUNTS
//     GET /api/accounts
//     Staff → their assigned customers | Admin → all
// ================================================================
const getAllAccounts = async (req, res) => {
  const role = req.user.role.toUpperCase();
  const staffId = req.user.userId;

  try {
    const pool = await getPool();
    const request = pool.request();

    let query = `
  SELECT
    a.account_id, a.account_number, a.account_type,
    a.balance, a.status, a.opened_date, a.closed_date,
    c.customer_id, c.full_name AS customer_name,
    c.email AS customer_email,
    u.full_name AS assigned_staff_name
  FROM  Accounts  a
  JOIN  Customers c ON c.customer_id = a.customer_id
  LEFT JOIN Users u ON u.user_id = c.assigned_staff_id
`;

    if (role === 'STAFF') {
      query += ` WHERE c.assigned_staff_id = @staff_id`;
      request.input('staff_id', sql.Int, staffId);
    }

    query += ` ORDER BY a.opened_date DESC`;
    const result = await request.query(query);
    return res.json(result.recordset);

  } catch (err) {
    console.error('[getAllAccounts]', err);
    return res.status(500).json({ error: err.message });
  }
};

// ================================================================
//  4. STAFF — APPROVE ACCOUNT
//     PUT /api/accounts/:accountId/approve
//     Staff is final approver for accounts (no admin level needed)
//     → Notify customer + admins
// ================================================================
const approveAccount = async (req, res) => {
  const { accountId } = req.params;
  const { remarks } = req.body;
  const staffId = req.user.userId;

  try {
    const pool = await getPool();
    const accResult = await pool.request()
      .input('account_id', sql.Int, accountId)
      .query(`
        SELECT a.account_id, a.account_type, a.status, a.customer_id,
               c.full_name AS customer_name, c.assigned_staff_id
        FROM   Accounts  a
        JOIN   Customers c ON c.customer_id = a.customer_id
        WHERE  a.account_id = @account_id
      `);

    const account = accResult.recordset[0];
    if (!account)
      return res.status(404).json({ message: 'Account not found.' });
    if (account.assigned_staff_id !== staffId)
      return res.status(403).json({ message: 'This customer is not assigned to you.' });
    if (account.status !== 'PENDING')
      return res.status(400).json({ message: `Account is already ${account.status}.` });

    await pool.request()
      .input('account_id', sql.Int, accountId)
      .input('approver_id', sql.Int, staffId)
      .input('remarks', sql.NVarChar, remarks || null)
      .query(`
        INSERT INTO Account_Approvals
          (account_id, approver_id, approver_role, status, remarks)
        VALUES
          (@account_id, @approver_id, 'STAFF', 'APPROVED', @remarks);

        UPDATE Accounts SET status = 'ACTIVE' WHERE account_id = @account_id;
      `);

    await Promise.all([
      notifyCustomer({
        customer_id: account.customer_id,
        type: 'ACCOUNT_APPROVED',
        message: `Your ${account.account_type} account has been approved and is now active.`,
        related_id: Number(accountId),
        related_type: 'ACCOUNT',
      }),
      notifyAdmins({
        type: 'ACCOUNT_APPROVED',
        message: `Customer "${account.customer_name}" ${account.account_type} account approved by staff.`,
        related_id: Number(accountId),
        related_type: 'ACCOUNT',
      }),
    ]);

    return res.json({ message: 'Account approved successfully.' });

  } catch (err) {
    console.error('[approveAccount]', err);
    return res.status(500).json({ error: err.message });
  }
};

// ================================================================
//  5. STAFF — REJECT ACCOUNT
//     PUT /api/accounts/:accountId/reject
//     Body: { remarks }
//     → Notify customer + admins
// ================================================================
const rejectAccount = async (req, res) => {
  const { accountId } = req.params;
  const { remarks } = req.body;
  const staffId = req.user.userId;

  if (!remarks?.trim())
    return res.status(400).json({ message: 'Rejection reason (remarks) is required.' });

  try {
    const pool = await getPool();
    const accResult = await pool.request()
      .input('account_id', sql.Int, accountId)
      .query(`
        SELECT a.account_id, a.account_type, a.status, a.customer_id,
               c.full_name AS customer_name, c.assigned_staff_id
        FROM   Accounts  a
        JOIN   Customers c ON c.customer_id = a.customer_id
        WHERE  a.account_id = @account_id
      `);

    const account = accResult.recordset[0];
    if (!account)
      return res.status(404).json({ message: 'Account not found.' });
    if (account.assigned_staff_id !== staffId)
      return res.status(403).json({ message: 'This customer is not assigned to you.' });
    if (account.status !== 'PENDING')
      return res.status(400).json({ message: `Account is already ${account.status}.` });

    await pool.request()
      .input('account_id', sql.Int, accountId)
      .input('approver_id', sql.Int, staffId)
      .input('remarks', sql.NVarChar, remarks)
      .query(`
        INSERT INTO Account_Approvals
          (account_id, approver_id, approver_role, status, remarks)
        VALUES
          (@account_id, @approver_id, 'STAFF', 'REJECTED', @remarks);

        UPDATE Accounts SET status = 'REJECTED' WHERE account_id = @account_id;
      `);

    await Promise.all([
      notifyCustomer({
        customer_id: account.customer_id,
        type: 'ACCOUNT_REJECTED',
        message: `Your ${account.account_type} account request was rejected. Reason: ${remarks}`,
        related_id: Number(accountId),
        related_type: 'ACCOUNT',
      }),
      notifyAdmins({
        type: 'ACCOUNT_REJECTED',
        message: `Customer "${account.customer_name}" ${account.account_type} account rejected by staff. Reason: ${remarks}`,
        related_id: Number(accountId),
        related_type: 'ACCOUNT',
      }),
    ]);

    return res.json({ message: 'Account rejected.' });

  } catch (err) {
    console.error('[rejectAccount]', err);
    return res.status(500).json({ error: err.message });
  }
};

// ================================================================
//  6. CUSTOMER — GET MY ACCOUNTS
//     GET /api/accounts/my
// ================================================================
const getMyAccounts = async (req, res) => {
  const customerId = req.user.customerId;

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('customer_id', sql.Int, customerId)
      .query(`
        SELECT
          account_id, account_number, account_type,
          balance, status, opened_date
        FROM  Accounts
        WHERE customer_id = @customer_id
        ORDER BY opened_date DESC
      `);

    return res.json(result.recordset);

  } catch (err) {
    console.error('[getMyAccounts]', err);
    return res.status(500).json({ error: err.message });
  }
};

// ================================================================
//  7. STAFF/ADMIN — GET ACCOUNTS BY CUSTOMER
//     GET /api/accounts/customer/:customerId
// ================================================================
const getAccountsByCustomer = async (req, res) => {
  const { customerId } = req.params;
  const role = req.user.role.toUpperCase();
  const staffId = req.user.userId;

  try {
    const pool = await getPool();

    // Staff can only view their assigned customers
    if (role === 'STAFF') {
      const customer = await CustomerModel.findById(customerId);
      if (!customer || customer.assigned_staff_id !== staffId)
        return res.status(403).json({ message: 'This customer is not assigned to you.' });
    }

    const result = await pool.request()
      .input('customer_id', sql.Int, customerId)
      .query(`
        SELECT
          account_id, account_number, account_type,
          balance, status, opened_date
        FROM  Accounts
        WHERE customer_id = @customer_id
        ORDER BY opened_date DESC
      `);

    return res.json(result.recordset);

  } catch (err) {
    console.error('[getAccountsByCustomer]', err);
    return res.status(500).json({ error: err.message });
  }
};

// ================================================================
//  HELPER — used by userService.getUserAssociatedAccounts()
//  GET /api/accounts/staff-accounts
//  Returns all accounts for customers assigned to this staff member
// ================================================================
const getUserAssociatedAccounts = async (req, res) => {
  const staffId = req.user.userId;

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('staff_id', sql.Int, staffId)
      .query(`
        SELECT
          a.account_id, a.account_number, a.account_type,
          a.balance, a.status, a.opened_date,
          c.customer_id, c.full_name AS customer_name,
          c.email AS customer_email
        FROM  Accounts  a
        JOIN  Customers c ON c.customer_id = a.customer_id
        WHERE c.assigned_staff_id = @staff_id
        ORDER BY a.opened_date DESC
      `);

    return res.json(result.recordset);

  } catch (err) {
    console.error('[getUserAssociatedAccounts]', err);
    return res.status(500).json({ error: err.message });
  }
};


// ================================================================
//  CUSTOMER — REQUEST ACCOUNT CLOSURE
//  POST /api/accounts/:accountId/request-closure
// ================================================================
const requestAccountClosure = async (req, res) => {
  const { accountId } = req.params;
  const customerId = req.user.customerId;

  try {
    const pool = await getPool();
    const AccountModel = require('../models/Accountmodel');

    // 1. Verify ownership
    const account = await AccountModel.findById(accountId);
    if (!account)
      return res.status(404).json({ message: 'Account not found.' });
    if (account.customer_id !== customerId)
      return res.status(403).json({ message: 'This account does not belong to you.' });

    // 2. Specific status checks — clear messages for each case
    if (account.status === 'CLOSURE_PENDING')
      return res.status(400).json({ message: 'A closure request is already pending for this account. Please wait for admin review.' });
    if (account.status === 'CLOSED')
      return res.status(400).json({ message: 'This account is already closed.' });
    if (account.status === 'FROZEN')
      return res.status(400).json({ message: 'This account is frozen. Contact support before requesting closure.' });
    if (account.status !== 'ACTIVE')
      return res.status(400).json({ message: `Account cannot be closed. Current status: ${account.status}.` });

    // 3. Check for active loans
    const hasLoans = await AccountModel.hasActiveLoans(accountId);
    if (hasLoans)
      return res.status(400).json({ message: 'Cannot close account. You have an active loan on this account. Please repay your loan fully before closing.' });

    // 4. Atomic update — only update if still ACTIVE (race condition protection)
    const updateResult = await pool.request()
      .input('account_id', sql.Int, accountId)
      .query(`
        UPDATE Accounts
        SET    status = 'CLOSURE_PENDING'
        WHERE  account_id = @account_id
          AND  status = 'ACTIVE'   -- ← only succeeds if still ACTIVE
      `);

    // If rowsAffected = 0, someone else already changed the status
    if (updateResult.rowsAffected[0] === 0)
      return res.status(409).json({ message: 'A closure request was already submitted for this account. Please refresh and try again.' });

    // 5. Notify staff and admins
    const customer = await CustomerModel.findById(customerId);
    await Promise.all([
      notifyStaff({
        customer_id: customerId,
        type: 'ACCOUNT_CLOSURE_REQUESTED',
        message: `Customer "${customer.full_name}" has requested closure of ${account.account_type} account ${account.account_number}.`,
        related_id: Number(accountId),
        related_type: 'ACCOUNT',
      }),
      notifyAdmins({
        type: 'ACCOUNT_CLOSURE_REQUESTED',
        message: `Customer "${customer.full_name}" has requested closure of ${account.account_type} account ${account.account_number}.`,
        related_id: Number(accountId),
        related_type: 'ACCOUNT',
      }),
    ]);

    return res.json({ message: 'Account closure request submitted. Awaiting admin approval.' });

  } catch (err) {
    console.error('[requestAccountClosure]', err);
    return res.status(500).json({ error: err.message });
  }
};

// ================================================================
//  STAFF/ADMIN — GET ALL CLOSURE PENDING ACCOUNTS
//  GET /api/accounts/closure-pending
// ================================================================
const getClosurePendingAccounts = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .query(`
        SELECT
          a.account_id, a.account_number, a.account_type,
          a.balance, a.status, a.opened_date,
          c.customer_id, c.full_name AS customer_name,
          c.email AS customer_email
        FROM  Accounts a
        JOIN  Customers c ON c.customer_id = a.customer_id
        WHERE a.status = 'CLOSURE_PENDING'
        ORDER BY a.opened_date DESC
      `);

    return res.json(result.recordset);

  } catch (err) {
    console.error('[getClosurePendingAccounts]', err);
    return res.status(500).json({ error: err.message });
  }
};

// ================================================================
//  STAFF/ADMIN — APPROVE ACCOUNT CLOSURE
//  PUT /api/accounts/:accountId/approve-closure
// ================================================================
const approveAccountClosure = async (req, res) => {
  const { accountId } = req.params;
  const approverId = req.user.userId;
  const approverRole = req.user.role.toUpperCase();

  try {
    const pool = await getPool();
    const AccountModel = require('../models/Accountmodel');

    // 1. Fetch account
    const account = await AccountModel.findById(accountId);
    if (!account)
      return res.status(404).json({ message: 'Account not found.' });
    if (account.status !== 'CLOSURE_PENDING')
      return res.status(400).json({ message: `Account is not pending closure. Current status: ${account.status}` });

    // 2. Double-check no active loans (safety net)
    const hasLoans = await AccountModel.hasActiveLoans(accountId);
    if (hasLoans)
      return res.status(400).json({
        message: 'Cannot close account. Customer still has an active loan. Ask customer to repay fully first.',
      });

    // 3. Handle balance settlement
    const balance = parseFloat(account.balance);
    const secondAccount = await AccountModel.getSecondAccount(account.customer_id, accountId);

    // Begin DB transaction
    const transaction = pool.transaction();
    await transaction.begin();

    try {
      const request = transaction.request();

      if (balance > 0) {
        if (secondAccount) {
          // Transfer balance to second account
          await request
            .input('from_account_id', sql.Int, account.account_id)
            .input('to_account_id', sql.Int, secondAccount.account_id)
            .input('balance', sql.Decimal(15, 2), balance)
            .query(`
              -- Deduct from closing account
              UPDATE Accounts SET balance = 0 WHERE account_id = @from_account_id;

              -- Credit to second account
              UPDATE Accounts SET balance = balance + @balance WHERE account_id = @to_account_id;

              -- Record transfer transaction
              INSERT INTO Transactions
                (from_account_id, to_account_id, transaction_type, amount, status, description)
              VALUES
                (@from_account_id, @to_account_id, 'INTERNAL_TRANSFER', @balance, 'COMPLETED',
                 'Account closure — balance transferred to alternate account');
            `);
        } else {
          // No second account — final cash withdrawal
          await request
            .input('from_account_id2', sql.Int, account.account_id)
            .input('balance2', sql.Decimal(15, 2), balance)
            .query(`
              -- Zero out balance
              UPDATE Accounts SET balance = 0 WHERE account_id = @from_account_id2;

              -- Record withdrawal transaction
              INSERT INTO Transactions
                (from_account_id, to_account_id, transaction_type, amount, status, description)
              VALUES
                (@from_account_id2, NULL, 'CLOSURE_WITHDRAWAL', @balance2, 'COMPLETED',
                 'Account closure — final cash withdrawal');
            `);
        }
      }

      // 4. Close the account
      const request2 = transaction.request();
      await request2
        .input('account_id', sql.Int, accountId)
        .input('closed_date', sql.DateTime, new Date())
        .query(`
          UPDATE Accounts
          SET status = 'CLOSED', closed_date = @closed_date
          WHERE account_id = @account_id
        `);

      // 5. Record in Account_Approvals
      const request3 = transaction.request();
      await request3
        .input('account_id2', sql.Int, accountId)
        .input('approver_id', sql.Int, approverId)
        .input('approver_role', sql.NVarChar, approverRole)
        .query(`
          INSERT INTO Account_Approvals
            (account_id, approver_id, approver_role, status, remarks)
          VALUES
            (@account_id2, @approver_id, @approver_role, 'CLOSED',
             'Account closure approved and processed.');
        `);

      await transaction.commit();

    } catch (innerErr) {
      await transaction.rollback();
      throw innerErr;
    }

    // 6. Notify customer
    const balanceMsg = balance === 0
      ? 'Your account had zero balance.'
      : secondAccount
        ? `PKR ${balance.toLocaleString()} has been transferred to your ${secondAccount.account_type} account (${secondAccount.account_number}).`
        : `PKR ${balance.toLocaleString()} has been processed as a final cash withdrawal.`;

    await notifyCustomer({
      customer_id: account.customer_id,
      type: 'ACCOUNT_CLOSED',
      message: `Your ${account.account_type} account (${account.account_number}) has been closed. ${balanceMsg}`,
      related_id: Number(accountId),
      related_type: 'ACCOUNT',
    });

    return res.json({
      message: 'Account closed successfully.',
      balance_settled: balance,
      settlement_method: balance === 0 ? 'NO_BALANCE' : secondAccount ? 'INTERNAL_TRANSFER' : 'CASH_WITHDRAWAL',
      transferred_to: secondAccount?.account_number || null,
    });

  } catch (err) {
    console.error('[approveAccountClosure]', err);
    return res.status(500).json({ error: err.message });
  }
};

// ================================================================
//  ADMIN — FREEZE ACCOUNT
//  PUT /api/accounts/:accountId/freeze
// ================================================================
const freezeAccount = async (req, res) => {
  const { accountId } = req.params;
  const { reason } = req.body;
  const adminId = req.user.userId;

  if (!reason?.trim())
    return res.status(400).json({ message: 'Freeze reason is required.' });

  try {
    const pool = await getPool();

    const result = await pool.request()
      .input('account_id', sql.Int, accountId)
      .query(`
        SELECT a.account_id, a.account_number, a.account_type,
               a.status, a.customer_id, c.full_name AS customer_name
        FROM   Accounts a
        JOIN   Customers c ON c.customer_id = a.customer_id
        WHERE  a.account_id = @account_id
      `);

    const account = result.recordset[0];
    if (!account)
      return res.status(404).json({ message: 'Account not found.' });
    if (account.status !== 'ACTIVE')
      return res.status(400).json({ message: `Cannot freeze account. Current status: ${account.status}` });

    await pool.request()
      .input('account_id', sql.Int, accountId)
      .query(`UPDATE Accounts SET status = 'FROZEN' WHERE account_id = @account_id`);

    // Record in Account_Approvals for audit trail
    await pool.request()
      .input('account_id', sql.Int, accountId)
      .input('approver_id', sql.Int, adminId)
      .input('reason', sql.NVarChar, reason)
      .query(`
        INSERT INTO Account_Approvals (account_id, approver_id, approver_role, status, remarks)
        VALUES (@account_id, @approver_id, 'ADMIN', 'FROZEN', @reason)
      `);

    await notifyCustomer({
      customer_id: account.customer_id,
      type: 'ACCOUNT_FROZEN',
      message: `Your ${account.account_type} account (${account.account_number}) has been frozen. Reason: ${reason}. Please contact support.`,
      related_id: Number(accountId),
      related_type: 'ACCOUNT',
    });

    await notifyAdmins({
      type: 'ACCOUNT_FROZEN',
      message: `Account ${account.account_number} (${account.customer_name}) has been frozen by Admin #${adminId}. Reason: ${reason}`,
      related_id: Number(accountId),
      related_type: 'ACCOUNT',
    });

    return res.json({ message: 'Account frozen successfully.' });

  } catch (err) {
    console.error('[freezeAccount]', err);
    return res.status(500).json({ error: err.message });
  }
};

// ================================================================
//  ADMIN — UNFREEZE ACCOUNT
//  PUT /api/accounts/:accountId/unfreeze
// ================================================================
const unfreezeAccount = async (req, res) => {
  const { accountId } = req.params;
  const adminId = req.user.userId;

  try {
    const pool = await getPool();

    const result = await pool.request()
      .input('account_id', sql.Int, accountId)
      .query(`
        SELECT a.account_id, a.account_number, a.account_type,
               a.status, a.customer_id, c.full_name AS customer_name
        FROM   Accounts a
        JOIN   Customers c ON c.customer_id = a.customer_id
        WHERE  a.account_id = @account_id
      `);

    const account = result.recordset[0];
    if (!account)
      return res.status(404).json({ message: 'Account not found.' });
    if (account.status !== 'FROZEN')
      return res.status(400).json({ message: `Account is not frozen. Current status: ${account.status}` });

    await pool.request()
      .input('account_id', sql.Int, accountId)
      .query(`UPDATE Accounts SET status = 'ACTIVE' WHERE account_id = @account_id`);

    // Record in Account_Approvals for audit trail
    await pool.request()
      .input('account_id', sql.Int, accountId)
      .input('approver_id', sql.Int, adminId)
      .query(`
        INSERT INTO Account_Approvals (account_id, approver_id, approver_role, status, remarks)
        VALUES (@account_id, @approver_id, 'ADMIN', 'ACTIVE', 'Account unfrozen by admin.')
      `);

    await notifyCustomer({
      customer_id: account.customer_id,
      type: 'ACCOUNT_UNFROZEN',
      message: `Your ${account.account_type} account (${account.account_number}) has been unfrozen and is now active.`,
      related_id: Number(accountId),
      related_type: 'ACCOUNT',
    });

    await notifyAdmins({
      type: 'ACCOUNT_UNFROZEN',
      message: `Account ${account.account_number} (${account.customer_name}) has been unfrozen by Admin #${adminId}.`,
      related_id: Number(accountId),
      related_type: 'ACCOUNT',
    });

    return res.json({ message: 'Account unfrozen successfully.' });

  } catch (err) {
    console.error('[unfreezeAccount]', err);
    return res.status(500).json({ error: err.message });
  }
};


module.exports = {
  createAccount,
  getPendingAccounts,
  getAllAccounts,
  approveAccount,
  rejectAccount,
  getMyAccounts,
  getAccountsByCustomer,
  getUserAssociatedAccounts,
  requestAccountClosure,
  getClosurePendingAccounts,
  approveAccountClosure,
  freezeAccount,
  unfreezeAccount
};