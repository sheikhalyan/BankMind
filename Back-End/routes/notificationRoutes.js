const express = require('express');
const router = express.Router();

const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require('../controllers/notificationController');

const { verifyToken } = require('../middlewares/authMiddleware');

// All notification routes require a valid token — works for all roles

// GET  /api/notifications              — get my notifications (?unread_only=true)
router.get('/', verifyToken, getNotifications);

// GET  /api/notifications/count        — get unread count (for navbar badge)
router.get('/count', verifyToken, getUnreadCount);

// PUT  /api/notifications/read-all     — mark all as read
// ⚠️  Must be BEFORE /:notificationId routes to avoid Express matching 'read-all' as an ID
router.put('/read-all', verifyToken, markAllAsRead);

// PUT  /api/notifications/:notificationId/read
router.put('/:notificationId/read', verifyToken, markAsRead);

// DELETE /api/notifications/:notificationId
router.delete('/:notificationId', verifyToken, deleteNotification);

module.exports = router;