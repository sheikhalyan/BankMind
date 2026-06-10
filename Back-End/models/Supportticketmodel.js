const { getPool, sql } = require('../config/db');

const SupportTicketModel = {

    async create({ customer_id, subject, description, category = 'GENERAL', priority = 'MEDIUM' }) {
        const pool = await getPool();
        const result = await pool.request()
            .input('customer_id', sql.Int, customer_id)
            .input('subject', sql.NVarChar, subject)
            .input('description', sql.NVarChar, description)
            .input('category', sql.NVarChar, category)
            .input('priority', sql.NVarChar, priority)
            .query(`
        INSERT INTO Support_Tickets (customer_id, subject, description, category, priority)
        OUTPUT INSERTED.ticket_id
        VALUES (@customer_id, @subject, @description, @category, @priority)
      `);
        return result.recordset[0].ticket_id;
    },

    async findById(ticket_id) {
        const pool = await getPool();
        const result = await pool.request()
            .input('ticket_id', sql.Int, ticket_id)
            .query(`
        SELECT t.*, c.full_name AS customer_name, u.full_name AS assigned_to_name
        FROM Support_Tickets t
        JOIN Customers c ON c.customer_id = t.customer_id
        LEFT JOIN Users u ON u.user_id = t.assigned_to
        WHERE t.ticket_id = @ticket_id
      `);
        return result.recordset[0] || null;
    },

    async getByCustomer(customer_id, { status } = {}) {
        const pool = await getPool();
        const req = pool.request().input('customer_id', sql.Int, customer_id);
        let where = 'WHERE t.customer_id = @customer_id';
        if (status) { req.input('status', sql.NVarChar, status); where += ' AND t.status = @status'; }
        const result = await req.query(`
      SELECT t.*, u.full_name AS assigned_to_name
      FROM Support_Tickets t
      LEFT JOIN Users u ON u.user_id = t.assigned_to
      ${where}
      ORDER BY t.created_at DESC
    `);
        return result.recordset;
    },

    async getAll({ status, category, assigned_to, limit = 50, offset = 0 } = {}) {
        const pool = await getPool();
        const req = pool.request()
            .input('limit', sql.Int, limit)
            .input('offset', sql.Int, offset);
        let where = 'WHERE 1=1';
        if (status) { req.input('status', sql.NVarChar, status); where += ' AND t.status = @status'; }
        if (category) { req.input('category', sql.NVarChar, category); where += ' AND t.category = @category'; }
        if (assigned_to) { req.input('assigned_to', sql.Int, assigned_to); where += ' AND t.assigned_to = @assigned_to'; }
        const result = await req.query(`
      SELECT t.*, c.full_name AS customer_name, u.full_name AS assigned_to_name
      FROM Support_Tickets t
      JOIN  Customers c ON c.customer_id = t.customer_id
      LEFT JOIN Users u ON u.user_id = t.assigned_to
      ${where}
      ORDER BY
        CASE t.priority WHEN 'HIGH' THEN 1 WHEN 'MEDIUM' THEN 2 ELSE 3 END ASC,
        t.created_at ASC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);
        return result.recordset;
    },

    async assign(ticket_id, assigned_to) {
        const pool = await getPool();
        await pool.request()
            .input('ticket_id', sql.Int, ticket_id)
            .input('assigned_to', sql.Int, assigned_to)
            .query(`
        UPDATE Support_Tickets
        SET assigned_to = @assigned_to, status = 'IN_PROGRESS'
        WHERE ticket_id = @ticket_id
      `);
    },

    async updateStatus(ticket_id, status) {
        const pool = await getPool();
        const resolved_at = status === 'RESOLVED' ? new Date() : null;
        await pool.request()
            .input('ticket_id', sql.Int, ticket_id)
            .input('status', sql.NVarChar, status)
            .input('resolved_at', sql.DateTime, resolved_at)
            .query(`
        UPDATE Support_Tickets
        SET status = @status, resolved_at = @resolved_at
        WHERE ticket_id = @ticket_id
      `);
    },

};

module.exports = SupportTicketModel;