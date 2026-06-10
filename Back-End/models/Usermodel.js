const { getPool, sql } = require('../config/db');

const UserModel = {

    async findByEmail(email) {
        const pool = await getPool();
        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT * FROM Users WHERE email = @email');
        return result.recordset[0] || null;
    },

    async findById(user_id) {
        const pool = await getPool();
        const result = await pool.request()
            .input('user_id', sql.Int, user_id)
            .query('SELECT user_id, full_name, email, role, status, created_at, last_login FROM Users WHERE user_id = @user_id');
        return result.recordset[0] || null;
    },

    async create({ full_name, email, password_hash, role = 'STAFF' }) {
        const pool = await getPool();
        const result = await pool.request()
            .input('full_name', sql.NVarChar, full_name)
            .input('email', sql.NVarChar, email)
            .input('password_hash', sql.NVarChar, password_hash)
            .input('role', sql.NVarChar, role)
            .query(`
        INSERT INTO Users (full_name, email, password_hash, role)
        OUTPUT INSERTED.user_id
        VALUES (@full_name, @email, @password_hash, @role)
      `);
        return result.recordset[0].user_id;
    },

    async updateStatus(user_id, status) {
        const pool = await getPool();
        await pool.request()
            .input('user_id', sql.Int, user_id)
            .input('status', sql.NVarChar, status)
            .query('UPDATE Users SET status = @status WHERE user_id = @user_id');
    },

    async updateLastLogin(user_id) {
        const pool = await getPool();
        await pool.request()
            .input('user_id', sql.Int, user_id)
            .query('UPDATE Users SET last_login = GETDATE() WHERE user_id = @user_id');
    },

    async getAll({ role, status } = {}) {
        const pool = await getPool();
        const req = pool.request();
        let where = 'WHERE 1=1';
        if (role) { req.input('role', sql.NVarChar, role); where += ' AND role = @role'; }
        if (status) { req.input('status', sql.NVarChar, status); where += ' AND status = @status'; }
        const result = await req.query(
            `SELECT user_id, full_name, email, role, status, created_at, last_login FROM Users ${where} ORDER BY created_at DESC`
        );
        return result.recordset;
    },

};

module.exports = UserModel;