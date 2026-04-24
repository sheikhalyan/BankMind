const { poolPromise, sql } = require("../config/db");
const { createNotification } = require("../utils/notifications");

// Get pending users
const getPendingUsers = async (req, res) => {
  try {
    console.log("🔍 getPendingUsers called");
    const pool = await poolPromise;
    console.log("✅ Database connected");

    const result = await pool.request().query(`
        SELECT user_id, full_name, email, created_at 
        FROM Users 
        WHERE is_approved = 0 AND (is_rejected IS NULL OR is_rejected = 0)
        ORDER BY created_at DESC
      `);

    console.log(`✅ Found ${result.recordset.length} pending users`);
    res.json(result.recordset);
  } catch (err) {
    console.error("❌ Error in getPendingUsers:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get pending customers
const getPendingCustomers = async (req, res) => {
  try {
    console.log("🔍 getPendingCustomers called");
    const pool = await poolPromise;
    console.log("✅ Database connected");

    const result = await pool.request().query(`
        SELECT 
          customer_id, 
          customer_name, 
          email, 
          phone, 
          address, 
          created_at, 
          is_user_approved, 
          is_admin_approved
        FROM Customers 
        WHERE is_admin_approved = 0
        ORDER BY created_at DESC
      `);

    console.log(`✅ Found ${result.recordset.length} pending customers`);
    res.json(result.recordset);
  } catch (err) {
    console.error("❌ Error in getPendingCustomers:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get rejected users
const getRejectedUsers = async (req, res) => {
  try {
    console.log("🔍 getRejectedUsers called");
    const pool = await poolPromise;
    console.log("✅ Database connected");

    // First check if is_rejected column exists
    const columnCheck = await pool.request().query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'is_rejected'
      `);

    console.log("Column check result:", columnCheck.recordset);

    const result = await pool.request().query(`
        SELECT user_id, full_name, email, created_at
        FROM Users 
        WHERE is_rejected = 1
        ORDER BY created_at DESC
      `);

    console.log(`✅ Found ${result.recordset.length} rejected users`);
    res.json(result.recordset);
  } catch (err) {
    console.error("❌ Error in getRejectedUsers:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get rejected customers
const getRejectedCustomers = async (req, res) => {
  try {
    console.log("🔍 getRejectedCustomers called");
    const pool = await poolPromise;
    console.log("✅ Database connected");

    const result = await pool.request().query(`
        SELECT 
          customer_id, 
          customer_name, 
          email, 
          phone, 
          created_at
        FROM Customers 
        WHERE is_admin_approved = 0 AND is_user_approved = 0
        ORDER BY created_at DESC
      `);

    console.log(`✅ Found ${result.recordset.length} rejected customers`);
    res.json(result.recordset);
  } catch (err) {
    console.error("❌ Error in getRejectedCustomers:", err);
    res.status(500).json({ error: err.message });
  }
};

// Approve user
const approveUser = async (req, res) => {
  const userId = req.params.id;
  try {
    console.log(`🔍 Approving user ${userId}`);
    const pool = await poolPromise;
    await pool.request().input("user_id", sql.Int, userId).query(`
        UPDATE Users
        SET is_approved = 1
        WHERE user_id = @user_id
      `);
    console.log(`✅ User ${userId} approved`);
    res.json({ message: "User approved successfully" });
  } catch (err) {
    console.error("❌ Error in approveUser:", err);
    res.status(500).json({ error: err.message });
  }
};

// Reject user
const rejectUser = async (req, res) => {
  const userId = req.params.id;
  try {
    console.log(`🔍 Rejecting user ${userId}`);
    const pool = await poolPromise;
    await pool.request().input("user_id", sql.Int, userId).query(`
        UPDATE Users 
        SET is_approved = 0,
            is_rejected = 1
        WHERE user_id = @user_id
      `);
    console.log(`✅ User ${userId} rejected`);
    res.json({ message: "User rejected successfully" });
  } catch (err) {
    console.error("❌ Error in rejectUser:", err);
    res.status(500).json({ error: err.message });
  }
};

// Delete rejected user
const deleteRejectedUser = async (req, res) => {
  const userId = req.params.id;
  try {
    console.log(`🔍 Deleting rejected user ${userId}`);
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("user_id", sql.Int, userId)
      .query(`DELETE FROM Users WHERE user_id = @user_id AND is_rejected = 1`);

    console.log(`✅ Deleted ${result.rowsAffected[0]} user`);
    res.json({ message: "Rejected user deleted permanently" });
  } catch (err) {
    console.error("❌ Error in deleteRejectedUser:", err);
    res.status(500).json({ error: err.message });
  }
};

// Admin approves customer
const adminApproveCustomer = async (req, res) => {
  const customerId = req.params.id;
  try {
    console.log(`🔍 Admin approving customer ${customerId}`);
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("customer_id", sql.Int, customerId).query(`
        UPDATE Customers
        SET is_admin_approved = 1
        WHERE customer_id = @customer_id
          AND is_user_approved = 1
      `);

    // ✅ Notify customer about admin approval
    await createNotification(
      customerId,
      "CUSTOMER_FULLY_APPROVED",
      `Congratulations! Your registration has been fully approved. You can now log in and create accounts.`,
      null,
    );

    if (result.rowsAffected[0] === 0) {
      return res
        .status(400)
        .json({ message: "Customer must be approved by a user first" });
    }
    console.log(`✅ Customer ${customerId} approved by admin`);
    res.json({ message: "Customer approved by admin successfully" });
  } catch (err) {
    console.error("❌ Error in adminApproveCustomer:", err);
    res.status(500).json({ error: err.message });
  }
};

// Reject customer
const rejectCustomer = async (req, res) => {
  const customerId = req.params.id;
  try {
    console.log(`🔍 Admin rejecting customer ${customerId}`);
    const pool = await poolPromise;
    await pool.request().input("customer_id", sql.Int, customerId).query(`
        UPDATE Customers 
        SET is_admin_approved = 0,
            is_user_approved = 0
        WHERE customer_id = @customer_id
      `);

    // ✅ Notify customer about admin rejection
    await createNotification(
      customerId,
      "CUSTOMER_ADMIN_REJECTED",
      `Your registration has been rejected by admin.`,
      null,
    );

    console.log(`✅ Customer ${customerId} rejected`);
    res.json({ message: "Customer rejected successfully" });
  } catch (err) {
    console.error("❌ Error in rejectCustomer:", err);
    res.status(500).json({ error: err.message });
  }
};

// Delete rejected customer
const deleteRejectedCustomer = async (req, res) => {
  const customerId = req.params.id;
  try {
    console.log(`🔍 Deleting rejected customer ${customerId}`);
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("customer_id", sql.Int, customerId).query(`
        DELETE FROM Customers 
        WHERE customer_id = @customer_id 
          AND is_admin_approved = 0 
          AND is_user_approved = 0
      `);
    console.log(`✅ Deleted ${result.rowsAffected[0]} customer`);
    res.json({ message: "Rejected customer deleted permanently" });
  } catch (err) {
    console.error("❌ Error in deleteRejectedCustomer:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get all users (for admin dashboard)
const getAllUsers = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
        SELECT user_id, full_name, email, created_at, is_approved, is_rejected
        FROM Users 
        ORDER BY created_at DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all customers (for admin dashboard)

// Get all customers (for admin dashboard)
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
          u.full_name as approved_by_user_name
        FROM Customers c
        LEFT JOIN Users u ON c.approved_by_user = u.user_id
        ORDER BY c.created_at DESC
      `);

    console.log(
      "📊 Customers from DB:",
      result.recordset.map((c) => ({
        id: c.customer_id,
        name: c.customer_name,
        approved_by_user: c.approved_by_user,
        approved_by_user_name: c.approved_by_user_name,
      })),
    );

    res.json(result.recordset);
  } catch (err) {
    console.error("Error in getAllCustomers:", err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getPendingUsers,
  getPendingCustomers,
  getRejectedUsers,
  getRejectedCustomers,
  approveUser,
  rejectUser,
  deleteRejectedUser,
  adminApproveCustomer,
  rejectCustomer,
  deleteRejectedCustomer,
  getAllUsers,
  getAllCustomers,
};
