const { poolPromise, sql } = require("../config/db");
const { createNotification, notifyAdmins } = require("../utils/notifications");

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

    const pool = await poolPromise;

    // ✅ FIRST: Get loan and customer info
    const loanInfoResult = await pool.request().input("loanId", sql.Int, loanId)
      .query(`
        SELECT 
          l.loan_id,
          l.customer_id,
          l.loan_amount as original_amount,
          lp.policy_id,
          lp.min_amount,
          lp.max_amount,
          lp.min_months,
          lp.max_months,
          lp.loan_type,
          lp.interest_rate,
          c.customer_name,
          c.approved_by_user
        FROM Loans l
        JOIN Loan_Policies lp ON l.policy_id = lp.policy_id
        JOIN Customers c ON l.customer_id = c.customer_id
        WHERE l.loan_id = @loanId
      `);

    if (loanInfoResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Loan not found",
      });
    }

    const loanInfo = loanInfoResult.recordset[0];

    // Check if loan is still pending
    const statusCheck = await pool
      .request()
      .input("loanId", sql.Int, loanId)
      .query(`SELECT status FROM Loans WHERE loan_id = @loanId`);

    if (statusCheck.recordset[0]?.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Loan already processed",
      });
    }

    // Use default values if not provided
    let finalAmount = approved_amount || loanInfo.min_amount;
    let finalDuration = duration_months || loanInfo.min_months;

    // Validate amount
    if (
      finalAmount < loanInfo.min_amount ||
      finalAmount > loanInfo.max_amount
    ) {
      return res.status(400).json({
        success: false,
        message: `Approved amount must be between ${loanInfo.min_amount} and ${loanInfo.max_amount}`,
      });
    }

    // Validate duration
    if (
      finalDuration < loanInfo.min_months ||
      finalDuration > loanInfo.max_months
    ) {
      return res.status(400).json({
        success: false,
        message: `Duration must be between ${loanInfo.min_months} and ${loanInfo.max_months} months`,
      });
    }

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + parseInt(finalDuration));

    // ✅ SECOND: Update the loan
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
          approved_by_user = @userId,    -- ✅ CORRECT
          approved_at = GETDATE(),       -- ✅ CORRECT
          -- Clear rejection fields
          rejection_reason = NULL,
          rejected_by_user = NULL,
          rejected_at = NULL
        WHERE loan_id = @loanId AND status = 'PENDING'
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(400).json({
        success: false,
        message: "Loan not found or already processed",
      });
    }

    // ✅ THIRD: Notify customer about loan approval
    await createNotification(
      pool,
      null,
      loanInfo.customer_id,
      "LOAN_APPROVED",
      `Your ${loanInfo.loan_type} loan of $${finalAmount} has been APPROVED! Interest rate: ${loanInfo.interest_rate}%`,
      loanId,
    );

    // ✅ FOURTH: Notify the user who approved
    await createNotification(
      pool,
      userId,
      null,
      "LOAN_REVIEWED",
      `You APPROVED ${loanInfo.customer_name}'s ${loanInfo.loan_type} loan of $${finalAmount}`,
      loanId,
    );

    res.status(200).json({
      success: true,
      message: "✅ Loan approved successfully",
      approved_by_user: userId,
      approved_amount: finalAmount,
      duration_months: finalDuration,
    });
  } catch (err) {
    console.error("❌ Error in approveLoan:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
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
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    const pool = await poolPromise;

    // ✅ FIRST: Get loan and customer info
    const loanInfoResult = await pool.request().input("loanId", sql.Int, loanId)
      .query(`
        SELECT 
          l.loan_id,
          l.customer_id,
          l.loan_amount,
          lp.loan_type,
          c.customer_name,
          c.approved_by_user
        FROM Loans l
        JOIN Loan_Policies lp ON l.policy_id = lp.policy_id
        JOIN Customers c ON l.customer_id = c.customer_id
        WHERE l.loan_id = @loanId
      `);

    if (loanInfoResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Loan not found",
      });
    }

    const loanInfo = loanInfoResult.recordset[0];

    // ✅ SECOND: Update loan - USE CORRECT COLUMNS!
    const result = await pool
      .request()
      .input("loanId", sql.Int, loanId)
      .input("userId", sql.Int, userId)
      .input("reason", sql.NVarChar, reason).query(`
        UPDATE Loans
        SET 
          status = 'REJECTED',
          rejection_reason = @reason,
          rejected_by_user = @userId,    -- ✅ CORRECT
          rejected_at = GETDATE(),       -- ✅ CORRECT
          -- Clear approval fields if they exist
          approved_by_user = NULL,
          approved_at = NULL
        WHERE loan_id = @loanId AND status = 'PENDING'
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(400).json({
        success: false,
        message: "Loan not found or already processed",
      });
    }

    // ✅ THIRD: Notify customer
    await createNotification(
      pool,
      null,
      loanInfo.customer_id,
      "LOAN_REJECTED",
      `Your ${loanInfo.loan_type} loan of $${loanInfo.loan_amount} has been REJECTED. Reason: ${reason}`,
      loanId,
    );

    // ✅ FOURTH: Notify the user who rejected
    await createNotification(
      pool,
      userId,
      null,
      "LOAN_REVIEWED",
      `You REJECTED ${loanInfo.customer_name}'s ${loanInfo.loan_type} loan of $${loanInfo.loan_amount}. Reason: ${reason}`,
      loanId,
    );

    res.status(200).json({
      success: true,
      message: "❌ Loan rejected successfully",
      rejected_by_user: userId,
      reason: reason,
    });
  } catch (err) {
    console.error("❌ Error in rejectLoan:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
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
        SELECT l.status, l.customer_id, c.customer_name, lp.loan_type
        FROM Loans l
        JOIN Customers c ON l.customer_id = c.customer_id
        JOIN Loan_Policies lp ON l.policy_id = lp.policy_id
        WHERE l.loan_id = @loanId
      `);

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Loan not found",
      });
    }

    const loanInfo = checkResult.recordset[0];

    if (loanInfo.status !== "REJECTED") {
      return res.status(400).json({
        success: false,
        message: "Only rejected loans can be deleted",
      });
    }

    // Delete the loan
    const result = await pool.request().input("loanId", sql.Int, loanId).query(`
        DELETE FROM Loans WHERE loan_id = @loanId
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(400).json({
        success: false,
        message: "Failed to delete loan",
      });
    }

    // Notify that loan was deleted
    await createNotification(
      pool,
      userId,
      null,
      "LOAN_DELETED",
      `You deleted ${loanInfo.customer_name}'s ${loanInfo.loan_type} rejected loan`,
      loanId,
    );

    res.status(200).json({
      success: true,
      message: "✅ Rejected loan deleted successfully",
      deleted_loan_id: loanId,
    });
  } catch (err) {
    console.error("❌ Error in deleteRejectedLoan:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

module.exports = {
  getPendingLoans,
  approveLoan,
  rejectLoan,
  getAllLoans,
  deleteRejectedLoan,
};
