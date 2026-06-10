const { getPool, sql } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createAndSendOTP } = require('../utils/otp');

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────

/**
 * Build and sign a JWT.
 *
 * Payload shape:
 *   Staff / Admin  → { userId,     role: 'STAFF' | 'ADMIN' }
 *   Customer       → { customerId, role: 'CUSTOMER' }
 */
const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });


// ================================================================
//  1. STAFF  —  REGISTER  (self-registration, awaits admin approval)
//     POST /api/auth/register
//     Body: { full_name, email, password }
//
//     - role is always 'STAFF' — admin accounts are seeded directly in DB
//     - status defaults to 'PENDING' (schema default)
//     - Admin approves/rejects via User Management controller
// ================================================================
const register = async (req, res) => {
  const { full_name, email, password } = req.body;

  if (!full_name || !email || !password)
    return res.status(400).json({ message: 'full_name, email, and password are required.' });

  try {
    const pool = await getPool();

    // Check duplicate email
    const dup = await pool.request()
      .input('email', sql.NVarChar, email.trim().toLowerCase())
      .query(`SELECT user_id FROM Users WHERE email = @email`);

    if (dup.recordset.length > 0)
      return res.status(409).json({ message: 'Email is already registered.' });

    const passwordHash = await bcrypt.hash(password, 10);

    const insertResult = await pool.request()
      .input('full_name', sql.NVarChar, full_name.trim())
      .input('email', sql.NVarChar, email.trim().toLowerCase())
      .input('password_hash', sql.NVarChar, passwordHash)
      .query(`
        INSERT INTO Users (full_name, email, password_hash, role, status)
        OUTPUT INSERTED.user_id
        VALUES (@full_name, @email, @password_hash, 'STAFF', 'PENDING')
      `);

    const userId = insertResult.recordset[0].user_id;

    return res.status(201).json({
      message: 'Registration successful. Your account is pending admin approval.',
      user_id: userId,
    });

  } catch (err) {
    console.error('[register]', err);
    return res.status(500).json({ error: err.message });
  }
};


// ================================================================
//  1. STAFF / ADMIN  —  LOGIN  (→ OTP)
//     POST /api/auth/login
//     Body: { email, password }
// ================================================================
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: 'Email and password are required.' });

  try {
    const pool = await getPool();

    const result = await pool.request()
      .input('email', sql.NVarChar, email.trim().toLowerCase())
      .query(`
        SELECT user_id, full_name, password_hash, role, status
        FROM   Users
        WHERE  email = @email
      `);

    const user = result.recordset[0];

    // Generic message — don't reveal whether email exists
    if (!user) return res.status(401).json({ message: 'Invalid credentials.' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ message: 'Invalid credentials.' });

    if (user.status !== 'ACTIVE')
      return res.status(403).json({
        message: `Account is ${user.status.toLowerCase()}. Contact the administrator.`,
      });

    // Determine OTP entity_type from role
    const entityType = user.role; // 'STAFF' or 'ADMIN'

    await createAndSendOTP(user.user_id, entityType, email.trim(), 'LOGIN');

    return res.status(200).json({
      message: 'OTP sent to your registered email.',
      entity_id: user.user_id,
      entity_type: entityType,
      // Expose in response so FE can poll SQL directly during testing
      _dev_note: 'Check OTP_Tokens table for otp_code (testing only — remove in prod)',
    });

  } catch (err) {
    console.error('[login]', err);
    return res.status(500).json({ error: err.message });
  }
};


// ================================================================
//  2. CUSTOMER  —  REGISTER
//     POST /api/auth/customer/register
//     Body: { full_name, email, password, phone, address?, city?, country? }
//
//     Flow:
//       • Insert into Customers (status = PENDING)
//       • Insert hashed password into Customer_Auth
//       • No approval rows yet — assigned staff creates those
// ================================================================
const registerCustomer = async (req, res) => {
  const { full_name, email, password, phone, address, city, country } = req.body;

  if (!full_name || !email || !password || !phone)
    return res.status(400).json({ message: 'full_name, email, password, and phone are required.' });

  try {
    const pool = await getPool();

    // Check duplicate email
    const dup = await pool.request()
      .input('email', sql.NVarChar, email.trim().toLowerCase())
      .query(`SELECT customer_id FROM Customers WHERE email = @email`);

    if (dup.recordset.length > 0)
      return res.status(409).json({ message: 'Email is already registered.' });

    const passwordHash = await bcrypt.hash(password, 10);

    // Insert Customer — status defaults to PENDING in schema
    const insertResult = await pool.request()
      .input('full_name', sql.NVarChar, full_name.trim())
      .input('email', sql.NVarChar, email.trim().toLowerCase())
      .input('phone', sql.NVarChar, phone.trim())
      .input('address', sql.NVarChar, address || null)
      .input('city', sql.NVarChar, city || null)
      .input('country', sql.NVarChar, country || 'Pakistan')
      .query(`
        INSERT INTO Customers (full_name, email, phone, address, city, country)
        OUTPUT INSERTED.customer_id
        VALUES (@full_name, @email, @phone, @address, @city, @country)
      `);

    const customerId = insertResult.recordset[0].customer_id;

    // Insert into Customer_Auth (passwords NEVER in Customers table)
    await pool.request()
      .input('customer_id', sql.Int, customerId)
      .input('password_hash', sql.NVarChar, passwordHash)
      .query(`
        INSERT INTO Customer_Auth (customer_id, password_hash)
        VALUES (@customer_id, @password_hash)
      `);

    return res.status(201).json({
      message: 'Registration successful. Your account is pending staff and admin approval.',
      customer_id: customerId,
    });

  } catch (err) {
    console.error('[registerCustomer]', err);
    return res.status(500).json({ error: err.message });
  }
};


// ================================================================
//  3. CUSTOMER  —  LOGIN  (→ OTP)
//     POST /api/auth/customer/login
//     Body: { email, password }
//
//     Guards:
//       • Password check via Customer_Auth
//       • Must have STAFF approval row = APPROVED
//       • Must have ADMIN  approval row = APPROVED
//       • Customer.status must be ACTIVE
// ================================================================
const customerLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: 'Email and password are required.' });

  try {
    const pool = await getPool();

    // Join Customers + Customer_Auth
    const result = await pool.request()
      .input('email', sql.NVarChar, email.trim().toLowerCase())
      .query(`
        SELECT
          c.customer_id,
          c.full_name,
          c.email,
          c.status,
          ca.password_hash
        FROM   Customers    c
        JOIN   Customer_Auth ca ON ca.customer_id = c.customer_id
        WHERE  c.email = @email
      `);

    const customer = result.recordset[0];
    if (!customer) return res.status(401).json({ message: 'Invalid credentials.' });

    const match = await bcrypt.compare(password, customer.password_hash);
    if (!match) return res.status(401).json({ message: 'Invalid credentials.' });

    // Check two-level approval
    const approvalResult = await pool.request()
      .input('customer_id', sql.Int, customer.customer_id)
      .query(`
        SELECT approver_role, status
        FROM   Customer_Approvals
        WHERE  customer_id = @customer_id
      `);

    const approvals = approvalResult.recordset;
    const staffApproval = approvals.find(a => a.approver_role === 'STAFF');
    const adminApproval = approvals.find(a => a.approver_role === 'ADMIN');

    if (!staffApproval || staffApproval.status !== 'APPROVED')
      return res.status(403).json({ message: 'Account pending staff approval.' });

    if (!adminApproval || adminApproval.status !== 'APPROVED')
      return res.status(403).json({ message: 'Account pending admin approval.' });

    if (customer.status !== 'ACTIVE')
      return res.status(403).json({
        message: `Account is ${customer.status.toLowerCase()}.`,
      });

    await createAndSendOTP(customer.customer_id, 'CUSTOMER', email.trim(), 'LOGIN');

    return res.status(200).json({
      message: 'OTP sent to your registered email.',
      entity_id: customer.customer_id,
      entity_type: 'CUSTOMER',
      _dev_note: 'Check OTP_Tokens table for otp_code (testing only — remove in prod)',
    });

  } catch (err) {
    console.error('[customerLogin]', err);
    return res.status(500).json({ error: err.message });
  }
};


// ================================================================
//  4. VERIFY OTP  —  ALL ROLES
//     POST /api/auth/verify-otp
//     Body: { entity_id, entity_type, otp_code }
//
//     entity_type: 'STAFF' | 'ADMIN' | 'CUSTOMER'
//
//     On success:
//       • Marks OTP as used
//       • Updates last_login
//       • Returns signed JWT
// ================================================================
const verifyOTP = async (req, res) => {
  const { entity_id, entity_type, otp_code } = req.body;

  if (!entity_id || !entity_type || !otp_code)
    return res.status(400).json({ message: 'entity_id, entity_type, and otp_code are required.' });

  const entityTypeUpper = entity_type.toUpperCase();
  const validTypes = ['STAFF', 'ADMIN', 'CUSTOMER'];

  if (!validTypes.includes(entityTypeUpper))
    return res.status(400).json({ message: `entity_type must be one of: ${validTypes.join(', ')}.` });

  try {
    const pool = await getPool();
    const nowUTC = new Date();

    // Look up valid OTP
    const otpResult = await pool.request()
      .input('entity_id', sql.Int, entity_id)
      .input('entity_type', sql.NVarChar, entityTypeUpper)
      .input('otp_code', sql.NVarChar, otp_code.trim())
      .input('purpose', sql.NVarChar, 'LOGIN')
      .input('now', sql.DateTime, nowUTC)
      .query(`
        SELECT otp_id
        FROM   OTP_Tokens
        WHERE  entity_id   = @entity_id
          AND  entity_type = @entity_type
          AND  otp_code    = @otp_code
          AND  purpose     = @purpose
          AND  is_used     = 0
          AND  expires_at  > @now
      `);

    if (otpResult.recordset.length === 0)
      return res.status(400).json({ message: 'Invalid or expired OTP.' });

    const otpId = otpResult.recordset[0].otp_id;

    // Mark OTP used
    await pool.request()
      .input('otp_id', sql.Int, otpId)
      .query(`UPDATE OTP_Tokens SET is_used = 1 WHERE otp_id = @otp_id`);

    // Build JWT payload + update last_login
    let tokenPayload;

    if (entityTypeUpper === 'CUSTOMER') {
      // Update Customer_Auth.last_login
      await pool.request()
        .input('customer_id', sql.Int, entity_id)
        .input('now', sql.DateTime, nowUTC)
        .query(`
          UPDATE Customer_Auth
          SET    last_login = @now
          WHERE  customer_id = @customer_id
        `);

      tokenPayload = { customerId: entity_id, role: 'CUSTOMER' };

    } else {
      // STAFF or ADMIN — verify once more that account is still ACTIVE
      const userResult = await pool.request()
        .input('user_id', sql.Int, entity_id)
        .query(`SELECT role, status FROM Users WHERE user_id = @user_id`);

      const user = userResult.recordset[0];
      if (!user || user.status !== 'ACTIVE')
        return res.status(403).json({ message: 'Account is no longer active.' });

      // Update Users.last_login
      await pool.request()
        .input('user_id', sql.Int, entity_id)
        .input('now', sql.DateTime, nowUTC)
        .query(`UPDATE Users SET last_login = @now WHERE user_id = @user_id`);

      tokenPayload = { userId: entity_id, role: user.role }; // role = 'STAFF' | 'ADMIN'
    }

    const token = signToken(tokenPayload);

    return res.status(200).json({
      message: 'Login successful.',
      token,
      role: tokenPayload.role,
    });

  } catch (err) {
    console.error('[verifyOTP]', err);
    return res.status(500).json({ error: err.message });
  }
};


// ================================================================
//  5. RESEND OTP
//     POST /api/auth/resend-otp
//     Body: { entity_id, entity_type }
//
//     Re-generates and re-sends a LOGIN OTP.
//     createAndSendOTP already invalidates previous unused ones.
// ================================================================
const resendOTP = async (req, res) => {
  const { entity_id, entity_type } = req.body;

  if (!entity_id || !entity_type)
    return res.status(400).json({ message: 'entity_id and entity_type are required.' });

  const entityTypeUpper = entity_type.toUpperCase();
  const validTypes = ['STAFF', 'ADMIN', 'CUSTOMER'];

  if (!validTypes.includes(entityTypeUpper))
    return res.status(400).json({ message: `entity_type must be one of: ${validTypes.join(', ')}.` });

  try {
    const pool = await getPool();

    // Fetch email from correct table
    let email = null;

    if (entityTypeUpper === 'CUSTOMER') {
      const r = await pool.request()
        .input('customer_id', sql.Int, entity_id)
        .query(`SELECT email, status FROM Customers WHERE customer_id = @customer_id`);

      if (!r.recordset[0]) return res.status(404).json({ message: 'Customer not found.' });
      if (r.recordset[0].status !== 'ACTIVE')
        return res.status(403).json({ message: 'Account is not active.' });

      email = r.recordset[0].email;

    } else {
      const r = await pool.request()
        .input('user_id', sql.Int, entity_id)
        .query(`SELECT email, status FROM Users WHERE user_id = @user_id`);

      if (!r.recordset[0]) return res.status(404).json({ message: 'User not found.' });
      if (r.recordset[0].status !== 'ACTIVE')
        return res.status(403).json({ message: 'Account is not active.' });

      email = r.recordset[0].email;
    }

    await createAndSendOTP(entity_id, entityTypeUpper, email, 'LOGIN');

    return res.status(200).json({
      message: 'A new OTP has been sent to your registered email.',
      _dev_note: 'Check OTP_Tokens table for otp_code (testing only — remove in prod)',
    });

  } catch (err) {
    console.error('[resendOTP]', err);
    return res.status(500).json({ error: err.message });
  }
};


module.exports = {
  register,
  login,
  registerCustomer,
  customerLogin,
  verifyOTP,
  resendOTP,
};