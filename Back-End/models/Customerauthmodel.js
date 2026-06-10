const { getPool, sql } = require('../config/db');

// Passwords live ONLY in this table.
// Never SELECT * or return rows from this model directly to API responses.
const CustomerAuthModel = {

    async create(customer_id, password_hash) {
        const pool = await getPool();
        await pool.request()
            .input('customer_id', sql.Int, customer_id)
            .input('password_hash', sql.NVarChar, password_hash)
            .query(`
        INSERT INTO Customer_Auth (customer_id, password_hash)
        VALUES (@customer_id, @password_hash)
      `);
    },

    // Used only for login — returns hash for bcrypt.compare
    async getHashByCustomerId(customer_id) {
        const pool = await getPool();
        const result = await pool.request()
            .input('customer_id', sql.Int, customer_id)
            .query('SELECT password_hash FROM Customer_Auth WHERE customer_id = @customer_id');
        return result.recordset[0]?.password_hash || null;
    },

    async updatePassword(customer_id, new_hash) {
        const pool = await getPool();
        await pool.request()
            .input('customer_id', sql.Int, customer_id)
            .input('password_hash', sql.NVarChar, new_hash)
            .query(`
        UPDATE Customer_Auth
        SET password_hash = @password_hash
        WHERE customer_id = @customer_id
      `);
    },

    async updateLastLogin(customer_id) {
        const pool = await getPool();
        await pool.request()
            .input('customer_id', sql.Int, customer_id)
            .query('UPDATE Customer_Auth SET last_login = GETDATE() WHERE customer_id = @customer_id');
    },

};

module.exports = CustomerAuthModel;