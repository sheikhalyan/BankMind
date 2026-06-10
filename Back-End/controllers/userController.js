const { getPool, sql } = require('../config/db');
const bcrypt = require('bcryptjs');
const {
  notifyAdmins,
  notifyAssignedStaff,
} = require('../utils/notifications');

// ================================================================
//  GET /api/user/profile
//  Works for CUSTOMER, STAFF, ADMIN
// ================================================================
exports.getMyProfile = async (req, res) => {
  try {
    const pool = await getPool();
    const role = req.user.role?.toUpperCase();
    const userId = role === 'CUSTOMER' ? req.user.customerId : req.user.userId;

    let result;

    if (role === 'CUSTOMER') {
      result = await pool.request()
        .input('customer_id', sql.Int, userId)
        .query(`
          SELECT
            c.customer_id  AS id,
            c.full_name,
            c.email,
            c.phone,
            c.address,
            c.city,
            c.country,
            c.status,
            c.created_at,
            'CUSTOMER'     AS role
          FROM Customers c
          WHERE c.customer_id = @customer_id
        `);
    } else {
      // STAFF or ADMIN — no phone/address in Users table
      result = await pool.request()
        .input('user_id', sql.Int, userId)
        .query(`
          SELECT
            user_id    AS id,
            full_name,
            email,
            role,
            status,
            created_at,
            last_login
          FROM Users
          WHERE user_id = @user_id
        `);
    }

    if (!result.recordset[0])
      return res.status(404).json({ message: 'Profile not found.' });

    return res.json(result.recordset[0]);

  } catch (err) {
    console.error('[getMyProfile]', err);
    return res.status(500).json({ error: err.message });
  }
};

// ================================================================
//  PUT /api/user/profile
//  CUSTOMER  → updates Customers (full_name, phone, address, city)
//  STAFF     → updates Users (full_name only — no phone/address in Users)
//  ADMIN     → updates Users (full_name only)
// ================================================================
exports.updateProfile = async (req, res) => {
  const { full_name, phone, address, city } = req.body;
  const role = req.user.role?.toUpperCase();
  const userId = role === 'CUSTOMER' ? req.user.customerId : req.user.userId;

  if (!full_name)
    return res.status(400).json({ message: 'full_name is required.' });

  try {
    const pool = await getPool();

    if (role === 'CUSTOMER') {
      await pool.request()
        .input('customer_id', sql.Int, userId)
        .input('full_name', sql.NVarChar, full_name)
        .input('phone', sql.NVarChar, phone || null)
        .input('address', sql.NVarChar, address || null)
        .input('city', sql.NVarChar, city || null)
        .query(`
          UPDATE Customers
          SET full_name = @full_name,
              phone     = @phone,
              address   = @address,
              city      = @city
          WHERE customer_id = @customer_id
        `);

      // Notify ONLY the assigned staff — not all staff
      await notifyAssignedStaff({
        customer_id: userId,
        type: 'CUSTOMER_PROFILE_UPDATED',
        message: `Customer ${full_name} updated their profile.`,
        related_id: userId,
        related_type: 'CUSTOMER',
      });

    } else {
      // STAFF or ADMIN — only full_name updatable
      await pool.request()
        .input('user_id', sql.Int, userId)
        .input('full_name', sql.NVarChar, full_name)
        .query(`
          UPDATE Users SET full_name = @full_name WHERE user_id = @user_id
        `);

      if (role === 'STAFF') {
        await notifyAdmins({
          type: 'STAFF_PROFILE_UPDATED',
          message: `Staff member ${full_name} updated their profile.`,
          related_id: userId,
          related_type: 'USER',
        });
      }
    }

    return res.json({ message: 'Profile updated successfully.' });

  } catch (err) {
    console.error('[updateProfile]', err);
    return res.status(500).json({ error: err.message });
  }
};

// ================================================================
//  PUT /api/user/change-password
//  CUSTOMER  → password in Customer_Auth
//  STAFF/ADMIN → password in Users
// ================================================================
exports.changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const role = req.user.role?.toUpperCase();
  const userId = role === 'CUSTOMER' ? req.user.customerId : req.user.userId;

  if (!oldPassword || !newPassword)
    return res.status(400).json({ message: 'oldPassword and newPassword are required.' });

  if (newPassword.length < 6)
    return res.status(400).json({ message: 'New password must be at least 6 characters.' });

  try {
    const pool = await getPool();
    let storedHash, fullName;

    if (role === 'CUSTOMER') {
      const result = await pool.request()
        .input('customer_id', sql.Int, userId)
        .query(`
          SELECT ca.password_hash, c.full_name
          FROM   Customer_Auth ca
          JOIN   Customers c ON c.customer_id = ca.customer_id
          WHERE  ca.customer_id = @customer_id
        `);

      if (!result.recordset[0])
        return res.status(404).json({ message: 'Customer not found.' });

      storedHash = result.recordset[0].password_hash;
      fullName = result.recordset[0].full_name;

    } else {
      const result = await pool.request()
        .input('user_id', sql.Int, userId)
        .query(`SELECT password_hash, full_name FROM Users WHERE user_id = @user_id`);

      if (!result.recordset[0])
        return res.status(404).json({ message: 'User not found.' });

      storedHash = result.recordset[0].password_hash;
      fullName = result.recordset[0].full_name;
    }

    const isMatch = await bcrypt.compare(oldPassword, storedHash);
    if (!isMatch)
      return res.status(400).json({ message: 'Old password is incorrect.' });

    const newHash = await bcrypt.hash(newPassword, 10);

    if (role === 'CUSTOMER') {
      await pool.request()
        .input('customer_id', sql.Int, userId)
        .input('password_hash', sql.NVarChar, newHash)
        .query(`
          UPDATE Customer_Auth
          SET password_hash = @password_hash
          WHERE customer_id = @customer_id
        `);

      // Notify only assigned staff
      await notifyAssignedStaff({
        customer_id: userId,
        type: 'CUSTOMER_PASSWORD_CHANGED',
        message: `Customer ${fullName} changed their password.`,
        related_id: userId,
        related_type: 'CUSTOMER',
      });

    } else {
      await pool.request()
        .input('user_id', sql.Int, userId)
        .input('password_hash', sql.NVarChar, newHash)
        .query(`
          UPDATE Users SET password_hash = @password_hash WHERE user_id = @user_id
        `);

      if (role === 'STAFF') {
        await notifyAdmins({
          type: 'STAFF_PASSWORD_CHANGED',
          message: `Staff member ${fullName} changed their password.`,
          related_id: userId,
          related_type: 'USER',
        });
      }
    }

    return res.json({ message: 'Password changed successfully.' });

  } catch (err) {
    console.error('[changePassword]', err);
    return res.status(500).json({ error: err.message });
  }
};