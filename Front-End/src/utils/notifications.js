const { poolPromise, sql } = require('../config/db');

async function createNotification(userId, type, message, relatedId = null) {
  try {
    const pool = await poolPromise;
    
    await pool.request()
      .input('user_id', sql.Int, userId)
      .input('type', sql.VarChar, type)
      .input('message', sql.VarChar, message)
      .input('related_id', sql.Int, relatedId)
      .query(`
        INSERT INTO Notifications (user_id, type, message, related_id, created_at, is_read)
        VALUES (@user_id, @type, @message, @related_id, GETDATE(), 0)
      `);
    
    console.log(`✅ Notification created for user ${userId}: ${message}`);
    return true;
  } catch (err) {
    console.error('❌ Error creating notification:', err);
    return false;
  }
}

async function notifyAdmin(pool, message, type) {
  try {
    const admins = await pool.request()
      .query(`SELECT user_id FROM Users WHERE LOWER(role) = 'admin'`);
    
    for (const admin of admins.recordset) {
      await createNotification(admin.user_id, type, message);
    }
  } catch (err) {
    console.error('Error notifying admins:', err);
  }
}

module.exports = { createNotification, notifyAdmin };