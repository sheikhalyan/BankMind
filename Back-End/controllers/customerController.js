const { getPool, sql } = require('../config/db');
const CustomerModel = require('../models/Customermodel');
const UserModel = require('../models/Usermodel');
const {
  notifyCustomer,
  notifyUser,
  notifyAdmins,
  notifyAllStaff,
  notifyAllStaffAndAdmins,
} = require('../utils/notifications');

// ================================================================
//  SHARED SELECT — full customer row with approval status
// ================================================================
const CUSTOMER_SELECT = `
  SELECT
    c.customer_id,
    c.full_name,
    c.email,
    c.phone,
    c.address,
    c.city,
    c.country,
    c.status,
    c.created_at,
    c.assigned_staff_id,
    u.full_name          AS assigned_staff_name,
    u.email              AS assigned_staff_email,
    staff_ap.status      AS staff_approval_status,
    staff_ap.remarks     AS staff_approval_remarks,
    staff_ap.actioned_at AS staff_actioned_at,
    admin_ap.status      AS admin_approval_status,
    admin_ap.remarks     AS admin_approval_remarks,
    admin_ap.actioned_at AS admin_actioned_at
  FROM Customers c
  LEFT JOIN Users u
         ON u.user_id = c.assigned_staff_id
  LEFT JOIN Customer_Approvals staff_ap
         ON staff_ap.customer_id   = c.customer_id
        AND staff_ap.approver_role = 'STAFF'
  LEFT JOIN Customer_Approvals admin_ap
         ON admin_ap.customer_id   = c.customer_id
        AND admin_ap.approver_role = 'ADMIN'
`;

// ================================================================
//  1. CUSTOMER REGISTERS
//     POST /api/customers/register
//     Body: { full_name, email, password, phone, address?, city? }
//     → Notify ALL staff + ALL admins
// ================================================================
const registerCustomer = async (req, res) => {
  const { full_name, email, password, phone, address, city } = req.body;

  if (!full_name || !email || !password || !phone)
    return res.status(400).json({ message: 'full_name, email, password and phone are required.' });

  try {
    const bcrypt = require('bcryptjs');
    const pool = await getPool();

    // Check duplicate email
    const existing = await pool.request()
      .input('email', sql.NVarChar, email)
      .query(`SELECT customer_id FROM Customers WHERE email = @email`);
    if (existing.recordset.length > 0)
      return res.status(409).json({ message: 'Email already registered.' });

    const password_hash = await bcrypt.hash(password, 10);

    // Insert customer
    const custResult = await pool.request()
      .input('full_name', sql.NVarChar, full_name)
      .input('email', sql.NVarChar, email)
      .input('phone', sql.NVarChar, phone)
      .input('address', sql.NVarChar, address || null)
      .input('city', sql.NVarChar, city || null)
      .query(`
        INSERT INTO Customers (full_name, email, phone, address, city)
        OUTPUT INSERTED.customer_id
        VALUES (@full_name, @email, @phone, @address, @city)
      `);

    const customerId = custResult.recordset[0].customer_id;

    // Insert password into Customer_Auth
    await pool.request()
      .input('customer_id', sql.Int, customerId)
      .input('password_hash', sql.NVarChar, password_hash)
      .query(`
        INSERT INTO Customer_Auth (customer_id, password_hash)
        VALUES (@customer_id, @password_hash)
      `);

    // Notify ALL staff + ALL admins — any staff can pick this up
    await notifyAllStaffAndAdmins({
      type: 'NEW_CUSTOMER_REGISTERED',
      message: `New customer "${full_name}" has registered and is awaiting approval.`,
      related_id: customerId,
      related_type: 'CUSTOMER',
    });

    // Notify customer themselves
    await notifyCustomer({
      customer_id: customerId,
      type: 'REGISTRATION_SUBMITTED',
      message: 'Your registration has been submitted and is awaiting approval.',
      related_id: customerId,
      related_type: 'CUSTOMER',
    });

    return res.status(201).json({ message: 'Registration successful. Awaiting staff approval.' });

  } catch (err) {
    console.error('[registerCustomer]', err);
    return res.status(500).json({ error: err.message });
  }
};

// ================================================================
//  2. GET ALL CUSTOMERS  (Staff + Admin)
//     GET /api/customers/all
//     Staff → sees all customers (to pick up new ones)
//     Admin → sees all customers
// ================================================================
const getAllCustomers = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT
        c.customer_id, c.full_name, c.email, c.phone,
        c.city, c.country, c.status, c.created_at,
        c.assigned_staff_id,
        u.full_name          AS assigned_staff_name,
        staff_ap.status      AS staff_approval_status,
        staff_ap.remarks     AS staff_approval_remarks,
        admin_ap.status      AS admin_approval_status
      FROM Customers c
      LEFT JOIN Users u ON u.user_id = c.assigned_staff_id
      LEFT JOIN Customer_Approvals staff_ap
             ON staff_ap.customer_id   = c.customer_id
            AND staff_ap.approver_role = 'STAFF'
      LEFT JOIN Customer_Approvals admin_ap
             ON admin_ap.customer_id   = c.customer_id
            AND admin_ap.approver_role = 'ADMIN'
      ORDER BY c.created_at DESC
    `);
    return res.json(result.recordset);
  } catch (err) {
    console.error('[getAllCustomers]', err);
    return res.status(500).json({ error: err.message });
  }
};

// ================================================================
//  3. GET SINGLE CUSTOMER
//     GET /api/customers/:customerId
// ================================================================
const getCustomerById = async (req, res) => {
  const { customerId } = req.params;
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('customer_id', sql.Int, customerId)
      .query(CUSTOMER_SELECT + ` WHERE c.customer_id = @customer_id`);

    if (!result.recordset[0])
      return res.status(404).json({ message: 'Customer not found.' });

    return res.json(result.recordset[0]);
  } catch (err) {
    console.error('[getCustomerById]', err);
    return res.status(500).json({ error: err.message });
  }
};

// ================================================================
//  4. PENDING — STAFF LEVEL
//     GET /api/customers/pending/staff
//     Customers with no staff approval row yet (unclaimed)
// ================================================================
const getPendingForStaff = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT
        c.customer_id, c.full_name, c.email, c.phone,
        c.city, c.country, c.status, c.created_at,
        c.assigned_staff_id
      FROM  Customers c
      WHERE c.status = 'PENDING'
        AND NOT EXISTS (
          SELECT 1 FROM Customer_Approvals ca
          WHERE  ca.customer_id   = c.customer_id
            AND  ca.approver_role = 'STAFF'
        )
      ORDER BY c.created_at ASC
    `);
    return res.json(result.recordset);
  } catch (err) {
    console.error('[getPendingForStaff]', err);
    return res.status(500).json({ error: err.message });
  }
};

// ================================================================
//  5. PENDING — ADMIN LEVEL
//     GET /api/customers/pending/admin
//     Staff approved, admin hasn't actioned yet
// ================================================================
const getPendingForAdmin = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT
        c.customer_id, c.full_name, c.email, c.phone,
        c.city, c.country, c.status, c.created_at,
        c.assigned_staff_id,
        u.full_name          AS assigned_staff_name,
        staff_ap.actioned_at AS staff_actioned_at
      FROM  Customers c
      LEFT JOIN Users u ON u.user_id = c.assigned_staff_id
      JOIN  Customer_Approvals staff_ap
               ON  staff_ap.customer_id   = c.customer_id
               AND staff_ap.approver_role = 'STAFF'
               AND staff_ap.status        = 'APPROVED'
      WHERE c.status = 'PENDING'
        AND NOT EXISTS (
          SELECT 1 FROM Customer_Approvals ca
          WHERE  ca.customer_id   = c.customer_id
            AND  ca.approver_role = 'ADMIN'
        )
      ORDER BY staff_ap.actioned_at ASC
    `);
    return res.json(result.recordset);
  } catch (err) {
    console.error('[getPendingForAdmin]', err);
    return res.status(500).json({ error: err.message });
  }
};

// ================================================================
//  6. STAFF APPROVE CUSTOMER
//     PUT /api/customers/:customerId/staff-approve
//     Body: { remarks? }
//     First staff to approve gets associated with customer
//     → Notify customer + all admins
// ================================================================
const staffApproveCustomer = async (req, res) => {
  const { customerId } = req.params;
  const { remarks } = req.body;
  const staffId = req.user.userId;

  try {
    const customer = await CustomerModel.findById(customerId);
    if (!customer)
      return res.status(404).json({ message: 'Customer not found.' });
    if (customer.status !== 'PENDING')
      return res.status(400).json({ message: `Customer is already ${customer.status}.` });

    const pool = await getPool();

    // Check not already actioned
    const existing = await pool.request()
      .input('customer_id', sql.Int, Number(customerId))
      .query(`
        SELECT approval_id FROM Customer_Approvals
        WHERE customer_id = @customer_id AND approver_role = 'STAFF'
      `);
    if (existing.recordset.length > 0)
      return res.status(409).json({ message: 'Staff approval already recorded.' });

    // Assign this staff to the customer — first to approve owns them
    await pool.request()
      .input('customer_id', sql.Int, Number(customerId))
      .input('staff_id', sql.Int, staffId)
      .query(`
        UPDATE Customers SET assigned_staff_id = @staff_id
        WHERE customer_id = @customer_id
      `);

    // Record approval
    await pool.request()
      .input('customer_id', sql.Int, Number(customerId))
      .input('approver_id', sql.Int, staffId)
      .input('remarks', sql.NVarChar, remarks || null)
      .query(`
        INSERT INTO Customer_Approvals (customer_id, approver_id, approver_role, status, remarks)
        VALUES (@customer_id, @approver_id, 'STAFF', 'APPROVED', @remarks)
      `);

    // Notify customer + all admins
    await Promise.all([
      notifyCustomer({
        customer_id: Number(customerId),
        type: 'REGISTRATION_STAFF_APPROVED',
        message: 'Your registration has been approved by staff. Awaiting final admin approval.',
        related_id: Number(customerId),
        related_type: 'CUSTOMER',
      }),
      notifyAdmins({
        type: 'CUSTOMER_AWAITING_ADMIN_APPROVAL',
        message: `Customer "${customer.full_name}" approved by staff — awaiting your final approval.`,
        related_id: Number(customerId),
        related_type: 'CUSTOMER',
      }),
    ]);

    return res.json({ message: 'Customer approved at staff level. Awaiting admin approval.' });

  } catch (err) {
    console.error('[staffApproveCustomer]', err);
    return res.status(500).json({ error: err.message });
  }
};

// ================================================================
//  7. STAFF REJECT CUSTOMER
//     PUT /api/customers/:customerId/staff-reject
//     Body: { remarks }
//     Any staff can reject an unclaimed customer
//     → Notify customer + all admins
// ================================================================
const staffRejectCustomer = async (req, res) => {
  const { customerId } = req.params;
  const { remarks } = req.body;
  const staffId = req.user.userId;

  if (!remarks?.trim())
    return res.status(400).json({ message: 'Rejection reason (remarks) is required.' });

  try {
    const customer = await CustomerModel.findById(customerId);
    if (!customer)
      return res.status(404).json({ message: 'Customer not found.' });
    if (customer.status !== 'PENDING')
      return res.status(400).json({ message: `Customer is already ${customer.status}.` });

    // If already assigned to someone else, only that staff can reject
    if (customer.assigned_staff_id && customer.assigned_staff_id !== staffId)
      return res.status(403).json({ message: 'This customer is assigned to another staff member.' });

    const pool = await getPool();

    const existing = await pool.request()
      .input('customer_id', sql.Int, Number(customerId))
      .query(`
        SELECT approval_id FROM Customer_Approvals
        WHERE customer_id = @customer_id AND approver_role = 'STAFF'
      `);
    if (existing.recordset.length > 0)
      return res.status(409).json({ message: 'Staff approval already recorded.' });

    // Assign staff + record rejection + update status
    await pool.request()
      .input('customer_id', sql.Int, Number(customerId))
      .input('staff_id', sql.Int, staffId)
      .input('approver_id', sql.Int, staffId)
      .input('remarks', sql.NVarChar, remarks)
      .query(`
        UPDATE Customers
        SET assigned_staff_id = @staff_id, status = 'REJECTED'
        WHERE customer_id = @customer_id;

        INSERT INTO Customer_Approvals (customer_id, approver_id, approver_role, status, remarks)
        VALUES (@customer_id, @approver_id, 'STAFF', 'REJECTED', @remarks);
      `);

    await Promise.all([
      notifyCustomer({
        customer_id: Number(customerId),
        type: 'REGISTRATION_REJECTED',
        message: `Your registration was rejected. Reason: ${remarks}`,
        related_id: Number(customerId),
        related_type: 'CUSTOMER',
      }),
      notifyAdmins({
        type: 'CUSTOMER_REJECTED_BY_STAFF',
        message: `Customer "${customer.full_name}" was rejected by staff. Reason: ${remarks}`,
        related_id: Number(customerId),
        related_type: 'CUSTOMER',
      }),
    ]);

    return res.json({ message: 'Customer rejected at staff level.' });

  } catch (err) {
    console.error('[staffRejectCustomer]', err);
    return res.status(500).json({ error: err.message });
  }
};

// ================================================================
//  8. ADMIN APPROVE CUSTOMER
//     PUT /api/customers/:customerId/admin-approve
//     Requires staff APPROVED first → sets status = ACTIVE
//     → Notify customer + assigned staff
// ================================================================
const adminApproveCustomer = async (req, res) => {
  const { customerId } = req.params;
  const { remarks } = req.body;
  const adminId = req.user.userId;

  try {
    const customer = await CustomerModel.findById(customerId);
    if (!customer)
      return res.status(404).json({ message: 'Customer not found.' });
    if (customer.status !== 'PENDING')
      return res.status(400).json({ message: `Customer is already ${customer.status}.` });

    const pool = await getPool();

    const staffApproval = await pool.request()
      .input('customer_id', sql.Int, Number(customerId))
      .query(`
        SELECT status FROM Customer_Approvals
        WHERE  customer_id = @customer_id AND approver_role = 'STAFF'
      `);
    if (!staffApproval.recordset[0] || staffApproval.recordset[0].status !== 'APPROVED')
      return res.status(400).json({ message: 'Staff must approve before admin.' });

    const existing = await pool.request()
      .input('customer_id', sql.Int, Number(customerId))
      .query(`
        SELECT approval_id FROM Customer_Approvals
        WHERE  customer_id = @customer_id AND approver_role = 'ADMIN'
      `);
    if (existing.recordset.length > 0)
      return res.status(409).json({ message: 'Admin approval already recorded.' });

    await pool.request()
      .input('customer_id', sql.Int, Number(customerId))
      .input('approver_id', sql.Int, adminId)
      .input('remarks', sql.NVarChar, remarks || null)
      .query(`
        INSERT INTO Customer_Approvals (customer_id, approver_id, approver_role, status, remarks)
        VALUES (@customer_id, @approver_id, 'ADMIN', 'APPROVED', @remarks);

        UPDATE Customers SET status = 'ACTIVE' WHERE customer_id = @customer_id;
      `);

    const notifications = [
      notifyCustomer({
        customer_id: Number(customerId),
        type: 'REGISTRATION_APPROVED',
        message: 'Your registration has been fully approved. Welcome to BankMind!',
        related_id: Number(customerId),
        related_type: 'CUSTOMER',
      }),
    ];

    // Only notify assigned staff — not all staff
    if (customer.assigned_staff_id) {
      notifications.push(notifyUser({
        user_id: customer.assigned_staff_id,
        type: 'CUSTOMER_FULLY_APPROVED',
        message: `Your customer "${customer.full_name}" has been fully approved by admin and is now active.`,
        related_id: Number(customerId),
        related_type: 'CUSTOMER',
      }));
    }

    await Promise.all(notifications);

    return res.json({ message: 'Customer fully approved. Account is now active.' });

  } catch (err) {
    console.error('[adminApproveCustomer]', err);
    return res.status(500).json({ error: err.message });
  }
};

// ================================================================
//  9. ADMIN REJECT CUSTOMER
//     PUT /api/customers/:customerId/admin-reject
//     Body: { remarks }
//     → Notify customer + assigned staff
// ================================================================
const adminRejectCustomer = async (req, res) => {
  const { customerId } = req.params;
  const { remarks } = req.body;
  const adminId = req.user.userId;

  if (!remarks?.trim())
    return res.status(400).json({ message: 'Rejection reason (remarks) is required.' });

  try {
    const customer = await CustomerModel.findById(customerId);
    if (!customer)
      return res.status(404).json({ message: 'Customer not found.' });
    if (customer.status !== 'PENDING')
      return res.status(400).json({ message: `Customer is already ${customer.status}.` });

    const pool = await getPool();

    const existing = await pool.request()
      .input('customer_id', sql.Int, Number(customerId))
      .query(`
        SELECT approval_id FROM Customer_Approvals
        WHERE  customer_id = @customer_id AND approver_role = 'ADMIN'
      `);
    if (existing.recordset.length > 0)
      return res.status(409).json({ message: 'Admin approval already recorded.' });

    await pool.request()
      .input('customer_id', sql.Int, Number(customerId))
      .input('approver_id', sql.Int, adminId)
      .input('remarks', sql.NVarChar, remarks)
      .query(`
        INSERT INTO Customer_Approvals (customer_id, approver_id, approver_role, status, remarks)
        VALUES (@customer_id, @approver_id, 'ADMIN', 'REJECTED', @remarks);

        UPDATE Customers SET status = 'REJECTED' WHERE customer_id = @customer_id;
      `);

    const notifications = [
      notifyCustomer({
        customer_id: Number(customerId),
        type: 'REGISTRATION_REJECTED',
        message: `Your registration was rejected by admin. Reason: ${remarks}`,
        related_id: Number(customerId),
        related_type: 'CUSTOMER',
      }),
    ];

    // Only notify assigned staff — not all staff
    if (customer.assigned_staff_id) {
      notifications.push(notifyUser({
        user_id: customer.assigned_staff_id,
        type: 'CUSTOMER_REJECTED_BY_ADMIN',
        message: `Your customer "${customer.full_name}" was rejected by admin. Reason: ${remarks}`,
        related_id: Number(customerId),
        related_type: 'CUSTOMER',
      }));
    }

    await Promise.all(notifications);

    return res.json({ message: 'Customer rejected at admin level.' });

  } catch (err) {
    console.error('[adminRejectCustomer]', err);
    return res.status(500).json({ error: err.message });
  }
};

// ================================================================
//  10. ASSIGN STAFF TO CUSTOMER  (Admin only)
//      PUT /api/customers/:customerId/assign-staff
//      Body: { staff_id }
// ================================================================
const assignStaff = async (req, res) => {
  const { customerId } = req.params;
  const { staff_id } = req.body;

  if (!staff_id)
    return res.status(400).json({ message: 'staff_id is required.' });

  try {
    const customer = await CustomerModel.findById(customerId);
    if (!customer)
      return res.status(404).json({ message: 'Customer not found.' });

    const staff = await UserModel.findById(staff_id);
    if (!staff || staff.role !== 'STAFF' || staff.status !== 'ACTIVE')
      return res.status(404).json({ message: 'Active staff member not found.' });

    await CustomerModel.assignStaff(Number(customerId), Number(staff_id));

    await notifyUser({
      user_id: Number(staff_id),
      type: 'CUSTOMER_ASSIGNED',
      message: `Customer "${customer.full_name}" has been assigned to you by admin.`,
      related_id: Number(customerId),
      related_type: 'CUSTOMER',
    });

    return res.json({
      message: `Customer assigned to ${staff.full_name}.`,
      assigned_staff_id: Number(staff_id),
      assigned_staff_name: staff.full_name,
    });

  } catch (err) {
    console.error('[assignStaff]', err);
    return res.status(500).json({ error: err.message });
  }
};

// ================================================================
//  11. SUSPEND CUSTOMER  (Admin only)
//      PUT /api/customers/:customerId/suspend
//      → Notify customer + assigned staff
// ================================================================
const suspendCustomer = async (req, res) => {
  const { customerId } = req.params;

  try {
    const customer = await CustomerModel.findById(customerId);
    if (!customer) return res.status(404).json({ message: 'Customer not found.' });
    if (customer.status === 'SUSPENDED')
      return res.status(400).json({ message: 'Customer is already suspended.' });

    await CustomerModel.updateStatus(Number(customerId), 'SUSPENDED');

    const notifications = [
      notifyCustomer({
        customer_id: Number(customerId),
        type: 'ACCOUNT_SUSPENDED',
        message: 'Your account has been suspended. Please contact support.',
        related_id: Number(customerId),
        related_type: 'CUSTOMER',
      }),
    ];

    if (customer.assigned_staff_id) {
      notifications.push(notifyUser({
        user_id: customer.assigned_staff_id,
        type: 'CUSTOMER_SUSPENDED',
        message: `Your customer "${customer.full_name}" has been suspended by admin.`,
        related_id: Number(customerId),
        related_type: 'CUSTOMER',
      }));
    }

    await Promise.all(notifications);

    return res.json({ message: 'Customer suspended.' });

  } catch (err) {
    console.error('[suspendCustomer]', err);
    return res.status(500).json({ error: err.message });
  }
};

// ================================================================
//  12. REACTIVATE CUSTOMER  (Admin only)
//      PUT /api/customers/:customerId/reactivate
//      → Notify customer + assigned staff
// ================================================================
const reactivateCustomer = async (req, res) => {
  const { customerId } = req.params;

  try {
    const customer = await CustomerModel.findById(customerId);
    if (!customer) return res.status(404).json({ message: 'Customer not found.' });
    if (customer.status === 'ACTIVE')
      return res.status(400).json({ message: 'Customer is already active.' });

    await CustomerModel.updateStatus(Number(customerId), 'ACTIVE');

    const notifications = [
      notifyCustomer({
        customer_id: Number(customerId),
        type: 'ACCOUNT_REACTIVATED',
        message: 'Your account has been reactivated. Welcome back to BankMind!',
        related_id: Number(customerId),
        related_type: 'CUSTOMER',
      }),
    ];

    if (customer.assigned_staff_id) {
      notifications.push(notifyUser({
        user_id: customer.assigned_staff_id,
        type: 'CUSTOMER_REACTIVATED',
        message: `Your customer "${customer.full_name}" has been reactivated by admin.`,
        related_id: Number(customerId),
        related_type: 'CUSTOMER',
      }));
    }

    await Promise.all(notifications);

    return res.json({ message: 'Customer reactivated.' });

  } catch (err) {
    console.error('[reactivateCustomer]', err);
    return res.status(500).json({ error: err.message });
  }
};

module.exports = {
  registerCustomer,
  getAllCustomers,
  getCustomerById,
  getPendingForStaff,
  getPendingForAdmin,
  staffApproveCustomer,
  staffRejectCustomer,
  adminApproveCustomer,
  adminRejectCustomer,
  assignStaff,
  suspendCustomer,
  reactivateCustomer,
};