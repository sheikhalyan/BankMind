const SupportTicketModel = require('../models/Supportticketmodel');
const TicketReplyModel = require('../models/Ticketreplymodel');
const CustomerModel = require('../models/Customermodel');
const {
    notifyAdmins,
    notifyCustomer,
    notifyUser, // auto-detects STAFF vs ADMIN — used for assigned_to, since it can be either
} = require('../utils/notifications');

// ----------------------------------------------------------------
// CUSTOMER
// ----------------------------------------------------------------

/**
 * POST /api/support/tickets
 * Body: { subject, description, category?, priority? }
 * Customer creates a new ticket.
 */
const createTicket = async (req, res) => {
    const customer_id = req.user.customerId;
    const { subject, description, category, priority } = req.body;

    if (!subject?.trim() || !description?.trim()) {
        return res.status(400).json({ message: 'Subject and description are required.' });
    }

    try {
        const ticket_id = await SupportTicketModel.create({ customer_id, subject, description, category, priority });

        const customer = await CustomerModel.findById(customer_id);
        await notifyAdmins({
            type: 'NEW_TICKET',
            message: `New support ticket from ${customer?.full_name || 'a customer'}: "${subject}"`,
            related_id: ticket_id,
            related_type: 'TICKET',
        });

        return res.status(201).json({ message: 'Ticket submitted.', ticket_id });
    } catch (err) {
        console.error('[createTicket]', err);
        return res.status(500).json({ error: err.message });
    }
};

/**
 * GET /api/support/tickets/mine
 * Customer's own tickets (optional ?status=)
 */
const getMyTickets = async (req, res) => {
    const customer_id = req.user.customerId;
    const { status } = req.query;
    try {
        const tickets = await SupportTicketModel.getByCustomer(customer_id, { status });
        return res.json(tickets);
    } catch (err) {
        console.error('[getMyTickets]', err);
        return res.status(500).json({ error: err.message });
    }
};

// ----------------------------------------------------------------
// SHARED (customer who owns it, or staff/admin)
// ----------------------------------------------------------------

/**
 * GET /api/support/tickets/:ticketId
 * Full ticket + its replies. Customers may only view their own.
 */
const getTicketById = async (req, res) => {
    const { ticketId } = req.params;
    const role = req.user.role?.toUpperCase();

    try {
        const ticket = await SupportTicketModel.findById(ticketId);
        if (!ticket) return res.status(404).json({ message: 'Ticket not found.' });

        if (role === 'CUSTOMER' && ticket.customer_id !== req.user.customerId) {
            return res.status(403).json({ message: 'Unauthorized.' });
        }

        const replies = await TicketReplyModel.getByTicket(ticketId);
        return res.json({ ...ticket, replies });
    } catch (err) {
        console.error('[getTicketById]', err);
        return res.status(500).json({ error: err.message });
    }
};

/**
 * POST /api/support/tickets/:ticketId/reply
 * Body: { message }
 * Any party on the ticket (owning customer, or any staff/admin) can reply.
 */
const addReply = async (req, res) => {
    const { ticketId } = req.params;
    const { message } = req.body;
    const role = req.user.role?.toUpperCase();

    if (!message?.trim()) return res.status(400).json({ message: 'Message is required.' });

    try {
        const ticket = await SupportTicketModel.findById(ticketId);
        if (!ticket) return res.status(404).json({ message: 'Ticket not found.' });

        if (role === 'CUSTOMER' && ticket.customer_id !== req.user.customerId) {
            return res.status(403).json({ message: 'Unauthorized.' });
        }

        const sender_id = role === 'CUSTOMER' ? req.user.customerId : req.user.userId;
        const reply_id = await TicketReplyModel.create({ ticket_id: ticketId, sender_id, sender_type: role, message });

        // Notify the other side of the conversation
        if (role === 'CUSTOMER') {
            if (ticket.assigned_to) {
                await notifyUser({
                    user_id: ticket.assigned_to,
                    type: 'TICKET_REPLY',
                    message: `New reply on ticket #${ticketId}: "${ticket.subject}"`,
                    related_id: ticketId,
                    related_type: 'TICKET',
                });
            } else {
                await notifyAdmins({
                    type: 'TICKET_REPLY',
                    message: `New reply on unassigned ticket #${ticketId}: "${ticket.subject}"`,
                    related_id: ticketId,
                    related_type: 'TICKET',
                });
            }
        } else {
            await notifyCustomer({
                customer_id: ticket.customer_id,
                type: 'TICKET_REPLY',
                message: `Support replied to your ticket: "${ticket.subject}"`,
                related_id: ticketId,
                related_type: 'TICKET',
            });
        }

        // If a customer replies to a resolved ticket, reopen it — silence isn't consent
        if (role === 'CUSTOMER' && ticket.status === 'RESOLVED') {
            await SupportTicketModel.updateStatus(ticketId, 'IN_PROGRESS');
        }

        return res.status(201).json({ message: 'Reply added.', reply_id });
    } catch (err) {
        console.error('[addReply]', err);
        return res.status(500).json({ error: err.message });
    }
};

// ----------------------------------------------------------------
// STAFF / ADMIN
// ----------------------------------------------------------------

/**
 * GET /api/support/tickets
 * Query: ?status=&category=&assigned_to=
 * Admin: sees everything, can filter by anything (e.g. assigned_to=<staffId> to check someone's queue).
 * Staff: frontend should pass assigned_to=<own userId> for "My Tickets"; passing none returns all
 * (kept unrestricted here since assignment, not visibility, is the access boundary your team uses
 * elsewhere — tighten to auto-scope by req.user.userId if you'd rather staff never see unassigned ones).
 */
const getAllTickets = async (req, res) => {
    const { status, category, assigned_to } = req.query;
    try {
        const tickets = await SupportTicketModel.getAll({
            status,
            category,
            assigned_to: assigned_to ? Number(assigned_to) : undefined,
        });
        return res.json(tickets);
    } catch (err) {
        console.error('[getAllTickets]', err);
        return res.status(500).json({ error: err.message });
    }
};

/**
 * PUT /api/support/tickets/:ticketId/assign
 * Body: { assigned_to } — a Users.user_id (staff or admin)
 */
const assignTicket = async (req, res) => {
    const { ticketId } = req.params;
    const { assigned_to } = req.body;

    if (!assigned_to) return res.status(400).json({ message: 'assigned_to is required.' });

    try {
        const ticket = await SupportTicketModel.findById(ticketId);
        if (!ticket) return res.status(404).json({ message: 'Ticket not found.' });

        await SupportTicketModel.assign(ticketId, assigned_to);

        await notifyUser({
            user_id: assigned_to,
            type: 'TICKET_ASSIGNED',
            message: `You've been assigned ticket #${ticketId}: "${ticket.subject}"`,
            related_id: ticketId,
            related_type: 'TICKET',
        });

        return res.json({ message: 'Ticket assigned.' });
    } catch (err) {
        console.error('[assignTicket]', err);
        return res.status(500).json({ error: err.message });
    }
};

/**
 * PUT /api/support/tickets/:ticketId/status
 * Body: { status } — e.g. 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
 */
const updateTicketStatus = async (req, res) => {
    const { ticketId } = req.params;
    const { status } = req.body;

    const allowed = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
    if (!allowed.includes(status)) {
        return res.status(400).json({ message: `status must be one of: ${allowed.join(', ')}` });
    }

    try {
        const ticket = await SupportTicketModel.findById(ticketId);
        if (!ticket) return res.status(404).json({ message: 'Ticket not found.' });

        await SupportTicketModel.updateStatus(ticketId, status);

        if (status === 'RESOLVED') {
            await notifyCustomer({
                customer_id: ticket.customer_id,
                type: 'TICKET_RESOLVED',
                message: `Your ticket "${ticket.subject}" has been marked resolved.`,
                related_id: ticketId,
                related_type: 'TICKET',
            });
        }

        return res.json({ message: 'Status updated.' });
    } catch (err) {
        console.error('[updateTicketStatus]', err);
        return res.status(500).json({ error: err.message });
    }
};

module.exports = {
    // Customer
    createTicket,
    getMyTickets,
    // Shared
    getTicketById,
    addReply,
    // Staff/Admin
    getAllTickets,
    assignTicket,
    updateTicketStatus,
};