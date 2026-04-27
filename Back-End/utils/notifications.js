const { poolPromise, sql } = require('../config/db');

async function createNotification(pool, userId, customerId, type, message, relatedId = null) {
  try {
    // Validate: at least one ID must be provided
    if (!userId && !customerId) {
      console.error('❌ Error: Neither userId nor customerId provided');
      return false;
    }
    
    const result = await pool.request()
      .input('user_id', sql.Int, userId || null)
      .input('customer_id', sql.Int, customerId || null)
      .input('type', sql.VarChar, type)
      .input('message', sql.VarChar, message)
      .input('related_id', sql.Int, relatedId)
      .query(`
        INSERT INTO Notifications (user_id, customer_id, type, message, related_id, created_at, is_read)
        VALUES (@user_id, @customer_id, @type, @message, @related_id, GETDATE(), 0)
      `);
    
    const recipient = userId ? `User ${userId}` : `Customer ${customerId}`;
    console.log(`✅ Notification sent to ${recipient}: ${message}`);
    return true;
  } catch (err) {
    console.error('❌ Error creating notification:', err);
    return false;
  }
}

async function notifyAdmins(pool, type, message, relatedId = null) {
  try {
    const admins = await pool.request()
      .query(`SELECT user_id FROM Users WHERE LOWER(role) = 'admin'`);
    
    for (const admin of admins.recordset) {
      await createNotification(pool, admin.user_id, null, type, message, relatedId);
    }
  } catch (err) {
    console.error('Error notifying admins:', err);
  }
}

module.exports = { createNotification, notifyAdmins };