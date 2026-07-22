const jwt = require('jsonwebtoken');
const { getPool, sql } = require('../config/db');

// ================================================================
//  verifyToken
//  1. Validates JWT signature
//  2. Checks live status from DB — catches suspension immediately
//     without waiting for token to expire
// ================================================================
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token)
    return res.status(401).json({ message: 'No token provided' });

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  // ── Live status check ────────────────────────────────────────────
  try {
    const pool = await getPool();
    const role = decoded.role?.toUpperCase();

    if (role === 'CUSTOMER') {
      const result = await pool.request()
        .input('customer_id', sql.Int, decoded.customerId)
        .query(`SELECT status FROM Customers WHERE customer_id = @customer_id`);

      const customer = result.recordset[0];

      if (!customer)
        return res.status(401).json({ message: 'Account not found' });

      if (customer.status === 'SUSPENDED')
        return res.status(401).json({ message: 'Your account has been suspended. Please contact support.' });

      // FROZEN is NOT a logout — customer can still log in, just can't transact
      // The transaction controllers already block FROZEN accounts

    } else {
      // STAFF or ADMIN
      const result = await pool.request()
        .input('user_id', sql.Int, decoded.userId)
        .query(`SELECT status FROM Users WHERE user_id = @user_id`);

      const user = result.recordset[0];

      if (!user)
        return res.status(401).json({ message: 'Account not found' });

      if (user.status === 'SUSPENDED')
        return res.status(401).json({ message: 'Your account has been suspended. Please contact the administrator.' });

      if (user.status === 'REJECTED')
        return res.status(401).json({ message: 'Your account has been rejected.' });
    }

  } catch (err) {
    console.error('[verifyToken] DB status check failed:', err.message);
    // Don't block the request if DB check fails — fail open is safer
    // than locking everyone out on a DB hiccup
  }

  req.user = decoded;
  next();
};

// ================================================================
//  Role guards — unchanged
// ================================================================
const isAdmin = (req, res, next) => {
  if (req.user.role.toUpperCase() !== 'ADMIN')
    return res.status(403).json({ message: 'Access denied. Admins only.' });
  next();
};

const isStaff = (req, res, next) => {
  if (req.user.role.toUpperCase() !== 'STAFF')
    return res.status(403).json({ message: 'Access denied. Staff only.' });
  next();
};

const isStaffOrAdmin = (req, res, next) => {
  const role = req.user.role.toUpperCase();
  if (role !== 'STAFF' && role !== 'ADMIN')
    return res.status(403).json({ message: 'Access denied.' });
  next();
};

const isCustomer = (req, res, next) => {
  if (req.user.role.toUpperCase() !== 'CUSTOMER')
    return res.status(403).json({ message: 'Customers only.' });
  next();
};

module.exports = { verifyToken, isAdmin, isStaff, isStaffOrAdmin, isCustomer };