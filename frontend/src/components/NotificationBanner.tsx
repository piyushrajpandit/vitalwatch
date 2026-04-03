import { AlertTriangle, X } from "lucide-react";
import { useEffect } from "react";

export function NotificationBanner({ alert, onClose }: { alert: { message: string, title?: string } | null; onClose: () => void }) {
    useEffect(() => {
        if (alert) {
            const timer = setTimeout(onClose, 5000);
            return () => clearTimeout(timer);
        }
    }, [alert, onClose]);

    if (!alert) return null;

    return (
        <div className="w-full bg-[#dc2626] text-white p-4 rounded-2xl shadow-[0_20px_50px_rgba(220,38,38,0.3)] border border-white/20 animate-slide-right pointer-events-auto">
            <div className="flex items-start gap-4">
                <div className="bg-white/20 p-2 rounded-xl shrink-0">
                    <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-black text-sm uppercase tracking-wider mb-1">{alert.title || "CRITICAL ALERT"}</h4>
                    <p className="text-white/90 font-bold text-sm leading-tight">{alert.message}</p>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors shrink-0">
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
