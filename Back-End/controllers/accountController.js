const { poolPromise, sql } = require("../config/db");
const { createNotification } = require('../utils/notifications');

/* =========================
   USER: VIEW ALL ACCOUNTS
   (Of Customers Approved by This User)
========================= */

const getUserAccounts = async (req, res) => {
  try {
    const userId = req.user.userId;

    const pool = await poolPromise;

    const result = await pool.request().input("userId", sql.Int, userId).query(`
        SELECT 
          a.account_id,
          a.account_type,
          a.balance,
          a.status,
          a.opened_date,
          c.customer_id,
          c.customer_name,
          c.email AS customer_email
        FROM Accounts a
        JOIN Customers c 
          ON a.customer_id = c.customer_id
        WHERE c.approved_by_user = @userId
        ORDER BY a.opened_date DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error("Error in getUserAssociatedAccounts:", err);
    res.status(500).json({ error: err.message });
  }
};

/* =========================
   USER: VIEW PENDING ACCOUNTS
========================= */
const getPendingAccounts = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT 
        a.account_id,
        a.account_type,
        a.status,
        c.customer_name,
        c.email,
        u.full_name AS approved_by
      FROM Accounts a
      JOIN Customers c ON a.customer_id = c.customer_id
      LEFT JOIN Users u ON a.approved_by_user = u.user_id
      WHERE a.status = 'INACTIVE'
    `);

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* =========================
   USER: APPROVE ACCOUNT
========================= */
const approveAccount = async (req, res) => {
  const { accountId } = req.params;
  const userId = req.user.userId;

  try {
    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("accountId", sql.Int, accountId)
      .input("userId", sql.Int, userId).query(`
        UPDATE Accounts
        SET 
          status = 'ACTIVE',
          is_user_approved = 1,
          approved_by_user = @userId
        WHERE account_id = @accountId
          AND status = 'INACTIVE'
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(400).json({
        message: "Account already processed or does not exist",
      });
    }

    // ✅ Notify customer about account approval
    await createNotification(
      accountInfo.recordset[0].customer_id,
      "ACCOUNT_APPROVED",
      `Your ${accountInfo.recordset[0].account_type} account has been APPROVED!`,
      accountId,
    );

    res.json({
      message: "Account approved by user",
      approved_by_user: userId,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* =========================
   USER: REJECT ACCOUNT
========================= */
const rejectAccount = async (req, res) => {
  const { accountId } = req.params;
  const userId = req.user.userId;

  try {
    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("accountId", sql.Int, accountId)
      .input("userId", sql.Int, userId).query(`
        UPDATE Accounts
        SET 
          status = 'REJECTED',
          is_user_approved = 0,
          rejected_by_user = @userId
        WHERE account_id = @accountId
          AND status = 'INACTIVE'
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(400).json({
        message: "Account already processed or does not exist",
      });
    }

    // ✅ Notify customer about account rejection
    await createNotification(
      accountInfo.recordset[0].customer_id,
      "ACCOUNT_REJECTED",
      `Your ${accountInfo.recordset[0].account_type} account has been REJECTED`,
      accountId,
    );

    res.json({
      message: "Account rejected by user",
      rejected_by_user: userId,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* =========================
   CUSTOMER: CREATE ACCOUNT
========================= */
const createAccount = async (req, res) => {
  const { account_type } = req.body;
  const customerId = req.user.customerId;

  try {
    const pool = await poolPromise;

    await pool
      .request()
      .input("customerId", sql.Int, customerId)
      .input("accountType", sql.VarChar, account_type).query(`
        INSERT INTO Accounts (customer_id, account_type, is_user_approved,status)
        VALUES (@customerId, @accountType, 0,'INACTIVE')
      `);

    // ✅ Notify associated user about account creation
    if (associatedUser) {
      await createNotification(
        associatedUser,
        "ACCOUNT_CREATED",
        `Customer created a new ${account_type} account waiting for approval`,
        null,
      );
    }

    res.status(201).json({
      message: "Account created. Awaiting user approval.",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get accounts by customer ID
const getAccountsByCustomer = async (req, res) => {
  const customerId = req.params.customerId;

  try {
    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("customer_id", sql.Int, customerId).query(`
        SELECT 
          account_id as id,
          account_type as accountType,
          account_id as accountNumber,
          balance,
          status,
          opened_date as createdAt
        FROM Accounts
        WHERE customer_id = @customer_id
        ORDER BY opened_date DESC
      `);

    res.json({
      accounts: result.recordset,
    });
  } catch (err) {
    console.error("Error fetching accounts by customer:", err);
    res.status(500).json({ error: err.message });
  }
};

/* =========================
   USER: DELETE REJECTED ACCOUNT
========================= */
const deleteRejectedAccount = async (req, res) => {
  const { accountId } = req.params;
  const userId = req.user.userId;

  try {
    const pool = await poolPromise;

    // First verify the account exists and is rejected
    const checkResult = await pool
      .request()
      .input("accountId", sql.Int, accountId).query(`
        SELECT status, customer_id 
        FROM Accounts 
        WHERE account_id = @accountId
      `);

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ message: "Account not found" });
    }

    const account = checkResult.recordset[0];

    if (account.status !== "REJECTED") {
      return res.status(400).json({
        message: "Only rejected accounts can be deleted",
      });
    }

    // Verify this user has permission (customer is approved by this user)
    const permissionCheck = await pool
      .request()
      .input("customerId", sql.Int, account.customer_id)
      .input("userId", sql.Int, userId).query(`
        SELECT customer_id 
        FROM Customers 
        WHERE customer_id = @customerId 
          AND approved_by_user = @userId
      `);

    if (permissionCheck.recordset.length === 0) {
      return res.status(403).json({
        message: "You do not have permission to delete this account",
      });
    }

    // Delete the account
    await pool
      .request()
      .input("accountId", sql.Int, accountId)
      .query(`DELETE FROM Accounts WHERE account_id = @accountId`);

    res.json({
      message: "Rejected account deleted successfully",
      deleted_account: accountId,
    });
  } catch (err) {
    console.error("Error deleting rejected account:", err);
    res.status(500).json({ error: err.message });
  }
};

/* ✅ VERY IMPORTANT */
module.exports = {
  getPendingAccounts,
  approveAccount,
  rejectAccount,
  createAccount,
  getUserAccounts,
  getAccountsByCustomer,
  deleteRejectedAccount,
};
