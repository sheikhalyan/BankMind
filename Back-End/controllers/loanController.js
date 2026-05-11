const { poolPromise, sql } = require("../config/db");
const { createNotification, notifyAdmins } = require("../utils/notifications");

const applyLoan = async (req, res) => {
  const { loan_type, loan_amount, duration_months } = req.body;
  const customerId = req.user.customerId;

  if (!loan_type || !loan_amount || !duration_months) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const pool = await poolPromise;

    // ✅ CHECK: Does customer already have an active or pending loan?
    const existingLoanResult = await pool
      .request()
      .input("customer_id", sql.Int, customerId).query(`
        SELECT loan_id, status, loan_amount, created_at
        FROM Loans
        WHERE customer_id = @customer_id
          AND status IN ('PENDING', 'APPROVED', 'ACTIVE')
        ORDER BY created_at DESC
      `);

    if (existingLoanResult.recordset.length > 0) {
      const existingLoan = existingLoanResult.recordset[0];
      return res.status(400).json({
        success: false,
        message: `You already have a ${existingLoan.status.toLowerCase()} loan application. Please wait until it is processed before applying for a new loan.`,
        existing_loan: {
          id: existingLoan.loan_id,
          status: existingLoan.status,
          amount: existingLoan.loan_amount,
          applied_on: existingLoan.created_at,
        },
      });
    }

    // 🔍 Fetch Loan Policy
    const policyResult = await pool
      .request()
      .input("loan_type", sql.VarChar, loan_type.toUpperCase()).query(`
        SELECT policy_id, min_amount, max_amount, min_months, max_months, interest_rate
        FROM Loan_Policies
        WHERE loan_type = @loan_type
      `);

    if (policyResult.recordset.length === 0) {
      return res.status(400).json({ message: "Invalid loan type" });
    }

    const policy = policyResult.recordset[0];

    // ✅ Validate Amount
    if (loan_amount < policy.min_amount || loan_amount > policy.max_amount) {
      return res.status(400).json({
        message: `Loan amount must be between ${policy.min_amount} and ${policy.max_amount}`,
      });
    }

    // ✅ Validate Duration
    if (
      duration_months < policy.min_months ||
      duration_months > policy.max_months
    ) {
      return res.status(400).json({
        message: `Duration must be between ${policy.min_months} and ${policy.max_months} months`,
      });
    }

    // 📅 Dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + duration_months);

    // ✅ Get customer info to find associated user
    const customerResult = await pool
      .request()
      .input("customer_id", sql.Int, customerId).query(`
        SELECT customer_name, approved_by_user 
        FROM Customers 
        WHERE customer_id = @customer_id
      `);

    if (customerResult.recordset.length === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const customerInfo = customerResult.recordset[0];
    const associatedUserId = customerInfo.approved_by_user;

    // 💾 Insert Loan
    const insertResult = await pool
      .request()
      .input("customer_id", sql.Int, customerId)
      .input("policy_id", sql.Int, policy.policy_id)
      .input("loan_amount", sql.Decimal(12, 2), loan_amount)
      .input("start_date", sql.Date, startDate)
      .input("end_date", sql.Date, endDate).query(`
        INSERT INTO Loans
        (customer_id, policy_id, loan_amount, start_date, end_date, status)
        OUTPUT INSERTED.loan_id
        VALUES
        (@customer_id, @policy_id, @loan_amount, @start_date, @end_date, 'PENDING')
      `);

    const loanId = insertResult.recordset[0]?.loan_id;

    // ✅ NOTIFY THE USER (approver)
    if (associatedUserId) {
      await createNotification(
        pool,
        associatedUserId,
        null,
        "LOAN_APPLICATION",
        `Customer ${customerInfo.customer_name} applied for a ${loan_type} loan of $${loan_amount}. Please review.`,
        loanId,
      );
    }

    // ✅ NOTIFY THE CUSTOMER
    await createNotification(
      pool,
      null,
      customerId,
      "LOAN_SUBMITTED",
      `Your ${loan_type} loan application of $${loan_amount} has been submitted and is pending approval.`,
      loanId,
    );

    // ✅ Notify all admins
    await notifyAdmins(
      pool,
      "LOAN_APPLICATION",
      `Customer ${customerInfo.customer_name} applied for a ${loan_type} loan of $${loan_amount}`,
      loanId,
    );

    // ✅ Send success response
    res.status(201).json({
      success: true,
      message: "Loan application submitted successfully",
      status: "PENDING",
      interest_rate: policy.interest_rate,
      loan_id: loanId,
    });
  } catch (err) {
    console.error("Error in applyLoan:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

const getLoansByCustomer = async (req, res) => {
  const customerId = req.params.customerId;

  try {
    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("customer_id", sql.Int, customerId).query(`
        SELECT 
          l.loan_id as id,
          l.loan_amount as amount,
          l.status,
          l.created_at as createdAt,
          CASE WHEN l.start_date IS NOT NULL THEN l.start_date ELSE NULL END as startDate,
          CASE WHEN l.end_date IS NOT NULL THEN l.end_date ELSE NULL END as endDate,
          l.approved_by_user as approvedBy,
          l.approved_at as approvedAt,
          l.rejection_reason as rejectionReason,
          lp.loan_type as loanType,
          lp.interest_rate as interestRate
        FROM Loans l
        JOIN Loan_Policies lp ON l.policy_id = lp.policy_id
        WHERE l.customer_id = @customer_id
        ORDER BY l.created_at DESC
      `);

    res.status(200).json({
      success: true,
      loans: result.recordset,
    });
  } catch (err) {
    console.error("Error fetching loans by customer:", err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  applyLoan,
  getLoansByCustomer,
};
