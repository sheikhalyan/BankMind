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
        a.balance, a.status, a.opened_date,
        c.customer_id, c.full_name AS customer_name,
        c.email AS customer_email
      FROM  Accounts  a
      JOIN  Customers c ON c.customer_id = a.customer_id
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

module.exports = {
  createAccount,
  getPendingAccounts,
  getAllAccounts,
  approveAccount,
  rejectAccount,
  getMyAccounts,
  getAccountsByCustomer,
  getUserAssociatedAccounts,
};