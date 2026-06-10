const { getPool, sql } = require('../config/db');

const LoanApprovalModel = {

    async create({ loan_id, approver_id, approver_role }) {
        const pool = await getPool();
        const result = await pool.request()
            .input('loan_id', sql.Int, loan_id)
            .input('approver_id', sql.Int, approver_id)
            .input('approver_role', sql.NVarChar, approver_role)
            .query(`
        INSERT INTO Loan_Approvals (loan_id, approver_id, approver_role)
        OUTPUT INSERTED.approval_id
        VALUES (@loan_id, @approver_id, @approver_role)
      `);
        return result.recordset[0].approval_id;
    },

    async action({ loan_id, approver_id, approver_role, status, remarks }) {
        const pool = await getPool();
        await pool.request()
            .input('loan_id', sql.Int, loan_id)
            .input('approver_id', sql.Int, approver_id)
            .input('approver_role', sql.NVarChar, approver_role)
            .input('status', sql.NVarChar, status)
            .input('remarks', sql.NVarChar, remarks || null)
            .query(`
        UPDATE Loan_Approvals
        SET status = @status, remarks = @remarks, actioned_at = GETDATE()
        WHERE loan_id       = @loan_id
          AND approver_id   = @approver_id
          AND approver_role = @approver_role
      `);
    },

    async getByLoan(loan_id) {
        const pool = await getPool();
        const result = await pool.request()
            .input('loan_id', sql.Int, loan_id)
            .query(`
        SELECT la.*, u.full_name AS approver_name
        FROM Loan_Approvals la
        JOIN Users u ON u.user_id = la.approver_id
        WHERE la.loan_id = @loan_id
        ORDER BY la.actioned_at ASC
      `);
        return result.recordset;
    },

    async getPendingForRole(approver_role) {
        const pool = await getPool();
        const result = await pool.request()
            .input('approver_role', sql.NVarChar, approver_role)
            .query(`
        SELECT la.*, l.loan_amount, l.duration_months,
               lp.loan_type, c.full_name AS customer_name
        FROM Loan_Approvals la
        JOIN Loans         l  ON l.loan_id      = la.loan_id
        JOIN Loan_Policies lp ON lp.policy_id   = l.policy_id
        JOIN Customers     c  ON c.customer_id  = l.customer_id
        WHERE la.approver_role = @approver_role AND la.status = 'PENDING'
        ORDER BY la.actioned_at ASC
      `);
        return result.recordset;
    },

};

module.exports = LoanApprovalModel;