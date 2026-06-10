const { getPool, sql } = require('../config/db');   // ✅ fix 1: poolPromise → getPool
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const generateOTP = () => crypto.randomInt(100000, 999999).toString();

const sendOTPEmail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.OTP_EMAIL,
      pass: process.env.OTP_EMAIL_PASSWORD,
    },
    tls: { rejectUnauthorized: false },
  });

  await transporter.sendMail({
    from: `"BankingAI" <${process.env.OTP_EMAIL}>`,
    to: email,
    subject: 'Your One-Time Password (OTP)',
    text: `Your OTP is ${otp}. It expires in 5 minutes.`,
    html: `
      <h2>BankingAI Login Verification</h2>
      <p>Your OTP is:</p>
      <h1>${otp}</h1>
      <p>This code will expire in <b>5 minutes</b>.</p>
      <p>If you did not request this, please ignore.</p>
    `,
  });
};

/**
 * entityId   → user_id OR customer_id
 * entityType → 'USER' | 'CUSTOMER'
 * purpose    → 'LOGIN' | 'RESET_PASSWORD' | 'ACCOUNT_VERIFICATION'
 */
const createAndSendOTP = async (entityId, entityType, email, purpose = 'LOGIN') => {  // ✅ fix 2: added purpose param
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  const pool = await getPool();  // ✅ fix 1 applied here too

  // Invalidate previous unused OTPs for same entity + purpose only
  await pool.request()
    .input('entity_id', sql.Int, entityId)
    .input('entity_type', sql.NVarChar, entityType)
    .input('purpose', sql.NVarChar, purpose)
    .query(`
      UPDATE OTP_Tokens SET is_used = 1
      WHERE entity_id   = @entity_id
        AND entity_type = @entity_type
        AND purpose     = @purpose       -- ✅ fix 3: scope invalidation to purpose
        AND is_used     = 0
    `);

  await pool.request()
    .input('entity_id', sql.Int, entityId)
    .input('entity_type', sql.NVarChar, entityType)
    .input('otp_code', sql.NVarChar, otp)
    .input('purpose', sql.NVarChar, purpose)   // ✅ fix 2 applied here
    .input('expires_at', sql.DateTime, expiresAt)
    .query(`
      INSERT INTO OTP_Tokens (entity_id, entity_type, otp_code, purpose, expires_at)
      VALUES (@entity_id, @entity_type, @otp_code, @purpose, @expires_at)
    `);

  await sendOTPEmail(email, otp);
};

module.exports = { createAndSendOTP };