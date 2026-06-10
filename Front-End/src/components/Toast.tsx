import { useEffect, useState } from "react";
import { CheckCircle, XCircle, AlertCircle, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastMessage {
    id: number;
    type: ToastType;
    message: string;
}

interface ToastProps {
    toasts: ToastMessage[];
    removeToast: (id: number) => void;
}

export function Toast({ toasts, removeToast }: ToastProps) {
    return (
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
            ))}
        </div>
    );
}

function ToastItem({ toast, onRemove }: { toast: ToastMessage; onRemove: () => void }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Animate in
        requestAnimationFrame(() => setVisible(true));
        // Auto-dismiss after 4s
        const timer = setTimeout(() => {
            setVisible(false);
            setTimeout(onRemove, 300);
        }, 4000);
        return () => clearTimeout(timer);
    }, []);

    const styles = {
        success: { bg: "bg-green-50 border-green-200", text: "text-green-800", icon: <CheckCircle className="w-5 h-5 text-green-500 shrink-0" /> },
        error: { bg: "bg-red-50 border-red-200", text: "text-red-800", icon: <XCircle className="w-5 h-5 text-red-500 shrink-0" /> },
        info: { bg: "bg-blue-50 border-blue-200", text: "text-blue-800", icon: <AlertCircle className="w-5 h-5 text-blue-500 shrink-0" /> },
    }[toast.type];

    return (
        <div className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg transition-all duration-300 ${styles.bg} ${visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}`}>
            {styles.icon}
            <p className={`text-sm font-medium flex-1 ${styles.text}`}>{toast.message}</p>
            <button onClick={() => { setVisible(false); setTimeout(onRemove, 300); }}
                className="text-gray-400 hover:text-gray-600 transition">
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}

// ── Hook ─────────────────────────────────────────────────────────
let _id = 0;
export function useToast() {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const addToast = (type: ToastType, message: string) => {
        const id = ++_id;
        setToasts(prev => [...prev, { id, type, message }]);
    };

    const removeToast = (id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const toast = {
        success: (msg: string) => addToast("success", msg),
        error: (msg: string) => addToast("error", msg),
        info: (msg: string) => addToast("info", msg),
    };

    return { toasts, removeToast, toast };
}