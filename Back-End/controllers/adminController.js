const { getPool, sql } = require('../config/db');
const UserModel = require('../models/Usermodel');
const CustomerModel = require('../models/Customermodel');
const {
  notifyUser,
  notifyAdmins,
  notifyAllStaff,
  notifyCustomer,
} = require('../utils/notifications');

// ================================================================
//  STAFF MANAGEMENT
// ================================================================

/**
 * GET /api/admin/staff
 * Query: ?status=PENDING|ACTIVE|REJECTED|SUSPENDED
 */
const getAllStaff = async (req, res) => {
  try {
    const { status } = req.query;
    const staff = await UserModel.getAll({ role: 'STAFF', status: status || undefined });
    return res.json(staff);
  } catch (err) {
    console.error('[getAllStaff]', err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/admin/staff/pending
 */
const getPendingStaff = async (req, res) => {
  try {
    const staff = await UserModel.getAll({ role: 'STAFF', status: 'PENDING' });
    return res.json(staff);
  } catch (err) {
    console.error('[getPendingStaff]', err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/admin/staff/:userId
 */
const getStaffById = async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.userId);
    if (!user || user.role !== 'STAFF')
      return res.status(404).json({ message: 'Staff member not found.' });
    return res.json(user);
  } catch (err) {
    console.error('[getStaffById]', err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/admin/staff
 * Body: { fullName, email, password }
 * Admin creates staff directly → status = ACTIVE immediately
 */
const createStaff = async (req, res) => {
  const { fullName, email, password } = req.body;
  if (!fullName || !email || !password)
    return res.status(400).json({ message: 'fullName, email and password are required.' });

  try {
    const bcrypt = require('bcryptjs');
    const existing = await UserModel.findByEmail(email);
    if (existing)
      return res.status(409).json({ message: 'Email already registered.' });

    const password_hash = await bcrypt.hash(password, 10);
    const userId = await UserModel.create({ full_name: fullName, email, password_hash, role: 'STAFF' });

    // Admin creates staff as ACTIVE immediately
    await UserModel.updateStatus(userId, 'ACTIVE');

    // Notify the new staff member
    await notifyUser({
      user_id: userId,
      type: 'STAFF_CREATED',
      message: `Welcome to BankMind! Your staff account has been created. Email: ${email}`,
      related_id: userId,
      related_type: 'USER',
    });

    return res.status(201).json({ message: 'Staff account created successfully.', user_id: userId });
  } catch (err) {
    console.error('[createStaff]', err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * PUT /api/admin/staff/:userId/approve
 * For staff who self-registered (if that flow exists)
 */
const approveStaff = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await UserModel.findById(userId);
    if (!user || user.role !== 'STAFF')
      return res.status(404).json({ message: 'Staff member not found.' });
    if (user.status === 'ACTIVE')
      return res.status(400).json({ message: 'Already active.' });
    if (user.status === 'REJECTED')
      return res.status(400).json({ message: 'Cannot approve a rejected account.' });

    await UserModel.updateStatus(Number(userId), 'ACTIVE');

    await notifyUser({
      user_id: Number(userId),
      type: 'STAFF_APPROVED',
      message: 'Your account has been approved. You can now log in to BankMind.',
      related_id: Number(userId),
      related_type: 'USER',
    });

    return res.json({ message: 'Staff member approved.' });
  } catch (err) {
    console.error('[approveStaff]', err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * PUT /api/admin/staff/:userId/reject
 * Body: { remarks? }
 */
const rejectStaff = async (req, res) => {
  const { userId } = req.params;
  const { remarks } = req.body;
  try {
    const user = await UserModel.findById(userId);
    if (!user || user.role !== 'STAFF')
      return res.status(404).json({ message: 'Staff member not found.' });
    if (user.status === 'REJECTED')
      return res.status(400).json({ message: 'Already rejected.' });

    await UserModel.updateStatus(Number(userId), 'REJECTED');

    await notifyUser({
      user_id: Number(userId),
      type: 'STAFF_REJECTED',
      message: `Your account was rejected.${remarks ? ' Reason: ' + remarks : ''}`,
      related_id: Number(userId),
      related_type: 'USER',
    });

    return res.json({ message: 'Staff member rejected.' });
  } catch (err) {
    console.error('[rejectStaff]', err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * PUT /api/admin/staff/:userId/suspend
 */
const suspendStaff = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await UserModel.findById(userId);
    if (!user || user.role !== 'STAFF')
      return res.status(404).json({ message: 'Staff member not found.' });
    if (user.status === 'SUSPENDED')
      return res.status(400).json({ message: 'Already suspended.' });

    await UserModel.updateStatus(Number(userId), 'SUSPENDED');

    await notifyUser({
      user_id: Number(userId),
      type: 'STAFF_SUSPENDED',
      message: 'Your account has been suspended. Please contact the administrator.',
      related_id: Number(userId),
      related_type: 'USER',
    });

    return res.json({ message: 'Staff member suspended.' });
  } catch (err) {
    console.error('[suspendStaff]', err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * PUT /api/admin/staff/:userId/reactivate
 */
const reactivateStaff = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await UserModel.findById(userId);
    if (!user || user.role !== 'STAFF')
      return res.status(404).json({ message: 'Staff member not found.' });
    if (user.status === 'ACTIVE')
      return res.status(400).json({ message: 'Already active.' });

    await UserModel.updateStatus(Number(userId), 'ACTIVE');

    await notifyUser({
      user_id: Number(userId),
      type: 'STAFF_REACTIVATED',
      message: 'Your account has been reactivated. Welcome back!',
      related_id: Number(userId),
      related_type: 'USER',
    });

    return res.json({ message: 'Staff member reactivated.' });
  } catch (err) {
    console.error('[reactivateStaff]', err);
    return res.status(500).json({ error: err.message });
  }
};


// ================================================================
//  CUSTOMER MANAGEMENT (Admin — final approval level)
// ================================================================

/**
 * GET /api/admin/customers
 * Query: ?status=PENDING|ACTIVE|REJECTED|SUSPENDED
 */
const getAllCustomers = async (req, res) => {
  try {
    const { status } = req.query;
    const pool = await getPool();
    const req2 = pool.request();

    let where = 'WHERE 1=1';
    if (status) {
      req2.input('status', sql.NVarChar, status);
      where += ' AND c.status = @status';
    }

    const result = await req2.query(`
      SELECT
        c.customer_id, c.full_name, c.email, c.phone,
        c.city, c.country, c.status, c.created_at,
        c.assigned_staff_id,
        u.full_name          AS assigned_staff_name,
        staff_ap.status      AS staff_approval_status,
        staff_ap.actioned_at AS staff_approved_at,
        staff_u.full_name    AS staff_name,
        admin_ap.status      AS admin_approval_status
      FROM Customers c
      LEFT JOIN Users u
             ON u.user_id = c.assigned_staff_id
      LEFT JOIN Customer_Approvals staff_ap
             ON staff_ap.customer_id   = c.customer_id
            AND staff_ap.approver_role = 'STAFF'
      LEFT JOIN Users staff_u
             ON staff_u.user_id = staff_ap.approver_id
      LEFT JOIN Customer_Approvals admin_ap
             ON admin_ap.customer_id   = c.customer_id
            AND admin_ap.approver_role = 'ADMIN'
      ${where}
      ORDER BY c.created_at DESC
    `);

    return res.json(result.recordset);
  } catch (err) {
    console.error('[getAllCustomers]', err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/admin/customers/pending-admin-approval
 * Customers staff approved but admin hasn't actioned yet
 */
const getPendingAdminApproval = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT
        c.customer_id, c.full_name, c.email, c.phone,
        c.city, c.country, c.status, c.created_at,
        ca_staff.actioned_at  AS staff_approved_at,
        u.full_name           AS staff_name
      FROM Customers c
      JOIN Customer_Approvals ca_staff
        ON  ca_staff.customer_id   = c.customer_id
        AND ca_staff.approver_role = 'STAFF'
        AND ca_staff.status        = 'APPROVED'
      JOIN Users u ON u.user_id = ca_staff.approver_id
      WHERE c.status = 'PENDING'
        AND NOT EXISTS (
          SELECT 1 FROM Customer_Approvals ca_admin
          WHERE ca_admin.customer_id   = c.customer_id
            AND ca_admin.approver_role = 'ADMIN'
        )
      ORDER BY ca_staff.actioned_at ASC
    `);
    return res.json(result.recordset);
  } catch (err) {
    console.error('[getPendingAdminApproval]', err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * PUT /api/admin/customers/:customerId/approve
 * Admin gives final approval → customer status = ACTIVE
 */
const adminApproveCustomer = async (req, res) => {
  const { customerId } = req.params;
  const adminId = req.user.userId;

  try {
    const pool = await getPool();
    const customer = await CustomerModel.findById(customerId);
    if (!customer)
      return res.status(404).json({ message: 'Customer not found.' });
    if (customer.status === 'ACTIVE')
      return res.status(400).json({ message: 'Customer already active.' });

    // Check staff has already approved
    const staffApproval = await pool.request()
      .input('customer_id', sql.Int, Number(customerId))
      .query(`
        SELECT approval_id FROM Customer_Approvals
        WHERE customer_id = @customer_id
          AND approver_role = 'STAFF'
          AND status = 'APPROVED'
      `);

    if (staffApproval.recordset.length === 0)
      return res.status(400).json({ message: 'Staff must approve before admin.' });

    // Insert admin approval row
    await pool.request()
      .input('customer_id', sql.Int, Number(customerId))
      .input('approver_id', sql.Int, adminId)
      .input('approver_role', sql.NVarChar, 'ADMIN')
      .input('status', sql.NVarChar, 'APPROVED')
      .query(`
        INSERT INTO Customer_Approvals (customer_id, approver_id, approver_role, status)
        VALUES (@customer_id, @approver_id, @approver_role, @status)
      `);

    // Activate customer
    await CustomerModel.updateStatus(Number(customerId), 'ACTIVE');

    // Notify customer
    await notifyCustomer({
      customer_id: Number(customerId),
      type: 'REGISTRATION_APPROVED',
      message: 'Your registration has been fully approved. Welcome to BankMind!',
      related_id: Number(customerId),
      related_type: 'CUSTOMER',
    });

    return res.json({ message: 'Customer approved and activated.' });
  } catch (err) {
    console.error('[adminApproveCustomer]', err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * PUT /api/admin/customers/:customerId/reject
 * Body: { remarks }
 */
const adminRejectCustomer = async (req, res) => {
  const { customerId } = req.params;
  const { remarks } = req.body;
  const adminId = req.user.userId;

  try {
    const pool = await getPool();
    const customer = await CustomerModel.findById(customerId);
    if (!customer)
      return res.status(404).json({ message: 'Customer not found.' });

    await pool.request()
      .input('customer_id', sql.Int, Number(customerId))
      .input('approver_id', sql.Int, adminId)
      .input('approver_role', sql.NVarChar, 'ADMIN')
      .input('status', sql.NVarChar, 'REJECTED')
      .input('remarks', sql.NVarChar, remarks || null)
      .query(`
        INSERT INTO Customer_Approvals (customer_id, approver_id, approver_role, status, remarks)
        VALUES (@customer_id, @approver_id, @approver_role, @status, @remarks)
      `);

    await CustomerModel.updateStatus(Number(customerId), 'REJECTED');

    await notifyCustomer({
      customer_id: Number(customerId),
      type: 'REGISTRATION_REJECTED',
      message: `Your registration was rejected.${remarks ? ' Reason: ' + remarks : ''}`,
      related_id: Number(customerId),
      related_type: 'CUSTOMER',
    });

    return res.json({ message: 'Customer rejected.' });
  } catch (err) {
    console.error('[adminRejectCustomer]', err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * PUT /api/admin/customers/:customerId/suspend
 */
const suspendCustomer = async (req, res) => {
  const { customerId } = req.params;
  try {
    const customer = await CustomerModel.findById(customerId);
    if (!customer)
      return res.status(404).json({ message: 'Customer not found.' });
    if (customer.status === 'SUSPENDED')
      return res.status(400).json({ message: 'Already suspended.' });

    await CustomerModel.updateStatus(Number(customerId), 'SUSPENDED');

    await notifyCustomer({
      customer_id: Number(customerId),
      type: 'ACCOUNT_SUSPENDED',
      message: 'Your account has been suspended. Please contact support.',
    });

    return res.json({ message: 'Customer suspended.' });
  } catch (err) {
    console.error('[suspendCustomer]', err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * PUT /api/admin/customers/:customerId/reactivate
 */
const reactivateCustomer = async (req, res) => {
  const { customerId } = req.params;
  try {
    const customer = await CustomerModel.findById(customerId);
    if (!customer)
      return res.status(404).json({ message: 'Customer not found.' });
    if (customer.status === 'ACTIVE')
      return res.status(400).json({ message: 'Already active.' });

    await CustomerModel.updateStatus(Number(customerId), 'ACTIVE');

    await notifyCustomer({
      customer_id: Number(customerId),
      type: 'ACCOUNT_REACTIVATED',
      message: 'Your account has been reactivated. Welcome back!',
    });

    return res.json({ message: 'Customer reactivated.' });
  } catch (err) {
    console.error('[reactivateCustomer]', err);
    return res.status(500).json({ error: err.message });
  }
};


// ================================================================
//  LOAN POLICY MANAGEMENT
// ================================================================

/**
 * GET /api/admin/loan-policies
 */
const getLoanPolicies = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .query(`SELECT * FROM Loan_Policies ORDER BY created_at DESC`);
    return res.json(result.recordset);
  } catch (err) {
    console.error('[getLoanPolicies]', err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/admin/loan-policies
 * Body: { loan_type, min_amount, max_amount, min_months, max_months, interest_rate }
 */
const createLoanPolicy = async (req, res) => {
  const { loan_type, min_amount, max_amount, min_months, max_months, interest_rate } = req.body;
  if (!loan_type || !min_amount || !max_amount || !min_months || !max_months || !interest_rate)
    return res.status(400).json({ message: 'All policy fields are required.' });

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('loan_type', sql.NVarChar, loan_type.toUpperCase())
      .input('min_amount', sql.Decimal(15, 2), min_amount)
      .input('max_amount', sql.Decimal(15, 2), max_amount)
      .input('min_months', sql.Int, min_months)
      .input('max_months', sql.Int, max_months)
      .input('interest_rate', sql.Decimal(5, 2), interest_rate)
      .query(`
        INSERT INTO Loan_Policies (loan_type, min_amount, max_amount, min_months, max_months, interest_rate)
        OUTPUT INSERTED.policy_id
        VALUES (@loan_type, @min_amount, @max_amount, @min_months, @max_months, @interest_rate)
      `);

    const policy_id = result.recordset[0].policy_id;

    await notifyAllStaff({
      type: 'LOAN_POLICY_CREATED',
      message: `New loan policy created: ${loan_type.toUpperCase()}`,
      related_id: policy_id,
      related_type: 'LOAN_POLICY',
    });

    return res.status(201).json({ message: 'Loan policy created.', policy_id });
  } catch (err) {
    console.error('[createLoanPolicy]', err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * PUT /api/admin/loan-policies/:policyId
 */
const updateLoanPolicy = async (req, res) => {
  const { policyId } = req.params;
  const { min_amount, max_amount, min_months, max_months, interest_rate } = req.body;

  try {
    const pool = await getPool();
    await pool.request()
      .input('policy_id', sql.Int, Number(policyId))
      .input('min_amount', sql.Decimal(15, 2), min_amount)
      .input('max_amount', sql.Decimal(15, 2), max_amount)
      .input('min_months', sql.Int, min_months)
      .input('max_months', sql.Int, max_months)
      .input('interest_rate', sql.Decimal(5, 2), interest_rate)
      .query(`
        UPDATE Loan_Policies
        SET min_amount    = @min_amount,
            max_amount    = @max_amount,
            min_months    = @min_months,
            max_months    = @max_months,
            interest_rate = @interest_rate,
            updated_at    = GETDATE()
        WHERE policy_id = @policy_id
      `);

    await notifyAllStaff({
      type: 'LOAN_POLICY_UPDATED',
      message: `Loan policy #${policyId} has been updated.`,
      related_id: Number(policyId),
      related_type: 'LOAN_POLICY',
    });

    return res.json({ message: 'Loan policy updated.' });
  } catch (err) {
    console.error('[updateLoanPolicy]', err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * PUT /api/admin/loan-policies/:policyId/toggle
 * Activates or deactivates a policy (is_active flag)
 */
const toggleLoanPolicy = async (req, res) => {
  const { policyId } = req.params;
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('policy_id', sql.Int, Number(policyId))
      .query(`
        UPDATE Loan_Policies
        SET is_active  = CASE WHEN is_active = 1 THEN 0 ELSE 1 END,
            updated_at = GETDATE()
        OUTPUT INSERTED.is_active, INSERTED.loan_type
        WHERE policy_id = @policy_id
      `);

    const { is_active, loan_type } = result.recordset[0];
    const state = is_active ? 'activated' : 'deactivated';

    await notifyAllStaff({
      type: 'LOAN_POLICY_TOGGLED',
      message: `Loan policy ${loan_type} has been ${state}.`,
      related_id: Number(policyId),
      related_type: 'LOAN_POLICY',
    });

    return res.json({ message: `Policy ${state}.`, is_active });
  } catch (err) {
    console.error('[toggleLoanPolicy]', err);
    return res.status(500).json({ error: err.message });
  }
};


// ================================================================
//  DASHBOARD STATS
// ================================================================

/**
 * GET /api/admin/stats
 */
const getDashboardStats = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT
        -- Staff
        (SELECT COUNT(*) FROM Users WHERE role = 'STAFF')                         AS total_staff,
        (SELECT COUNT(*) FROM Users WHERE role = 'STAFF' AND status = 'PENDING')  AS pending_staff,
        (SELECT COUNT(*) FROM Users WHERE role = 'STAFF' AND status = 'ACTIVE')   AS active_staff,

        -- Customers
        (SELECT COUNT(*) FROM Customers)                                           AS total_customers,
        (SELECT COUNT(*) FROM Customers WHERE status = 'PENDING')                 AS pending_customers,
        (SELECT COUNT(*) FROM Customers WHERE status = 'ACTIVE')                  AS active_customers,
        (SELECT COUNT(*) FROM Customers WHERE status = 'REJECTED')                AS rejected_customers,
        (SELECT COUNT(*) FROM Customers WHERE status = 'SUSPENDED')               AS suspended_customers,

        -- Customers awaiting admin approval (staff approved, admin not yet)
        (SELECT COUNT(*)
         FROM   Customers c
         JOIN   Customer_Approvals ca
                ON  ca.customer_id   = c.customer_id
                AND ca.approver_role = 'STAFF'
                AND ca.status        = 'APPROVED'
         WHERE  c.status = 'PENDING'
           AND  NOT EXISTS (
                  SELECT 1 FROM Customer_Approvals ca2
                  WHERE  ca2.customer_id   = c.customer_id
                    AND  ca2.approver_role = 'ADMIN'
                ))                                                                 AS customers_awaiting_admin,

        -- Accounts
        (SELECT COUNT(*) FROM Accounts)                                            AS total_accounts,
        (SELECT COUNT(*) FROM Accounts WHERE status = 'PENDING')                  AS pending_accounts,
        (SELECT COUNT(*) FROM Accounts WHERE status = 'ACTIVE')                   AS active_accounts,

        -- Loans
        (SELECT COUNT(*) FROM Loans)                                               AS total_loans,
        (SELECT COUNT(*) FROM Loans WHERE status = 'PENDING')                     AS pending_loans,
        (SELECT COUNT(*) FROM Loans WHERE status = 'ACTIVE')                      AS active_loans,

        -- Loans awaiting admin approval
        (SELECT COUNT(*)
         FROM   Loans l
         JOIN   Loan_Approvals la
                ON  la.loan_id       = l.loan_id
                AND la.approver_role = 'STAFF'
                AND la.status        = 'APPROVED'
         WHERE  l.status = 'PENDING'
           AND  NOT EXISTS (
                  SELECT 1 FROM Loan_Approvals la2
                  WHERE  la2.loan_id       = l.loan_id
                    AND  la2.approver_role = 'ADMIN'
                ))                                                                 AS loans_awaiting_admin,

        -- Fraud
        (SELECT COUNT(*) FROM Fraud_Logs WHERE action_taken = 'FLAGGED')          AS open_fraud_flags,

        -- Support
        (SELECT COUNT(*) FROM Support_Tickets WHERE status = 'OPEN')              AS open_tickets,
        (SELECT COUNT(*) FROM Support_Tickets WHERE status = 'IN_PROGRESS')       AS in_progress_tickets,

        -- Transactions today
        (SELECT COUNT(*) FROM Transactions
         WHERE CAST(transaction_time AS DATE) = CAST(GETDATE() AS DATE))          AS transactions_today,

        -- Total balance across all accounts
        (SELECT ISNULL(SUM(balance), 0) FROM Accounts WHERE status = 'ACTIVE')   AS total_deposits
    `);

    return res.json(result.recordset[0]);
  } catch (err) {
    console.error('[getDashboardStats]', err);
    return res.status(500).json({ error: err.message });
  }
};


module.exports = {
  // Staff
  getAllStaff,
  getPendingStaff,
  getStaffById,
  createStaff,
  approveStaff,
  rejectStaff,
  suspendStaff,
  reactivateStaff,
  // Customers
  getAllCustomers,
  getPendingAdminApproval,
  adminApproveCustomer,
  adminRejectCustomer,
  suspendCustomer,
  reactivateCustomer,
  // Loan Policies
  getLoanPolicies,
  createLoanPolicy,
  updateLoanPolicy,
  toggleLoanPolicy,
  // Stats
  getDashboardStats,
};
