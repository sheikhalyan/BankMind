const { getPool, sql } = require('../config/db');

const NotificationModel = {

    async create({ recipient_id, recipient_type, type, message, related_id, related_type }) {
        const pool = await getPool();
        const result = await pool.request()
            .input('recipient_id', sql.Int, recipient_id)
            .input('recipient_type', sql.NVarChar, recipient_type)
            .input('type', sql.NVarChar, type)
            .input('message', sql.NVarChar, message)
            .input('related_id', sql.Int, related_id || null)
            .input('related_type', sql.NVarChar, related_type || null)
            .query(`
        INSERT INTO Notifications (recipient_id, recipient_type, type, message, related_id, related_type)
        OUTPUT INSERTED.notification_id
        VALUES (@recipient_id, @recipient_type, @type, @message, @related_id, @related_type)
      `);
        return result.recordset[0].notification_id;
    },

    // Bulk-notify multiple recipients (e.g. all ADMIN users for a loan application)
    async createMany(notifications) {
        const pool = await getPool();
        const transaction = pool.transaction();
        await transaction.begin();
        try {
            for (const n of notifications) {
                await transaction.request()
                    .input('recipient_id', sql.Int, n.recipient_id)
                    .input('recipient_type', sql.NVarChar, n.recipient_type)
                    .input('type', sql.NVarChar, n.type)
                    .input('message', sql.NVarChar, n.message)
                    .input('related_id', sql.Int, n.related_id || null)
                    .input('related_type', sql.NVarChar, n.related_type || null)
                    .query(`
            INSERT INTO Notifications (recipient_id, recipient_type, type, message, related_id, related_type)
            VALUES (@recipient_id, @recipient_type, @type, @message, @related_id, @related_type)
          `);
            }
            await transaction.commit();
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    },

    async getForRecipient({ recipient_id, recipient_type, unread_only = false, limit = 30, offset = 0 }) {
        const pool = await getPool();
        const req = pool.request()
            .input('recipient_id', sql.Int, recipient_id)
            .input('recipient_type', sql.NVarChar, recipient_type)
            .input('limit', sql.Int, limit)
            .input('offset', sql.Int, offset);
        let where = 'WHERE recipient_id = @recipient_id AND recipient_type = @recipient_type';
        if (unread_only) where += ' AND is_read = 0';
        const result = await req.query(`
      SELECT * FROM Notifications
      ${where}
      ORDER BY created_at DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);
        return result.recordset;
    },

    async markRead(notification_id) {
        const pool = await getPool();
        await pool.request()
            .input('notification_id', sql.Int, notification_id)
            .query('UPDATE Notifications SET is_read = 1 WHERE notification_id = @notification_id');
    },

    async markAllRead({ recipient_id, recipient_type }) {
        const pool = await getPool();
        await pool.request()
            .input('recipient_id', sql.Int, recipient_id)
            .input('recipient_type', sql.NVarChar, recipient_type)
            .query(`
        UPDATE Notifications SET is_read = 1
        WHERE recipient_id = @recipient_id AND recipient_type = @recipient_type AND is_read = 0
      `);
    },

    async countUnread({ recipient_id, recipient_type }) {
        const pool = await getPool();
        const result = await pool.request()
            .input('recipient_id', sql.Int, recipient_id)
            .input('recipient_type', sql.NVarChar, recipient_type)
            .query(`
        SELECT COUNT(1) AS cnt FROM Notifications
        WHERE recipient_id = @recipient_id AND recipient_type = @recipient_type AND is_read = 0
      `);
        return result.recordset[0].cnt;
    },

};

module.exports = NotificationModel;