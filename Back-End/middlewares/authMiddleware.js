const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { userId, role }
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

const isAdmin = (req, res, next) => {
  const role = req.user.role.toLowerCase();

  if (role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admins only.' });
  }
  next();
};

const isUser = (req, res, next) => {
  const role = req.user.role.toLowerCase();

  if (role !== 'user') {
    return res.status(403).json({ message: 'Users only' });
  }
  next();
};

const isCustomer = (req, res, next) => {
  const role = req.user.role.toLowerCase();

  if (role !== 'customer') {
    return res.status(403).json({ message: 'Customers only' });
  }
  next();
};

module.exports = { verifyToken, isAdmin, isUser, isCustomer };

