const { getPool, sql } = require('../config/db');

const AiChatSessionModel = {

    async create({ customer_id, title }) {
        const pool = await getPool();
        const result = await pool.request()
            .input('customer_id', sql.Int, customer_id)
            .input('title', sql.NVarChar, title || null)
            .query(`
        INSERT INTO AI_Chat_Sessions (customer_id, title)
        OUTPUT INSERTED.session_id
        VALUES (@customer_id, @title)
      `);
        return result.recordset[0].session_id;
    },

    async findById(session_id) {
        const pool = await getPool();
        const result = await pool.request()
            .input('session_id', sql.Int, session_id)
            .query('SELECT * FROM AI_Chat_Sessions WHERE session_id = @session_id');
        return result.recordset[0] || null;
    },

    async getByCustomer(customer_id, { limit = 20, offset = 0 } = {}) {
        const pool = await getPool();
        const result = await pool.request()
            .input('customer_id', sql.Int, customer_id)
            .input('limit', sql.Int, limit)
            .input('offset', sql.Int, offset)
            .query(`
        SELECT * FROM AI_Chat_Sessions
        WHERE customer_id = @customer_id
        ORDER BY COALESCE(last_message_at, started_at) DESC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `);
        return result.recordset;
    },

    async updateTitle(session_id, title) {
        const pool = await getPool();
        await pool.request()
            .input('session_id', sql.Int, session_id)
            .input('title', sql.NVarChar, title)
            .query('UPDATE AI_Chat_Sessions SET title = @title WHERE session_id = @session_id');
    },

    async touchLastMessage(session_id) {
        const pool = await getPool();
        await pool.request()
            .input('session_id', sql.Int, session_id)
            .query('UPDATE AI_Chat_Sessions SET last_message_at = GETDATE() WHERE session_id = @session_id');
    },

};

module.exports = AiChatSessionModel;