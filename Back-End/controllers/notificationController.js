const { poolPromise, sql } = require("../config/db");

// Get all notifications for current user
const getNotifications = async (req, res) => {
  try {
    const pool = await poolPromise;
    const userId = req.user.userId;
    const customerId = req.user.customerId;

    let result;

    if (customerId) {
      // Customer logged in - get notifications by customer_id
      result = await pool.request().input("customer_id", sql.Int, customerId)
        .query(`
          SELECT notification_id, customer_id as user_id, type, message, created_at, is_read
          FROM Notifications
          WHERE customer_id = @customer_id
          ORDER BY created_at DESC
        `);
    } else {
      // User/Admin logged in - get notifications by user_id
      result = await pool.request().input("user_id", sql.Int, userId).query(`
          SELECT notification_id, user_id, type, message, created_at, is_read
          FROM Notifications
          WHERE user_id = @user_id
          ORDER BY created_at DESC
        `);
    }

    res.json(result.recordset);
  } catch (err) {
    console.error("Error in getNotifications:", err);
    res.status(500).json({ error: err.message });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const pool = await poolPromise;
    const { notificationId } = req.params;
    const userId = req.user.userId;
    const customerId = req.user.customerId;

    if (customerId) {
      // Customer logged in
      const result = await pool
        .request()
        .input("notification_id", sql.Int, notificationId)
        .input("customer_id", sql.Int, customerId)
        .query(`
          UPDATE Notifications
          SET is_read = 1
          WHERE notification_id = @notification_id AND customer_id = @customer_id
        `);
      
      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ message: "Notification not found" });
      }
    } else {
      // User/Admin logged in
      const result = await pool
        .request()
        .input("notification_id", sql.Int, notificationId)
        .input("user_id", sql.Int, userId)
        .query(`
          UPDATE Notifications
          SET is_read = 1
          WHERE notification_id = @notification_id AND user_id = @user_id
        `);
      
      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ message: "Notification not found" });
      }
    }

    res.json({ message: "Notification marked as read" });
  } catch (err) {
    console.error("Error in markAsRead:", err);
    res.status(500).json({ error: err.message });
  }
};

// Mark all as read
const markAllAsRead = async (req, res) => {
  try {
    const pool = await poolPromise;
    const userId = req.user.userId;
    const customerId = req.user.customerId;

    if (customerId) {
      // Customer logged in - mark customer notifications as read
      await pool.request().input("customer_id", sql.Int, customerId).query(`
          UPDATE Notifications
          SET is_read = 1
          WHERE customer_id = @customer_id AND is_read = 0
        `);
    } else {
      // User/Admin logged in - mark user notifications as read
      await pool.request().input("user_id", sql.Int, userId).query(`
          UPDATE Notifications
          SET is_read = 1
          WHERE user_id = @user_id AND is_read = 0
        `);
    }

    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    console.error("Error in markAllAsRead:", err);
    res.status(500).json({ error: err.message });
  }
};

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    const pool = await poolPromise;
    const { notificationId } = req.params;
    const userId = req.user.userId;
    const customerId = req.user.customerId;

    if (customerId) {
      await pool
        .request()
        .input("notification_id", sql.Int, notificationId)
        .input("customer_id", sql.Int, customerId).query(`
        DELETE FROM Notifications
        WHERE notification_id = @notification_id AND customer_id = @customer_id
      `);
    }
     else {
      await pool
        .request()
        .input("notification_id", sql.Int, notificationId)
        .input("user_id", sql.Int, userId).query(`
        DELETE FROM Notifications
        WHERE notification_id = @notification_id AND user_id = @user_id
      `);
    }

    res.json({ message: "Notification deleted" });
  } catch (err) {
    console.error("Error in deleteNotification:", err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
