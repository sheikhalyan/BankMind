import { api } from "./api";

export const chatService = {

    /** Session list, most recent first — GET /api/chat/sessions */
    getSessions: async () => {
        try {
            return await api.get("/chat/sessions");
        } catch (error) {
            console.error("Error fetching chat sessions:", error);
            throw error;
        }
    },

    /** Full message thread for a session — GET /api/chat/sessions/:sessionId/messages */
    getMessages: async (sessionId: number) => {
        try {
            return await api.get(`/chat/sessions/${sessionId}/messages`);
        } catch (error) {
            console.error("Error fetching chat messages:", error);
            throw error;
        }
    },

    /** Send a message — omit sessionId to start a new conversation — POST /api/chat/message */
    sendMessage: async (message: string, sessionId?: number) => {
        try {
            return await api.post("/chat/message", sessionId ? { session_id: sessionId, message } : { message });
        } catch (error) {
            console.error("Error sending chat message:", error);
            throw error;
        }
    },
};