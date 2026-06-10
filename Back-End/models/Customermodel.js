const { getPool, sql } = require('../config/db');

const CustomerModel = {

    async findByEmail(email) {
        const pool = await getPool();
        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT * FROM Customers WHERE email = @email');
        return result.recordset[0] || null;
    },

    async findById(customer_id) {
        const pool = await getPool();
        const result = await pool.request()
            .input('customer_id', sql.Int, customer_id)
            .query(`
        SELECT
          c.customer_id, c.full_name, c.email, c.phone,
          c.address, c.city, c.country, c.status,
          c.assigned_staff_id, c.created_at,
          u.full_name AS assigned_staff_name
        FROM Customers c
        LEFT JOIN Users u ON u.user_id = c.assigned_staff_id
        WHERE c.customer_id = @customer_id
      `);
        return result.recordset[0] || null;
    },

    async getByStaff(staff_id) {
        const pool = await getPool();
        const result = await pool.request()
            .input('staff_id', sql.Int, staff_id)
            .query(`
        SELECT
          customer_id, full_name, email, phone,
          city, country, status, created_at
        FROM Customers
        WHERE assigned_staff_id = @staff_id
        ORDER BY created_at DESC
      `);
        return result.recordset;
    },

    async create({ full_name, email, phone, address, city, country = 'Pakistan' }) {
        const pool = await getPool();
        const result = await pool.request()
            .input('full_name', sql.NVarChar, full_name)
            .input('email', sql.NVarChar, email)
            .input('phone', sql.NVarChar, phone)
            .input('address', sql.NVarChar, address || null)
            .input('city', sql.NVarChar, city || null)
            .input('country', sql.NVarChar, country)
            .query(`
        INSERT INTO Customers (full_name, email, phone, address, city, country)
        OUTPUT INSERTED.customer_id
        VALUES (@full_name, @email, @phone, @address, @city, @country)
      `);
        return result.recordset[0].customer_id;
    },

    async updateStatus(customer_id, status) {
        const pool = await getPool();
        await pool.request()
            .input('customer_id', sql.Int, customer_id)
            .input('status', sql.NVarChar, status)
            .query('UPDATE Customers SET status = @status WHERE customer_id = @customer_id');
    },

    async assignStaff(customer_id, staff_id) {
        const pool = await getPool();
        await pool.request()
            .input('customer_id', sql.Int, customer_id)
            .input('assigned_staff_id', sql.Int, staff_id)
            .query(`
        UPDATE Customers
        SET assigned_staff_id = @assigned_staff_id
        WHERE customer_id = @customer_id
      `);
    },

    async update(customer_id, { full_name, phone, address, city, country }) {
        const pool = await getPool();
        await pool.request()
            .input('customer_id', sql.Int, customer_id)
            .input('full_name', sql.NVarChar, full_name)
            .input('phone', sql.NVarChar, phone)
            .input('address', sql.NVarChar, address || null)
            .input('city', sql.NVarChar, city || null)
            .input('country', sql.NVarChar, country)
            .query(`
        UPDATE Customers
        SET full_name = @full_name, phone = @phone, address = @address,
            city = @city, country = @country
        WHERE customer_id = @customer_id
      `);
    },

    async getAll({ status } = {}) {
        const pool = await getPool();
        const req = pool.request();
        let where = 'WHERE 1=1';
        if (status) { req.input('status', sql.NVarChar, status); where += ' AND status = @status'; }
        const result = await req.query(`
      SELECT
        c.customer_id, c.full_name, c.email, c.phone,
        c.city, c.country, c.status, c.created_at,
        c.assigned_staff_id,
        u.full_name AS assigned_staff_name
      FROM Customers c
      LEFT JOIN Users u ON u.user_id = c.assigned_staff_id
      ${where}
      ORDER BY c.created_at DESC
    `);
        return result.recordset;
    },

};

module.exports = CustomerModel;
