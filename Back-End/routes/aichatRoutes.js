const express = require('express');
const router = express.Router();
const { verifyToken, isCustomer } = require('../middlewares/authMiddleware');
const {
    getSessions,
    getSessionMessages,
    sendMessage,
} = require('../controllers/aichatController');

router.use(verifyToken, isCustomer);

router.get('/sessions', getSessions);
router.get('/sessions/:sessionId/messages', getSessionMessages);
router.post('/message', sendMessage);

module.exports = router;