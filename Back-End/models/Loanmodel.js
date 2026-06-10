const { getPool, sql } = require('../config/db');

const LoanModel = {

    async create({ customer_id, account_id, policy_id, loan_amount, duration_months, auto_deduct = 0 }) {
        const pool = await getPool();
        const result = await pool.request()
            .input('customer_id', sql.Int, customer_id)
            .input('account_id', sql.Int, account_id)
            .input('policy_id', sql.Int, policy_id)
            .input('loan_amount', sql.Decimal(15, 2), loan_amount)
            .input('duration_months', sql.Int, duration_months)
            .input('auto_deduct', sql.Bit, auto_deduct ? 1 : 0)
            .query(`
        INSERT INTO Loans (customer_id, account_id, policy_id, loan_amount, duration_months, auto_deduct)
        OUTPUT INSERTED.loan_id
        VALUES (@customer_id, @account_id, @policy_id, @loan_amount, @duration_months, @auto_deduct)
      `);
        return result.recordset[0].loan_id;
    },

    async findById(loan_id) {
        const pool = await getPool();
        const result = await pool.request()
            .input('loan_id', sql.Int, loan_id)
            .query(`
        SELECT l.*, lp.loan_type, lp.interest_rate,
               a.account_number, c.full_name AS customer_name
        FROM Loans l
        JOIN Loan_Policies lp ON lp.policy_id   = l.policy_id
        JOIN Accounts       a  ON a.account_id   = l.account_id
        JOIN Customers      c  ON c.customer_id  = l.customer_id
        WHERE l.loan_id = @loan_id
      `);
        return result.recordset[0] || null;
    },

    async getByCustomer(customer_id) {
        const pool = await getPool();
        const result = await pool.request()
            .input('customer_id', sql.Int, customer_id)
            .query(`
        SELECT l.*, lp.loan_type, lp.interest_rate, a.account_number
        FROM Loans l
        JOIN Loan_Policies lp ON lp.policy_id  = l.policy_id
        JOIN Accounts       a  ON a.account_id  = l.account_id
        WHERE l.customer_id = @customer_id
        ORDER BY l.created_at DESC
      `);
        return result.recordset;
    },

    async updateStatus(loan_id, status) {
        const pool = await getPool();
        await pool.request()
            .input('loan_id', sql.Int, loan_id)
            .input('status', sql.NVarChar, status)
            .query('UPDATE Loans SET status = @status WHERE loan_id = @loan_id');
    },

    // Called when a loan is approved — sets approved amount, start/end dates
    async approve({ loan_id, approved_amount, start_date, end_date }) {
        const pool = await getPool();
        await pool.request()
            .input('loan_id', sql.Int, loan_id)
            .input('approved_amount', sql.Decimal(15, 2), approved_amount)
            .input('start_date', sql.Date, start_date)
            .input('end_date', sql.Date, end_date)
            .query(`
        UPDATE Loans
        SET approved_amount = @approved_amount,
            start_date      = @start_date,
            end_date        = @end_date,
            status          = 'ACTIVE'
        WHERE loan_id = @loan_id
      `);
    },

    // Called when disbursement happens (funds credited to account)
    async disburse({ loan_id, disbursed_amount, disbursed_by }) {
        const pool = await getPool();
        await pool.request()
            .input('loan_id', sql.Int, loan_id)
            .input('disbursed_amount', sql.Decimal(15, 2), disbursed_amount)
            .input('disbursed_by', sql.Int, disbursed_by)
            .query(`
        UPDATE Loans
        SET disbursed_amount = @disbursed_amount,
            disbursed_by     = @disbursed_by,
            disbursed_at     = GETDATE()
        WHERE loan_id = @loan_id
      `);
    },

    async getAll({ status, limit = 50, offset = 0 } = {}) {
        const pool = await getPool();
        const req = pool.request().input('limit', sql.Int, limit).input('offset', sql.Int, offset);
        let where = 'WHERE 1=1';
        if (status) { req.input('status', sql.NVarChar, status); where += ' AND l.status = @status'; }
        const result = await req.query(`
      SELECT l.*, lp.loan_type, lp.interest_rate, c.full_name AS customer_name, a.account_number
      FROM Loans l
      JOIN Loan_Policies lp ON lp.policy_id  = l.policy_id
      JOIN Accounts       a  ON a.account_id  = l.account_id
      JOIN Customers      c  ON c.customer_id = l.customer_id
      ${where}
      ORDER BY l.created_at DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);
        return result.recordset;
    },

};

module.exports = LoanModel;