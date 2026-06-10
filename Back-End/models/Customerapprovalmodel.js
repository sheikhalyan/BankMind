const { getPool, sql } = require('../config/db');

// Two-level approval: STAFF approves first, then ADMIN gives final approval.
// One row per level per customer.
const CustomerApprovalModel = {

    async create({ customer_id, approver_id, approver_role }) {
        const pool = await getPool();
        const result = await pool.request()
            .input('customer_id', sql.Int, customer_id)
            .input('approver_id', sql.Int, approver_id)
            .input('approver_role', sql.NVarChar, approver_role)
            .query(`
        INSERT INTO Customer_Approvals (customer_id, approver_id, approver_role)
        OUTPUT INSERTED.approval_id
        VALUES (@customer_id, @approver_id, @approver_role)
      `);
        return result.recordset[0].approval_id;
    },

    async action({ customer_id, approver_id, approver_role, status, remarks }) {
        const pool = await getPool();

        // When staff approves, assign themselves as the customer's dedicated staff
        if (approver_role === 'STAFF' && status === 'APPROVED') {
            await pool.request()
                .input('customer_id', sql.Int, customer_id)
                .input('assigned_staff_id', sql.Int, approver_id)
                .query(`
                UPDATE Customers
                SET assigned_staff_id = @assigned_staff_id
                WHERE customer_id = @customer_id
            `);
        }

        await pool.request()
            .input('customer_id', sql.Int, customer_id)
            .input('approver_id', sql.Int, approver_id)
            .input('approver_role', sql.NVarChar, approver_role)
            .input('status', sql.NVarChar, status)
            .input('remarks', sql.NVarChar, remarks || null)
            .query(`
            UPDATE Customer_Approvals
            SET status = @status, remarks = @remarks, actioned_at = GETDATE()
            WHERE customer_id   = @customer_id
              AND approver_id   = @approver_id
              AND approver_role = @approver_role
        `);
    },

    async getByCustomer(customer_id) {
        const pool = await getPool();
        const result = await pool.request()
            .input('customer_id', sql.Int, customer_id)
            .query(`
        SELECT ca.*, u.full_name AS approver_name
        FROM Customer_Approvals ca
        JOIN Users u ON u.user_id = ca.approver_id
        WHERE ca.customer_id = @customer_id
        ORDER BY ca.actioned_at ASC
      `);
        return result.recordset;
    },

    // Returns the latest status for a given role level
    async getStatusForRole(customer_id, approver_role) {
        const pool = await getPool();
        const result = await pool.request()
            .input('customer_id', sql.Int, customer_id)
            .input('approver_role', sql.NVarChar, approver_role)
            .query(`
        SELECT TOP 1 status FROM Customer_Approvals
        WHERE customer_id = @customer_id AND approver_role = @approver_role
        ORDER BY actioned_at DESC
      `);
        return result.recordset[0]?.status || null;
    },

    // Pending customers for a given approver role (staff dashboard)
    async getPendingForRole(approver_role) {
        const pool = await getPool();
        const result = await pool.request()
            .input('approver_role', sql.NVarChar, approver_role)
            .query(`
        SELECT ca.*, c.full_name AS customer_name, c.email
        FROM Customer_Approvals ca
        JOIN Customers c ON c.customer_id = ca.customer_id
        WHERE ca.approver_role = @approver_role AND ca.status = 'PENDING'
        ORDER BY ca.actioned_at ASC
      `);
        return result.recordset;
    },

};

module.exports = CustomerApprovalModel;