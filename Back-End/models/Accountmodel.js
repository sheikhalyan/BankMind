const { getPool, sql } = require('../config/db');

const AccountModel = {

    async create({ customer_id, account_number, account_type }) {
        const pool = await getPool();
        const result = await pool.request()
            .input('customer_id', sql.Int, customer_id)
            .input('account_number', sql.NVarChar, account_number)
            .input('account_type', sql.NVarChar, account_type)
            .query(`
        INSERT INTO Accounts (customer_id, account_number, account_type)
        OUTPUT INSERTED.account_id
        VALUES (@customer_id, @account_number, @account_type)
      `);
        return result.recordset[0].account_id;
    },

    async findById(account_id) {
        const pool = await getPool();
        const result = await pool.request()
            .input('account_id', sql.Int, account_id)
            .query('SELECT * FROM Accounts WHERE account_id = @account_id');
        return result.recordset[0] || null;
    },

    async findByNumber(account_number) {
        const pool = await getPool();
        const result = await pool.request()
            .input('account_number', sql.NVarChar, account_number)
            .query('SELECT * FROM Accounts WHERE account_number = @account_number');
        return result.recordset[0] || null;
    },

    async getByCustomer(customer_id) {
        const pool = await getPool();
        const result = await pool.request()
            .input('customer_id', sql.Int, customer_id)
            .query(`
        SELECT * FROM Accounts
        WHERE customer_id = @customer_id
        ORDER BY opened_date DESC
      `);
        return result.recordset;
    },

    async updateStatus(account_id, status) {
        const pool = await getPool();
        const closed_date = status === 'CLOSED' ? new Date() : null;
        await pool.request()
            .input('account_id', sql.Int, account_id)
            .input('status', sql.NVarChar, status)
            .input('closed_date', sql.DateTime, closed_date)
            .query(`
        UPDATE Accounts
        SET status = @status, closed_date = @closed_date
        WHERE account_id = @account_id
      `);
    },

    // Credit or debit balance — called inside a transaction scope
    async adjustBalance(account_id, amount, request) {
        // `request` is an existing mssql Request (within a DB transaction)
        await request
            .input('account_id', sql.Int, account_id)
            .input('amount', sql.Decimal(15, 2), amount)
            .query(`
        UPDATE Accounts
        SET balance = balance + @amount
        WHERE account_id = @account_id
      `);
    },

    async getBalance(account_id) {
        const pool = await getPool();
        const result = await pool.request()
            .input('account_id', sql.Int, account_id)
            .query('SELECT balance FROM Accounts WHERE account_id = @account_id');
        return result.recordset[0]?.balance ?? null;
    },

    // Checks the unique constraint: 1 CURRENT + 1 SAVINGS per customer
    async typeExists(customer_id, account_type) {
        const pool = await getPool();
        const result = await pool.request()
            .input('customer_id', sql.Int, customer_id)
            .input('account_type', sql.NVarChar, account_type)
            .query(`
        SELECT COUNT(1) AS cnt FROM Accounts
        WHERE customer_id = @customer_id AND account_type = @account_type
          AND status NOT IN ('REJECTED', 'CLOSED')
      `);
        return result.recordset[0].cnt > 0;
    },


    // Check if customer has any ACTIVE loans on a specific account
    async hasActiveLoans(account_id) {
        const pool = await getPool();
        const result = await pool.request()
            .input('account_id', sql.Int, account_id)
            .query(`
            SELECT COUNT(1) AS cnt FROM Loans
            WHERE account_id = @account_id AND status = 'ACTIVE'
        `);
        return result.recordset[0].cnt > 0;
    },

    // Get second ACTIVE account of same customer (excluding current account)
    async getSecondAccount(customer_id, exclude_account_id) {
        const pool = await getPool();
        const result = await pool.request()
            .input('customer_id', sql.Int, customer_id)
            .input('exclude_account_id', sql.Int, exclude_account_id)
            .query(`
            SELECT TOP 1 account_id, account_number, account_type, balance
            FROM Accounts
            WHERE customer_id = @customer_id
              AND account_id != @exclude_account_id
              AND status = 'ACTIVE'
        `);
        return result.recordset[0] || null;
    },


};

module.exports = AccountModel;