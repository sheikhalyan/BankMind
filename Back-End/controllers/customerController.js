const { poolPromise, sql } = require("../config/db");
const { createNotification, notifyAdmin } = require("../utils/notifications");

// Get customers pending user approval
const getPendingForUserApproval = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
        SELECT customer_id, customer_name, email, phone, address, created_at,
               is_user_approved, is_admin_approved
        FROM Customers
        WHERE is_user_approved = 0
        ORDER BY created_at DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error("Error in getPendingForUserApproval:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get all customers
const getAllCustomers = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
        SELECT 
          c.customer_id,
          c.customer_name,
          c.email,
          c.phone,
          c.address,
          c.created_at,
          c.is_user_approved,
          c.is_admin_approved,
          c.approved_by_user,
          u.full_name as associated_user_name,
          u.email as associated_user_email
        FROM Customers c
        LEFT JOIN Users u ON c.approved_by_user = u.user_id
        ORDER BY c.created_at DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error("Error in getAllCustomers:", err);
    res.status(500).json({ error: err.message });
  }
};

// User approve customer
const userApproveCustomer = async (req, res) => {
  const { customerId } = req.params;
  const approvingUserId = req.user.userId;

  try {
    const pool = await poolPromise;

    // ✅ Get customer info FIRST
    const customerInfoResult = await pool
      .request()
      .input("customerId", sql.Int, customerId)
      .query(`
        SELECT customer_name, email 
        FROM Customers 
        WHERE customer_id = @customerId
      `);

    if (customerInfoResult.recordset.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: "Customer not found" 
      });
    }

    const customerInfo = customerInfoResult.recordset[0];

    // ✅ Update customer
    await pool
      .request()
      .input("customerId", sql.Int, customerId)
      .input("approved_by_user", sql.Int, approvingUserId)
      .query(`
        UPDATE Customers
        SET is_user_approved = 1,
            approved_by_user = @approved_by_user
        WHERE customer_id = @customerId
      `);

    // ✅ Send notification to CUSTOMER
    await createNotification(
      customerId,
      "CUSTOMER_APPROVED_BY_USER",
      `Your registration has been approved by User #${approvingUserId}! Awaiting admin approval.`,
      null,
    );

    // ✅ Notify ADMIN about user approval (using customerInfo)
    await notifyAdmin(
      pool,
      `User #${approvingUserId} approved customer: ${customerInfo.customer_name}`,
      "CUSTOMER_APPROVAL",
    );

    res.status(200).json({
      success: true,
      message: "Customer approved by user",
      approved_by_user: approvingUserId
    });
    
  } catch (err) {
    console.error("Error in userApproveCustomer:", err);
    res.status(500).json({ error: err.message });
  }
};

// User reject customer
const userRejectCustomer = async (req, res) => {
  const { customerId } = req.params;
  const rejectingUserId = req.user.userId;

  try {
    const pool = await poolPromise;

    await pool
      .request()
      .input("customerId", sql.Int, customerId)
      .input("rejected_by_user", sql.Int, rejectingUserId).query(`
        UPDATE Customers
        SET is_user_approved = 0,
            rejected_by_user = @rejected_by_user,
            rejection_reason = 'Rejected by user'
        WHERE customer_id = @customerId
      `);

    // ✅ Notify customer about rejection
    await createNotification(
      customerId,
      "CUSTOMER_REJECTED",
      `Your registration has been rejected by User #${rejectingUserId}`,
      null,
    );

    // ✅ Notify admin about user rejection
    await notifyAdmin(
      pool,
      `User #${rejectingUserId} rejected customer: ${customerInfo.recordset[0]?.customer_name}`,
      "CUSTOMER_REJECTION",
    );

    res.json({
      message: "Customer rejected by user",
      rejected_by_user: rejectingUserId,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * =========================
 * DELETE REJECTED CUSTOMER
 * =========================
 */
const deleteRejectedCustomer = async (req, res) => {
  const { customerId } = req.params;
  const userId = req.user.userId;

  console.log(`🗑️ Deleting rejected customer ${customerId} by user ${userId}`);

  try {
    const pool = await poolPromise;

    // First verify the customer exists, is rejected, and belongs to this user
    const checkResult = await pool
      .request()
      .input("customerId", sql.Int, customerId)
      .input("userId", sql.Int, userId).query(`
        SELECT customer_id 
        FROM Customers 
        WHERE customer_id = @customerId 
          AND approved_by_user = @userId
          AND is_user_approved = 0 
          AND is_admin_approved = 0
      `);

    if (checkResult.recordset.length === 0) {
      console.log(
        `❌ Customer ${customerId} not found or not rejected/authorized`,
      );
      return res.status(404).json({
        message: "Rejected customer not found or you do not have permission",
      });
    }

    // Delete the customer
    const deleteResult = await pool
      .request()
      .input("customerId", sql.Int, customerId)
      .query(`DELETE FROM Customers WHERE customer_id = @customerId`);

    console.log(`✅ Customer ${customerId} deleted successfully`);

    res.json({
      message: "Rejected customer deleted successfully",
      deleted_customer_id: customerId,
    });
  } catch (err) {
    console.error("Error deleting rejected customer:", err);
    res.status(500).json({ error: err.message });
  }
};

// Make sure this is in your module.exports
module.exports = {
  getPendingForUserApproval,
  getAllCustomers,
  userApproveCustomer,
  userRejectCustomer,
  deleteRejectedCustomer,
};
