const express = require('express');
const router = express.Router();
const { 
  getMyProfile, 
  updateProfile, 
  changePassword 
} = require('../controllers/userController');


const { verifyToken } = require('../middlewares/authMiddleware');

// Profile routes
router.get('/profile', verifyToken, getMyProfile);
router.put('/profile', verifyToken, updateProfile);
router.put('/change-password', verifyToken, changePassword);

module.exports = router;