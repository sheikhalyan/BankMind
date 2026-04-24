const { poolPromise, sql } = require('../config/db');

// Get all notifications for current user
const getNotifications = async (req, res) => {
  try {
    const pool = await poolPromise;
    const userId = req.user.userId;

    const result = await pool.request()
      .input('user_id', sql.Int, userId)
      .query(`
        SELECT 
          notification_id, 
          user_id, 
          type, 
          message, 
          created_at, 
          is_read
        FROM Notifications
        WHERE user_id = @user_id
        ORDER BY created_at DESC
      `);

    console.log('📊 Notifications from DB:', result.recordset);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error in getNotifications:', err);
    res.status(500).json({ error: err.message });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const pool = await poolPromise;
    const { notificationId } = req.params;
    const userId = req.user.userId;
    
    await pool.request()
      .input('notification_id', sql.Int, notificationId)
      .input('user_id', sql.Int, userId)
      .query(`
        UPDATE Notifications
        SET is_read = 1
        WHERE notification_id = @notification_id AND user_id = @user_id
      `);
    
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    console.error('Error in markAsRead:', err);
    res.status(500).json({ error: err.message });
  }
};

// Mark all as read
const markAllAsRead = async (req, res) => {
  try {
    const pool = await poolPromise;
    const userId = req.user.userId;
    
    await pool.request()
      .input('user_id', sql.Int, userId)
      .query(`
        UPDATE Notifications
        SET is_read = 1
        WHERE user_id = @user_id AND is_read = 0
      `);
    
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Error in markAllAsRead:', err);
    res.status(500).json({ error: err.message });
  }
};

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    const pool = await poolPromise;
    const { notificationId } = req.params;
    const userId = req.user.userId;
    
    await pool.request()
      .input('notification_id', sql.Int, notificationId)
      .input('user_id', sql.Int, userId)
      .query(`
        DELETE FROM Notifications
        WHERE notification_id = @notification_id AND user_id = @user_id
      `);
    
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    console.error('Error in deleteNotification:', err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
};