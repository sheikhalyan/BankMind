const { getPool, sql } = require('../config/db');

// ================================================================
//  HELPER — build recipient filter based on JWT
//  Notifications table uses: recipient_id + recipient_type
// ================================================================
const getRecipient = (user) => {
  const role = user.role?.toUpperCase();
  if (role === 'CUSTOMER') return { id: user.customerId, type: 'CUSTOMER' };
  if (role === 'STAFF') return { id: user.userId, type: 'STAFF' };
  if (role === 'ADMIN') return { id: user.userId, type: 'ADMIN' };
  return null;
};

// ================================================================
//  1. GET MY NOTIFICATIONS
//     GET /api/notifications
//     Query: ?unread_only=true
// ================================================================
const getNotifications = async (req, res) => {
  const recipient = getRecipient(req.user);
  if (!recipient)
    return res.status(400).json({ message: 'Invalid user role.' });

  const unreadOnly = req.query.unread_only === 'true';

  try {
    const pool = await getPool();
    const request = pool.request()
      .input('recipient_id', sql.Int, recipient.id)
      .input('recipient_type', sql.NVarChar, recipient.type);

    let query = `
      SELECT
        notification_id,
        recipient_id,
        recipient_type,
        type,
        message,
        related_id,
        related_type,
        is_read,
        created_at
      FROM  Notifications
      WHERE recipient_id   = @recipient_id
        AND recipient_type = @recipient_type
    `;

    if (unreadOnly) query += ` AND is_read = 0`;
    query += ` ORDER BY created_at DESC`;

    const result = await request.query(query);
    return res.json(result.recordset);

  } catch (err) {
    console.error('[getNotifications]', err);
    return res.status(500).json({ error: err.message });
  }
};

// ================================================================
//  2. GET UNREAD COUNT
//     GET /api/notifications/count
// ================================================================
const getUnreadCount = async (req, res) => {
  const recipient = getRecipient(req.user);
  if (!recipient)
    return res.status(400).json({ message: 'Invalid user role.' });

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('recipient_id', sql.Int, recipient.id)
      .input('recipient_type', sql.NVarChar, recipient.type)
      .query(`
        SELECT COUNT(*) AS unread_count
        FROM   Notifications
        WHERE  recipient_id   = @recipient_id
          AND  recipient_type = @recipient_type
          AND  is_read        = 0
      `);

    return res.json({ unread_count: result.recordset[0].unread_count });

  } catch (err) {
    console.error('[getUnreadCount]', err);
    return res.status(500).json({ error: err.message });
  }
};

// ================================================================
//  3. MARK ONE AS READ
//     PUT /api/notifications/:notificationId/read
// ================================================================
const markAsRead = async (req, res) => {
  const { notificationId } = req.params;
  const recipient = getRecipient(req.user);
  if (!recipient)
    return res.status(400).json({ message: 'Invalid user role.' });

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('notification_id', sql.Int, notificationId)
      .input('recipient_id', sql.Int, recipient.id)
      .input('recipient_type', sql.NVarChar, recipient.type)
      .query(`
        UPDATE Notifications
        SET    is_read = 1
        WHERE  notification_id = @notification_id
          AND  recipient_id    = @recipient_id
          AND  recipient_type  = @recipient_type
      `);

    if (result.rowsAffected[0] === 0)
      return res.status(404).json({ message: 'Notification not found.' });

    return res.json({ message: 'Notification marked as read.' });

  } catch (err) {
    console.error('[markAsRead]', err);
    return res.status(500).json({ error: err.message });
  }
};

// ================================================================
//  4. MARK ALL AS READ
//     PUT /api/notifications/read-all
// ================================================================
const markAllAsRead = async (req, res) => {
  const recipient = getRecipient(req.user);
  if (!recipient)
    return res.status(400).json({ message: 'Invalid user role.' });

  try {
    const pool = await getPool();
    await pool.request()
      .input('recipient_id', sql.Int, recipient.id)
      .input('recipient_type', sql.NVarChar, recipient.type)
      .query(`
        UPDATE Notifications
        SET    is_read = 1
        WHERE  recipient_id   = @recipient_id
          AND  recipient_type = @recipient_type
          AND  is_read        = 0
      `);

    return res.json({ message: 'All notifications marked as read.' });

  } catch (err) {
    console.error('[markAllAsRead]', err);
    return res.status(500).json({ error: err.message });
  }
};

// ================================================================
//  5. DELETE ONE NOTIFICATION
//     DELETE /api/notifications/:notificationId
// ================================================================
const deleteNotification = async (req, res) => {
  const { notificationId } = req.params;
  const recipient = getRecipient(req.user);
  if (!recipient)
    return res.status(400).json({ message: 'Invalid user role.' });

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('notification_id', sql.Int, notificationId)
      .input('recipient_id', sql.Int, recipient.id)
      .input('recipient_type', sql.NVarChar, recipient.type)
      .query(`
        DELETE FROM Notifications
        WHERE  notification_id = @notification_id
          AND  recipient_id    = @recipient_id
          AND  recipient_type  = @recipient_type
      `);

    if (result.rowsAffected[0] === 0)
      return res.status(404).json({ message: 'Notification not found.' });

    return res.json({ message: 'Notification deleted.' });

  } catch (err) {
    console.error('[deleteNotification]', err);
    return res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};