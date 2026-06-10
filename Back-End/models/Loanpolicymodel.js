const { getPool, sql } = require('../config/db');

const LoanPolicyModel = {

    async getAll(active_only = true) {
        const pool = await getPool();
        const req = pool.request();
        let where = active_only ? 'WHERE is_active = 1' : '';
        const result = await req.query(
            `SELECT * FROM Loan_Policies ${where} ORDER BY loan_type ASC`
        );
        return result.recordset;
    },

    async findById(policy_id) {
        const pool = await getPool();
        const result = await pool.request()
            .input('policy_id', sql.Int, policy_id)
            .query('SELECT * FROM Loan_Policies WHERE policy_id = @policy_id');
        return result.recordset[0] || null;
    },

    async findByType(loan_type) {
        const pool = await getPool();
        const result = await pool.request()
            .input('loan_type', sql.NVarChar, loan_type)
            .query('SELECT * FROM Loan_Policies WHERE loan_type = @loan_type AND is_active = 1');
        return result.recordset[0] || null;
    },

    async create({ loan_type, min_amount, max_amount, min_months, max_months, interest_rate }) {
        const pool = await getPool();
        const result = await pool.request()
            .input('loan_type', sql.NVarChar, loan_type)
            .input('min_amount', sql.Decimal(15, 2), min_amount)
            .input('max_amount', sql.Decimal(15, 2), max_amount)
            .input('min_months', sql.Int, min_months)
            .input('max_months', sql.Int, max_months)
            .input('interest_rate', sql.Decimal(5, 2), interest_rate)
            .query(`
        INSERT INTO Loan_Policies (loan_type, min_amount, max_amount, min_months, max_months, interest_rate)
        OUTPUT INSERTED.policy_id
        VALUES (@loan_type, @min_amount, @max_amount, @min_months, @max_months, @interest_rate)
      `);
        return result.recordset[0].policy_id;
    },

    async update(policy_id, { min_amount, max_amount, min_months, max_months, interest_rate }) {
        const pool = await getPool();
        await pool.request()
            .input('policy_id', sql.Int, policy_id)
            .input('min_amount', sql.Decimal(15, 2), min_amount)
            .input('max_amount', sql.Decimal(15, 2), max_amount)
            .input('min_months', sql.Int, min_months)
            .input('max_months', sql.Int, max_months)
            .input('interest_rate', sql.Decimal(5, 2), interest_rate)
            .query(`
        UPDATE Loan_Policies
        SET min_amount = @min_amount, max_amount = @max_amount,
            min_months = @min_months, max_months = @max_months,
            interest_rate = @interest_rate, updated_at = GETDATE()
        WHERE policy_id = @policy_id
      `);
    },

    async setActive(policy_id, is_active) {
        const pool = await getPool();
        await pool.request()
            .input('policy_id', sql.Int, policy_id)
            .input('is_active', sql.Bit, is_active ? 1 : 0)
            .query('UPDATE Loan_Policies SET is_active = @is_active, updated_at = GETDATE() WHERE policy_id = @policy_id');
    },

};

module.exports = LoanPolicyModel;