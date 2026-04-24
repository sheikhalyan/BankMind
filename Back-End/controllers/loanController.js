const { poolPromise, sql } = require("../config/db");
const { createNotification } = require("../utils/notifications");

/**
 * =========================
 * CUSTOMER APPLY FOR LOAN
 * =========================
 */
const applyLoan = async (req, res) => {
  const { loan_type, loan_amount, duration_months } = req.body;
  const customerId = req.user.customerId;

  if (!loan_type || !loan_amount || !duration_months) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const pool = await poolPromise;

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

    // 💾 Insert Loan
    await pool
      .request()
      .input("customer_id", sql.Int, customerId)
      .input("policy_id", sql.Int, policy.policy_id)
      .input("loan_amount", sql.Decimal(12, 2), loan_amount)
      .input("start_date", sql.Date, startDate)
      .input("end_date", sql.Date, endDate).query(`
        INSERT INTO Loans
        (customer_id, policy_id, loan_amount, start_date, end_date)
        VALUES
        (@customer_id, @policy_id, @loan_amount, @start_date, @end_date)
      `);

    // ✅ Notify associated user about loan application
    if (associatedUser) {
      await createNotification(
        associatedUser,
        "LOAN_APPLICATION",
        `Customer applied for a ${loan_type} loan of $${loan_amount}`,
        null,
      );
    }

    res.status(201).json({
      message: "Loan application submitted successfully",
      status: "PENDING",
      interest_rate: policy.interest_rate,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get loans by customer ID
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
          -- Only include start_date if it's not NULL
          CASE 
            WHEN l.start_date IS NOT NULL THEN l.start_date 
            ELSE NULL 
          END as startDate,
          -- Only include end_date if it's not NULL
          CASE 
            WHEN l.end_date IS NOT NULL THEN l.end_date 
            ELSE NULL 
          END as endDate,
          l.approved_by_user as approvedBy,
          l.approved_at as approvedAt,
          l.rejection_reason as rejectionReason,
          lp.loan_type as loanType,
          lp.interest_rate as interestRate,
          lp.min_amount as minAmount,
          lp.max_amount as maxAmount,
          lp.min_months as minMonths,
          lp.max_months as maxMonths
        FROM Loans l
        JOIN Loan_Policies lp ON l.policy_id = lp.policy_id
        WHERE l.customer_id = @customer_id
        ORDER BY l.created_at DESC
      `);

    res.json({
      loans: result.recordset,
    });
  } catch (err) {
    console.error("❌ Error fetching loans by customer:", err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  applyLoan,
  getLoansByCustomer,
};
