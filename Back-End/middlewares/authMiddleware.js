const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user.role.toUpperCase() !== 'ADMIN') {
    return res.status(403).json({ message: 'Access denied. Admins only.' });
  }
  next();
};

const isStaff = (req, res, next) => {
  if (req.user.role.toUpperCase() !== 'STAFF') {
    return res.status(403).json({ message: 'Access denied. Staff only.' });
  }
  next();
};

const isStaffOrAdmin = (req, res, next) => {
  const role = req.user.role.toUpperCase();
  if (role !== 'STAFF' && role !== 'ADMIN') {
    return res.status(403).json({ message: 'Access denied.' });
  }
  next();
};

const isCustomer = (req, res, next) => {
  if (req.user.role.toUpperCase() !== 'CUSTOMER') {
    return res.status(403).json({ message: 'Customers only.' });
  }
  next();
};

module.exports = { verifyToken, isAdmin, isStaff, isStaffOrAdmin, isCustomer };