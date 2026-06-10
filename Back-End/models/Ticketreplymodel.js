const { getPool, sql } = require('../config/db');

const TicketReplyModel = {

    async create({ ticket_id, sender_id, sender_type, message }) {
        const pool = await getPool();
        const result = await pool.request()
            .input('ticket_id', sql.Int, ticket_id)
            .input('sender_id', sql.Int, sender_id)
            .input('sender_type', sql.NVarChar, sender_type)
            .input('message', sql.NVarChar, message)
            .query(`
        INSERT INTO Ticket_Replies (ticket_id, sender_id, sender_type, message)
        OUTPUT INSERTED.reply_id
        VALUES (@ticket_id, @sender_id, @sender_type, @message)
      `);
        return result.recordset[0].reply_id;
    },

    async getByTicket(ticket_id) {
        const pool = await getPool();
        const result = await pool.request()
            .input('ticket_id', sql.Int, ticket_id)
            .query(`
        SELECT r.*,
               CASE
                 WHEN r.sender_type = 'CUSTOMER' THEN c.full_name
                 ELSE u.full_name
               END AS sender_name
        FROM Ticket_Replies r
        LEFT JOIN Customers c ON c.customer_id = r.sender_id AND r.sender_type = 'CUSTOMER'
        LEFT JOIN Users     u ON u.user_id     = r.sender_id AND r.sender_type IN ('STAFF', 'ADMIN')
        WHERE r.ticket_id = @ticket_id
        ORDER BY r.created_at ASC
      `);
        return result.recordset;
    },

};

module.exports = TicketReplyModel;