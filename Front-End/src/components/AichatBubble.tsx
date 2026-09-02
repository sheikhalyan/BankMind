import { useState, useEffect, useRef } from "react";
import { Sparkles, X, Send, Plus, History, ArrowLeft } from "lucide-react";
import { chatService } from "../services/chat";

interface ChatSession {
    session_id: number;
    title: string | null;
    started_at: string;
    last_message_at: string | null;
}

interface ChatMessage {
    message_id: number;
    role: "user" | "assistant";
    content: string;
    created_at: string;
}

const formatTime = (d: string | null) => {
    if (!d) return "";
    try {
        return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
        return "";
    }
};

export default function AiChatBubble() {
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState<"chat" | "history">("chat");
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [sessionId, setSessionId] = useState<number | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, [messages, sending]);

    const openWidget = () => {
        setIsOpen(true);
        if (!sessionId) fetchSessions();
    };

    const fetchSessions = async () => {
        setLoadingHistory(true);
        try {
            const res = await chatService.getSessions();
            setSessions(Array.isArray(res) ? res : (res as any).sessions || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingHistory(false);
        }
    };

    const openSession = async (id: number) => {
        setView("chat");
        setSessionId(id);
        setMessages([]);
        try {
            const res = await chatService.getMessages(id);
            const list = Array.isArray(res) ? res : (res as any).messages || [];
            setMessages(list);
        } catch (e) {
            console.error(e);
        }
    };

    const startNewChat = () => {
        setSessionId(null);
        setMessages([]);
        setView("chat");
    };

    const handleSend = async () => {
        const text = input.trim();
        if (!text || sending) return;

        const optimisticUserMsg: ChatMessage = {
            message_id: Date.now(),
            role: "user",
            content: text,
            created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, optimisticUserMsg]);
        setInput("");
        setSending(true);

        try {
            const res: any = await chatService.sendMessage(text, sessionId || undefined);
            if (!sessionId) setSessionId(res.session_id);
            setMessages(prev => [
                ...prev,
                {
                    message_id: Date.now() + 1,
                    role: "assistant",
                    content: res.reply,
                    created_at: new Date().toISOString(),
                },
            ]);
            // Refresh the session list in the background so a new/renamed session shows up next time History is opened
            fetchSessions();
        } catch (e) {
            setMessages(prev => [
                ...prev,
                {
                    message_id: Date.now() + 1,
                    role: "assistant",
                    content: "Sorry, something went wrong sending that. Please try again.",
                    created_at: new Date().toISOString(),
                },
            ]);
        } finally {
            setSending(false);
        }
    };

    return (
        <>
            {/* Floating button */}
            {!isOpen && (
                <button
                    onClick={openWidget}
                    className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-xl flex items-center justify-center transition hover:scale-105"
                    aria-label="Open AI Assistant"
                >
                    <Sparkles className="w-6 h-6" />
                </button>
            )}

            {/* Panel */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 z-40 w-[380px] h-[560px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">

                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white">
                        <div className="flex items-center gap-2">
                            {view === "history" ? (
                                <button onClick={() => setView("chat")} className="p-1 hover:bg-blue-500 rounded-lg transition">
                                    <ArrowLeft className="w-4 h-4" />
                                </button>
                            ) : (
                                <Sparkles className="w-4 h-4" />
                            )}
                            <span className="font-semibold text-sm">{view === "history" ? "Past Conversations" : "AI Assistant"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            {view === "chat" && (
                                <>
                                    <button onClick={startNewChat} title="New chat" className="p-1.5 hover:bg-blue-500 rounded-lg transition">
                                        <Plus className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => { setView("history"); fetchSessions(); }}
                                        title="History"
                                        className="p-1.5 hover:bg-blue-500 rounded-lg transition"
                                    >
                                        <History className="w-4 h-4" />
                                    </button>
                                </>
                            )}
                            <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-blue-500 rounded-lg transition">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* History view */}
                    {view === "history" && (
                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {loadingHistory ? (
                                <p className="text-center text-sm text-gray-400 mt-8">Loading…</p>
                            ) : sessions.length === 0 ? (
                                <p className="text-center text-sm text-gray-400 mt-8">No past conversations yet.</p>
                            ) : (
                                sessions.map(s => (
                                    <button
                                        key={s.session_id}
                                        onClick={() => openSession(s.session_id)}
                                        className={`w-full text-left p-3 rounded-xl border transition hover:bg-blue-50 hover:border-blue-200 ${s.session_id === sessionId ? "border-blue-300 bg-blue-50" : "border-gray-200"
                                            }`}
                                    >
                                        <p className="text-sm font-medium text-gray-800 truncate">{s.title || "New Conversation"}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{formatTime(s.last_message_at || s.started_at)}</p>
                                    </button>
                                ))
                            )}
                        </div>
                    )}

                    {/* Chat view */}
                    {view === "chat" && (
                        <>
                            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                                {messages.length === 0 && (
                                    <div className="text-center mt-10">
                                        <Sparkles className="w-8 h-8 text-blue-300 mx-auto mb-2" />
                                        <p className="text-sm text-gray-500">Ask me about your accounts, loans, or recent transactions.</p>
                                    </div>
                                )}
                                {messages.map(m => (
                                    <div key={m.message_id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                                        <div
                                            className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap ${m.role === "user"
                                                    ? "bg-blue-600 text-white rounded-br-sm"
                                                    : "bg-white text-gray-800 border border-gray-200 rounded-bl-sm"
                                                }`}
                                        >
                                            {m.content}
                                        </div>
                                    </div>
                                ))}
                                {sending && (
                                    <div className="flex justify-start">
                                        <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-3 py-2 flex gap-1">
                                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Input */}
                            <div className="p-3 border-t border-gray-200 flex items-center gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                                    placeholder="Ask about your account…"
                                    disabled={sending}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={sending || !input.trim()}
                                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 transition"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </>
    );
}