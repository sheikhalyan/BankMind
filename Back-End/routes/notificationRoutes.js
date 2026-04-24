const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
} = require('../controllers/notificationController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, getNotifications);
router.put('/:notificationId/read', verifyToken, markAsRead);
router.put('/read-all', verifyToken, markAllAsRead);
router.delete('/:notificationId', verifyToken, deleteNotification);

module.exports = router;