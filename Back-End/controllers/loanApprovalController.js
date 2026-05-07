const { poolPromise, sql } = require("../config/db");
const { createNotification,notifyAdmins } = require("../utils/notifications");

/**
 * =========================
 * GET ALL LOANS (for user dashboard)
 * =========================
 */
const getAllLoans = async (req, res) => {
  try {
    const pool = await poolPromise;
    const userId = req.user.userId;

    console.log("🔍 getAllLoans called for user:", userId);

    const result = await pool.request().input("user_id", sql.Int, userId)
      .query(`
        SELECT 
          l.loan_id,
          c.customer_name,
          lp.loan_type,
          l.loan_amount,
          lp.interest_rate,
          l.status,
          l.created_at,
          l.approved_at,
          l.rejected_at,
          l.rejection_reason
        FROM Loans l
        JOIN Customers c ON l.customer_id = c.customer_id
        JOIN Loan_Policies lp ON l.policy_id = lp.policy_id
        WHERE c.approved_by_user = @user_id
        ORDER BY 
          CASE l.status
            WHEN 'PENDING' THEN 1
            WHEN 'APPROVED' THEN 2
            WHEN 'REJECTED' THEN 3
            ELSE 4
          END,
          l.created_at DESC
      `);

    console.log(`📊 Found ${result.recordset.length} loans for user ${userId}`);
    res.json(result.recordset);
  } catch (err) {
    console.error("❌ Error in getAllLoans:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * =========================
 * GET PENDING LOANS
 * =========================
 */
const getPendingLoans = async (req, res) => {
  try {
    const pool = await poolPromise;
    const userId = req.user.userId;

    const result = await pool.request().input("user_id", sql.Int, userId)
      .query(`
        SELECT 
          l.loan_id,
          c.customer_name,
          lp.loan_type,
          l.loan_amount,
          lp.interest_rate,
          l.start_date,
          l.end_date,
          l.status,
          l.created_at
        FROM Loans l
        JOIN Customers c ON l.customer_id = c.customer_id
        JOIN Loan_Policies lp ON l.policy_id = lp.policy_id
        WHERE 
          l.status = 'PENDING'
          AND c.approved_by_user = @user_id
        ORDER BY l.created_at DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error("Error in getPendingLoans:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * =========================
 * APPROVE LOAN
 * =========================
 */
const approveLoan = async (req, res) => {
  try {
    const { loanId } = req.params;
    const { approved_amount, duration_months } = req.body;
    const userId = req.user.userId;

    console.log("✅ Approving loan:", {
      loanId,
      approved_amount,
      duration_months,
      userId,
    });

    // If approved_amount and duration_months are not provided, use defaults from policy
    let finalAmount = approved_amount;
    let finalDuration = duration_months;

    const pool = await poolPromise;

    // First, get the loan policy details
    const policyResult = await pool.request().input("loanId", sql.Int, loanId)
      .query(`
        SELECT p.min_amount, p.max_amount, p.min_months, p.max_months
        FROM Loans l
        JOIN Loan_Policies p ON l.policy_id = p.policy_id
        WHERE l.loan_id = @loanId
      `);

    if (policyResult.recordset.length === 0) {
      return res.status(404).json({ message: "Loan policy not found" });
    }

    const policy = policyResult.recordset[0];

    // Use default values if not provided
    if (!finalAmount) {
      finalAmount = policy.min_amount;
    }
    if (!finalDuration) {
      finalDuration = policy.min_months;
    }

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + parseInt(finalDuration));

    // Update the loan
    const result = await pool
      .request()
      .input("loanId", sql.Int, loanId)
      .input("approved_amount", sql.Decimal(10, 2), finalAmount)
      .input("duration_months", sql.Int, finalDuration)
      .input("userId", sql.Int, userId)
      .input("startDate", sql.Date, startDate)
      .input("endDate", sql.Date, endDate).query(`
        UPDATE Loans
        SET 
          status = 'APPROVED',
          loan_amount = @approved_amount,
          approved_by_user = @userId,
          approved_at = GETDATE(),
          start_date = @startDate,
          end_date = @endDate
        WHERE loan_id = @loanId AND status = 'PENDING'
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(400).json({
        message: "Loan not found or already processed",
      });
    }

    // ✅ Notify customer about loan approval
    await createNotification(
      loanInfo.recordset[0].customer_id,
      "LOAN_APPROVED",
      `Your loan of $${approved_amount} has been APPROVED!`,
      loanId,
    );

    res.json({
      message: "✅ Loan approved successfully",
      approved_by_user: userId,
    });
  } catch (err) {
    console.error("❌ Error in approveLoan:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/**
 * =========================
 * REJECT LOAN
 * =========================
 */
const rejectLoan = async (req, res) => {
  try {
    const { loanId } = req.params;
    const { reason } = req.body;
    const userId = req.user.userId;

    console.log("❌ Rejecting loan:", { loanId, reason, userId });

    if (!reason) {
      return res.status(400).json({ message: "Rejection reason is required" });
    }

    const pool = await poolPromise;

    // First, check if we need to handle NOT NULL constraints
    // Update only the columns that exist and allow NULLs
    const result = await pool
      .request()
      .input("loanId", sql.Int, loanId)
      .input("userId", sql.Int, userId)
      .input("reason", sql.NVarChar, reason).query(`
        UPDATE Loans
        SET 
          status = 'REJECTED',
          rejection_reason = @reason,
          rejected_by_user = @userId,
          rejected_at = GETDATE()
          -- Remove start_date and end_date update if they don't allow NULLs
        WHERE loan_id = @loanId AND status = 'PENDING'
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(400).json({
        message: "Loan not found or already processed",
      });
    }

    // ✅ Notify customer about loan rejection
    await createNotification(
      loanInfo.recordset[0].customer_id,
      "LOAN_REJECTED",
      `Your loan of $${loanInfo.recordset[0].loan_amount} has been REJECTED. Reason: ${reason}`,
      loanId,
    );

    res.json({
      message: "❌ Loan rejected successfully",
      rejected_by_user: userId,
    });
  } catch (err) {
    console.error("❌ Error in rejectLoan:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/**
 * =========================
 * DELETE REJECTED LOAN
 * =========================
 */
const deleteRejectedLoan = async (req, res) => {
  try {
    const { loanId } = req.params;
    const userId = req.user.userId;

    console.log(`🗑️ Deleting rejected loan ${loanId} by user ${userId}`);

    const pool = await poolPromise;

    // First verify the loan exists and is rejected
    const checkResult = await pool.request().input("loanId", sql.Int, loanId)
      .query(`
        SELECT status FROM Loans WHERE loan_id = @loanId
      `);

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ message: "Loan not found" });
    }

    if (checkResult.recordset[0].status !== "REJECTED") {
      return res.status(400).json({
        message: "Only rejected loans can be deleted",
      });
    }

    // Delete the loan
    const result = await pool.request().input("loanId", sql.Int, loanId).query(`
        DELETE FROM Loans WHERE loan_id = @loanId
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(400).json({ message: "Failed to delete loan" });
    }

    res.json({
      message: "✅ Rejected loan deleted successfully",
      deleted_loan_id: loanId,
    });
  } catch (err) {
    console.error("❌ Error in deleteRejectedLoan:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  getPendingLoans,
  approveLoan,
  rejectLoan,
  getAllLoans,
  deleteRejectedLoan,
};
