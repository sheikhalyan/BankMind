import { api } from "./api";

export const supportService = {

    // ----------------------------------------------------------------
    // CUSTOMER
    // ----------------------------------------------------------------

    /** Customer creates a new ticket — POST /api/support/tickets */
    create: async (data: { subject: string; description: string; category?: string; priority?: string }) => {
        try {
            return await api.post("/support/tickets", data);
        } catch (error) {
            console.error("Error creating ticket:", error);
            throw error;
        }
    },

    /** Customer's own tickets — GET /api/support/tickets/mine */
    getMine: async (status?: string) => {
        try {
            return await api.get("/support/tickets/mine", status ? { status } : undefined);
        } catch (error) {
            console.error("Error fetching my tickets:", error);
            throw error;
        }
    },

    // ----------------------------------------------------------------
    // SHARED (customer who owns it, or staff/admin)
    // ----------------------------------------------------------------

    /** Full ticket + replies — GET /api/support/tickets/:ticketId */
    getById: async (ticketId: number) => {
        try {
            return await api.get(`/support/tickets/${ticketId}`);
        } catch (error) {
            console.error("Error fetching ticket:", error);
            throw error;
        }
    },

    /** Add a reply — POST /api/support/tickets/:ticketId/reply */
    reply: async (ticketId: number, message: string) => {
        try {
            return await api.post(`/support/tickets/${ticketId}/reply`, { message });
        } catch (error) {
            console.error("Error replying to ticket:", error);
            throw error;
        }
    },

    // ----------------------------------------------------------------
    // STAFF / ADMIN
    // ----------------------------------------------------------------

    /** All tickets — Admin: everything | Staff: pass assigned_to for "My Tickets" — GET /api/support/tickets */
    getAll: async (params?: { status?: string; category?: string; assigned_to?: number }) => {
        try {
            return await api.get("/support/tickets", params as Record<string, any>);
        } catch (error) {
            console.error("Error fetching tickets:", error);
            throw error;
        }
    },

    /** Assign a ticket to a staff/admin user_id — PUT /api/support/tickets/:ticketId/assign */
    assign: async (ticketId: number, assigned_to: number) => {
        try {
            return await api.put(`/support/tickets/${ticketId}/assign`, { assigned_to });
        } catch (error) {
            console.error("Error assigning ticket:", error);
            throw error;
        }
    },

    /** Update ticket status — PUT /api/support/tickets/:ticketId/status */
    updateStatus: async (ticketId: number, status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED") => {
        try {
            return await api.put(`/support/tickets/${ticketId}/status`, { status });
        } catch (error) {
            console.error("Error updating ticket status:", error);
            throw error;
        }
    },
};