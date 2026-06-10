const express = require('express');
const router = express.Router();

const {
  getMyProfile,
  updateProfile,
  changePassword,
} = require('../controllers/userController');

const { verifyToken } = require('../middlewares/authMiddleware');

// All routes require a valid token — works for CUSTOMER, STAFF, ADMIN
router.get('/profile', verifyToken, getMyProfile);
router.put('/profile', verifyToken, updateProfile);
router.put('/change-password', verifyToken, changePassword);

module.exports = router;