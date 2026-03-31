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
        <div className="fixed top-0 left-0 right-0 z-50 bg-clinical-critical text-white px-6 py-5 shadow-2xl flex items-center justify-between animate-slide-down border-b-4 border-red-800">
            <div className="flex items-center gap-6 max-w-[1600px] mx-auto w-full">
                <div className="bg-white/20 p-3 rounded-full shadow-inner animate-pulse">
                    <AlertTriangle className="w-8 h-8" />
                </div>
                <div className="flex-1">
                    <h4 className="font-extrabold text-2xl tracking-wide mb-1 shadow-sm">{alert.title || "CRITICAL HEALTH ALERT"}</h4>
                    <p className="text-red-50 font-semibold text-xl tracking-tight leading-snug">{alert.message}</p>
                </div>
                <button onClick={onClose} className="p-3 bg-red-800 hover:bg-white/20 rounded-full transition-colors border border-red-500 shadow-md">
                    <X className="w-8 h-8" />
                </button>
            </div>
        </div>
    );
}
