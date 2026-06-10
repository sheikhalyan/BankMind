const { getPool, sql } = require('../config/db');

// from_account_id = NULL  → cash deposit  (money comes from outside)
// to_account_id   = NULL  → cash withdrawal (money leaves the bank)
// Both filled              → internal transfer

const TransactionModel = {

    async create({ from_account_id, to_account_id, transaction_type, amount, description, status = 'COMPLETED' }, sqlRequest = null) {
        // Accept an external mssql Request to run inside a DB transaction
        const request = sqlRequest || (await getPool()).request();
        const result = await request
            .input('from_account_id', sql.Int, from_account_id || null)
            .input('to_account_id', sql.Int, to_account_id || null)
            .input('transaction_type', sql.NVarChar, transaction_type)
            .input('amount', sql.Decimal(15, 2), amount)
            .input('description', sql.NVarChar, description || null)
            .input('status', sql.NVarChar, status)
            .query(`
        INSERT INTO Transactions (from_account_id, to_account_id, transaction_type, amount, description, status)
        OUTPUT INSERTED.transaction_id
        VALUES (@from_account_id, @to_account_id, @transaction_type, @amount, @description, @status)
      `);
        return result.recordset[0].transaction_id;
    },

    async findById(transaction_id) {
        const pool = await getPool();
        const result = await pool.request()
            .input('transaction_id', sql.Int, transaction_id)
            .query(`
        SELECT t.*,
               fa.account_number AS from_account_number,
               ta.account_number AS to_account_number
        FROM Transactions t
        LEFT JOIN Accounts fa ON fa.account_id = t.from_account_id
        LEFT JOIN Accounts ta ON ta.account_id = t.to_account_id
        WHERE t.transaction_id = @transaction_id
      `);
        return result.recordset[0] || null;
    },

    async getByAccount(account_id, { limit = 50, offset = 0 } = {}) {
        const pool = await getPool();
        const result = await pool.request()
            .input('account_id', sql.Int, account_id)
            .input('limit', sql.Int, limit)
            .input('offset', sql.Int, offset)
            .query(`
        SELECT t.*,
               fa.account_number AS from_account_number,
               ta.account_number AS to_account_number
        FROM Transactions t
        LEFT JOIN Accounts fa ON fa.account_id = t.from_account_id
        LEFT JOIN Accounts ta ON ta.account_id = t.to_account_id
        WHERE t.from_account_id = @account_id OR t.to_account_id = @account_id
        ORDER BY t.transaction_time DESC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `);
        return result.recordset;
    },

    async updateStatus(transaction_id, status) {
        const pool = await getPool();
        await pool.request()
            .input('transaction_id', sql.Int, transaction_id)
            .input('status', sql.NVarChar, status)
            .query('UPDATE Transactions SET status = @status WHERE transaction_id = @transaction_id');
    },

    async markFraud(transaction_id, is_fraud = 1) {
        const pool = await getPool();
        await pool.request()
            .input('transaction_id', sql.Int, transaction_id)
            .input('is_fraud', sql.Bit, is_fraud)
            .query('UPDATE Transactions SET is_fraud = @is_fraud WHERE transaction_id = @transaction_id');
    },

    // Recent transactions for an account — used by fraud model for velocity checks
    async getRecentByAccount(account_id, minutes = 10) {
        const pool = await getPool();
        const result = await pool.request()
            .input('account_id', sql.Int, account_id)
            .input('minutes', sql.Int, minutes)
            .query(`
        SELECT * FROM Transactions
        WHERE (from_account_id = @account_id OR to_account_id = @account_id)
          AND transaction_time >= DATEADD(MINUTE, -@minutes, GETDATE())
          AND status = 'COMPLETED'
        ORDER BY transaction_time DESC
      `);
        return result.recordset;
    },

};

module.exports = TransactionModel;