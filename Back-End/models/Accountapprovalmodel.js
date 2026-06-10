const { getPool, sql } = require('../config/db');

const AccountApprovalModel = {

    async create({ account_id, approver_id, approver_role }) {
        const pool = await getPool();
        const result = await pool.request()
            .input('account_id', sql.Int, account_id)
            .input('approver_id', sql.Int, approver_id)
            .input('approver_role', sql.NVarChar, approver_role)
            .query(`
        INSERT INTO Account_Approvals (account_id, approver_id, approver_role)
        OUTPUT INSERTED.approval_id
        VALUES (@account_id, @approver_id, @approver_role)
      `);
        return result.recordset[0].approval_id;
    },

    async action({ account_id, approver_id, approver_role, status, remarks }) {
        const pool = await getPool();
        await pool.request()
            .input('account_id', sql.Int, account_id)
            .input('approver_id', sql.Int, approver_id)
            .input('approver_role', sql.NVarChar, approver_role)
            .input('status', sql.NVarChar, status)
            .input('remarks', sql.NVarChar, remarks || null)
            .query(`
        UPDATE Account_Approvals
        SET status = @status, remarks = @remarks, actioned_at = GETDATE()
        WHERE account_id    = @account_id
          AND approver_id   = @approver_id
          AND approver_role = @approver_role
      `);
    },

    async getByAccount(account_id) {
        const pool = await getPool();
        const result = await pool.request()
            .input('account_id', sql.Int, account_id)
            .query(`
        SELECT aa.*, u.full_name AS approver_name
        FROM Account_Approvals aa
        JOIN Users u ON u.user_id = aa.approver_id
        WHERE aa.account_id = @account_id
        ORDER BY aa.actioned_at ASC
      `);
        return result.recordset;
    },

    async getPendingForRole(approver_role) {
        const pool = await getPool();
        const result = await pool.request()
            .input('approver_role', sql.NVarChar, approver_role)
            .query(`
        SELECT aa.*, a.account_number, a.account_type, c.full_name AS customer_name
        FROM Account_Approvals aa
        JOIN Accounts  a ON a.account_id   = aa.account_id
        JOIN Customers c ON c.customer_id  = a.customer_id
        WHERE aa.approver_role = @approver_role AND aa.status = 'PENDING'
        ORDER BY aa.actioned_at ASC
      `);
        return result.recordset;
    },

};

module.exports = AccountApprovalModel;