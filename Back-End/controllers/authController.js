const { poolPromise, sql } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createAndSendOTP } = require('../utils/otp');

/**
 * =========================
 * REGISTER USER ONLY NOT ADMIN (UNCHANGED)
 * =========================
 */
const register = async (req, res) => {
  const { fullName, email, password } = req.body;

  try {
    const pool = await poolPromise;

    const existingUser = await pool.request()
      .input('email', sql.VarChar, email)
      .query(`SELECT user_id FROM Users WHERE email = @email`);

    if (existingUser.recordset.length > 0) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.request()
      .input('full_name', sql.VarChar, fullName)
      .input('email', sql.VarChar, email)
      .input('password_hash', sql.VarChar, hashedPassword)
      .query(`
        INSERT INTO Users (full_name, email, password_hash, role, is_approved)
        VALUES (@full_name, @email, @password_hash, 'USER', 0)
      `);

    res.status(201).json({
      message: 'Registration successful. Await admin approval.'
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * =========================
 * USER LOGIN / ADMIN LOGIN → SEND OTP
 * =========================
 */
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('email', sql.VarChar, email)
      .query(`
        SELECT user_id, full_name, password_hash, role, is_approved
        FROM Users
        WHERE email = @email
      `);

    const user = result.recordset[0];
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    if (!user.is_approved)
      return res.status(403).json({ message: 'Account pending admin approval' });

    // 🔐 SEND OTP
    await createAndSendOTP(user.user_id, 'USER', email);

    res.json({
      message: 'OTP sent to your email',
      entity_id: user.user_id,
      entity_type: 'USER'
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * =========================
 * CUSTOMER REGISTER (UNCHANGED)
 * =========================
 */
const registerCustomer = async (req, res) => {
  const { customer_name, email, password, phone, address } = req.body;

  try {
    const pool = await poolPromise;

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.request()
      .input('customer_name', sql.VarChar, customer_name)
      .input('email', sql.VarChar, email)
      .input('password', sql.VarChar, hashedPassword)
      .input('phone', sql.VarChar, phone)
      .input('address', sql.VarChar, address)
      .query(`
        INSERT INTO Customers (customer_name, email, [password], phone, address)
        VALUES (@customer_name, @email, @password, @phone, @address)
      `);

    res.status(201).json({
      message: 'Customer registered successfully. Awaiting approvals.'
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * =========================
 * CUSTOMER LOGIN → SEND OTP
 * =========================
 */
const customerLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('email', sql.VarChar, email)
      .query(`
        SELECT customer_id, customer_name, [password],
               is_user_approved, is_admin_approved
        FROM Customers
        WHERE email = @email
      `);

    const customer = result.recordset[0];
    if (!customer) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, customer.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    if (!customer.is_user_approved || !customer.is_admin_approved)
      return res.status(403).json({ message: 'Customer not fully approved' });

    // 🔐 SEND OTP
    await createAndSendOTP(customer.customer_id, 'CUSTOMER', email);

    res.json({
      message: 'OTP sent to your email',
      entity_id: customer.customer_id,
      entity_type: 'CUSTOMER'
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * =========================
 * OTP VERIFY → FINAL LOGIN
 * =========================
 */

const verifyOTP = async (req, res) => {
  const { entity_id, entity_type, otp_code } = req.body;

  try {
    const pool = await poolPromise;

    const nowUTC = new Date(new Date().toISOString());
    const entityTypeUpper = entity_type.toUpperCase();
    const otpCodeTrimmed = otp_code.trim();

    const otpResult = await pool.request()
      .input('entity_id', sql.Int, entity_id)
      .input('entity_type', sql.VarChar, entityTypeUpper)
      .input('otp_code', sql.VarChar, otpCodeTrimmed)
      .input('now', sql.DateTime, nowUTC)
      .query(`
        SELECT otp_id, expires_at
        FROM OTP_Tokens
        WHERE entity_id = @entity_id
          AND entity_type = @entity_type
          AND otp_code = @otp_code
          AND is_used = 0
          AND expires_at > @now
      `);

    console.log('Verify OTP:', {
      entity_id,
      entityTypeUpper,
      otpCodeTrimmed,
      nowUTC,
      found: otpResult.recordset.length
    });

    if (otpResult.recordset.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    await pool.request()
      .input('otp_id', sql.Int, otpResult.recordset[0].otp_id)
      .query(`UPDATE OTP_Tokens SET is_used = 1 WHERE otp_id = @otp_id`);

    // ✅ FIX: Get the actual role from database for users
    let role = entityTypeUpper; // Default to 'USER' or 'CUSTOMER'
    let userId = null;
    let customerId = null;

    if (entityTypeUpper === 'USER') {
      // Get user details to check if they are admin
      const userResult = await pool.request()
        .input('user_id', sql.Int, entity_id)
        .query(`SELECT role FROM Users WHERE user_id = @user_id`);
      
      if (userResult.recordset.length > 0) {
        role = userResult.recordset[0].role; // This will be 'ADMIN' or 'USER'
        userId = entity_id;
      }
    } else if (entityTypeUpper === 'CUSTOMER') {
      customerId = entity_id;
      role = 'CUSTOMER';
    }

    // Create payload with correct role
    const payload = {
      ...(userId && { userId }),
      ...(customerId && { customerId }),
      role: role  // Now correctly 'ADMIN', 'USER', or 'CUSTOMER'
    };

    console.log('Creating token with payload:', payload); // Debug log

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '1d'
    });

    res.json({ message: 'Login successful', token });

  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ error: err.message });
  }
};



module.exports = {
  register,
  login,
  registerCustomer,
  customerLogin,
  verifyOTP
};
