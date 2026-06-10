const express = require('express');
const router = express.Router();

const {
    register,
    login,
    registerCustomer,
    customerLogin,
    verifyOTP,
    resendOTP,
} = require('../controllers/authController');

// ─────────────────────────────────────────────
//  STAFF
// ─────────────────────────────────────────────
// POST /api/auth/register       → self-register (status=PENDING, role=STAFF)
router.post('/register', register);

// POST /api/auth/login          → password check → send OTP
router.post('/login', login);

// ─────────────────────────────────────────────
//  CUSTOMER
// ─────────────────────────────────────────────
// POST /api/auth/customer/register  → self-register (status=PENDING)
router.post('/customer/register', registerCustomer);

// POST /api/auth/customer/login     → password check → send OTP
router.post('/customer/login', customerLogin);

// ─────────────────────────────────────────────
//  SHARED  (all roles)
// ─────────────────────────────────────────────
// POST /api/auth/verify-otp     → validate OTP → return JWT
router.post('/verify-otp', verifyOTP);

// POST /api/auth/resend-otp     → invalidate old OTP → send new one
router.post('/resend-otp', resendOTP);

module.exports = router;