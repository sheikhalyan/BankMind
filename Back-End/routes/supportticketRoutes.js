const express = require('express');
const router = express.Router();

const {
    createTicket,
    getMyTickets,
    getTicketById,
    addReply,
    getAllTickets,
    assignTicket,
    updateTicketStatus,
} = require('../controllers/supportticketController');

const { verifyToken, isCustomer, isStaffOrAdmin, isAdmin } = require('../middlewares/authMiddleware');

// ----------------------------------------------------------------
// CUSTOMER
// ----------------------------------------------------------------
router.post('/tickets', verifyToken, isCustomer, createTicket);
router.get('/tickets/mine', verifyToken, isCustomer, getMyTickets);

// ----------------------------------------------------------------
// SHARED (ticket ownership is checked inside the controller)
// ----------------------------------------------------------------
router.get('/tickets/:ticketId', verifyToken, getTicketById);
router.post('/tickets/:ticketId/reply', verifyToken, addReply);

// ----------------------------------------------------------------
// STAFF / ADMIN
// ----------------------------------------------------------------
router.get('/tickets', verifyToken, isStaffOrAdmin, getAllTickets);
router.put('/tickets/:ticketId/assign', verifyToken, isAdmin, assignTicket);
router.put('/tickets/:ticketId/status', verifyToken, isStaffOrAdmin, updateTicketStatus);

module.exports = router;