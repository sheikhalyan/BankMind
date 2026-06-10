const { getPool, sql } = require('../config/db');

const AiChatMessageModel = {

    async create({ session_id, role, content, context_used, tokens_used }) {
        const pool = await getPool();
        const result = await pool.request()
            .input('session_id', sql.Int, session_id)
            .input('role', sql.NVarChar, role)
            .input('content', sql.NVarChar, content)
            .input('context_used', sql.NVarChar, context_used ? JSON.stringify(context_used) : null)
            .input('tokens_used', sql.Int, tokens_used || null)
            .query(`
        INSERT INTO AI_Chat_Messages (session_id, role, content, context_used, tokens_used)
        OUTPUT INSERTED.message_id
        VALUES (@session_id, @role, @content, @context_used, @tokens_used)
      `);
        return result.recordset[0].message_id;
    },

    async getBySession(session_id, { limit = 100, offset = 0 } = {}) {
        const pool = await getPool();
        const result = await pool.request()
            .input('session_id', sql.Int, session_id)
            .input('limit', sql.Int, limit)
            .input('offset', sql.Int, offset)
            .query(`
        SELECT * FROM AI_Chat_Messages
        WHERE session_id = @session_id
        ORDER BY created_at ASC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `);
        // Parse context_used JSON back to object
        return result.recordset.map(row => ({
            ...row,
            context_used: row.context_used ? JSON.parse(row.context_used) : null,
        }));
    },

    // Last N messages — used to build the prompt history sent to the AI
    async getRecentForPrompt(session_id, count = 10) {
        const pool = await getPool();
        const result = await pool.request()
            .input('session_id', sql.Int, session_id)
            .input('count', sql.Int, count)
            .query(`
        SELECT TOP (@count) role, content FROM AI_Chat_Messages
        WHERE session_id = @session_id
        ORDER BY created_at DESC
      `);
        // Reverse so they're in chronological order for the prompt
        return result.recordset.reverse();
    },

    // Total tokens used by a customer across all sessions (cost tracking)
    async getTotalTokensByCustomer(customer_id) {
        const pool = await getPool();
        const result = await pool.request()
            .input('customer_id', sql.Int, customer_id)
            .query(`
        SELECT SUM(m.tokens_used) AS total_tokens
        FROM AI_Chat_Messages m
        JOIN AI_Chat_Sessions s ON s.session_id = m.session_id
        WHERE s.customer_id = @customer_id AND m.tokens_used IS NOT NULL
      `);
        return result.recordset[0].total_tokens || 0;
    },

};

module.exports = AiChatMessageModel;