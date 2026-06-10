const { getPool, sql } = require('../config/db');

/**
 * Core function — send one notification to one recipient
 */
async function createNotification({
  recipient_id,
  recipient_type,
  type,
  message,
  related_id = null,
  related_type = null,
}) {
  try {
    if (!recipient_id || !recipient_type) {
      console.error('❌ Notification error: recipient_id and recipient_type are required');
      return false;
    }
    const pool = await getPool();
    await pool.request()
      .input('recipient_id', sql.Int, recipient_id)
      .input('recipient_type', sql.NVarChar, recipient_type.toUpperCase())
      .input('type', sql.NVarChar, type)
      .input('message', sql.NVarChar, message)
      .input('related_id', sql.Int, related_id)
      .input('related_type', sql.NVarChar, related_type)
      .query(`
        INSERT INTO Notifications
          (recipient_id, recipient_type, type, message, related_id, related_type, is_read, created_at)
        VALUES
          (@recipient_id, @recipient_type, @type, @message, @related_id, @related_type, 0, GETDATE())
      `);
    console.log(`✅ [${type}] → ${recipient_type} ${recipient_id}`);
    return true;
  } catch (err) {
    console.error('❌ createNotification error:', err.message);
    return false;
  }
}

/** Notify a single customer */
async function notifyCustomer({ customer_id, type, message, related_id = null, related_type = null }) {
  return createNotification({ recipient_id: customer_id, recipient_type: 'CUSTOMER', type, message, related_id, related_type });
}

/**
 * Notify a single staff member or admin by user_id.
 * Auto-detects role from DB — use when you don't know if it's STAFF or ADMIN.
 */
async function notifyUser({ user_id, type, message, related_id = null, related_type = null }) {
  const pool = await getPool();
  const result = await pool.request()
    .input('user_id', sql.Int, user_id)
    .query(`SELECT role FROM Users WHERE user_id = @user_id`);
  const role = result.recordset[0]?.role || 'STAFF';
  return createNotification({ recipient_id: user_id, recipient_type: role, type, message, related_id, related_type });
}

/**
 * Notify a single staff member explicitly (role already known = STAFF).
 * Use this when you have assigned_staff_id.
 */
async function notifyStaff({ user_id, type, message, related_id = null, related_type = null }) {
  return createNotification({ recipient_id: user_id, recipient_type: 'STAFF', type, message, related_id, related_type });
}

/**
 * Notify a single admin explicitly (role already known = ADMIN).
 */
async function notifyAdmin({ user_id, type, message, related_id = null, related_type = null }) {
  return createNotification({ recipient_id: user_id, recipient_type: 'ADMIN', type, message, related_id, related_type });
}

/** Notify ALL active admins */
async function notifyAdmins({ type, message, related_id = null, related_type = null }) {
  try {
    const pool = await getPool();
    const admins = await pool.request()
      .query(`SELECT user_id FROM Users WHERE role = 'ADMIN' AND status = 'ACTIVE'`);
    for (const admin of admins.recordset) {
      await createNotification({ recipient_id: admin.user_id, recipient_type: 'ADMIN', type, message, related_id, related_type });
    }
  } catch (err) {
    console.error('❌ notifyAdmins error:', err.message);
  }
}

/** Notify ALL active staff members */
async function notifyAllStaff({ type, message, related_id = null, related_type = null }) {
  try {
    const pool = await getPool();
    const staff = await pool.request()
      .query(`SELECT user_id FROM Users WHERE role = 'STAFF' AND status = 'ACTIVE'`);
    for (const member of staff.recordset) {
      await createNotification({ recipient_id: member.user_id, recipient_type: 'STAFF', type, message, related_id, related_type });
    }
  } catch (err) {
    console.error('❌ notifyAllStaff error:', err.message);
  }
}

/** Notify ALL active staff + ALL active admins */
async function notifyAllStaffAndAdmins({ type, message, related_id = null, related_type = null }) {
  await notifyAllStaff({ type, message, related_id, related_type });
  await notifyAdmins({ type, message, related_id, related_type });
}

module.exports = {
  createNotification,
  notifyCustomer,
  notifyUser,                // auto-detects STAFF or ADMIN role from DB
  notifyStaff,               // explicitly one staff member (assigned_staff_id)
  notifyAdmin,               // explicitly one admin
  notifyAdmins,              // all active admins
  notifyAllStaff,            // all active staff
  notifyAllStaffAndAdmins,   // all staff + all admins
};