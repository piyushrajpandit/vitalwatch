import React from 'react';
import { AlertCircle, ShieldAlert, History as HistoryIcon, Bell, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Alert {
    id: number;
    timestamp: string;
    status: "warning" | "critical";
    message: string;
    value: number | null;
}

export function AlertFeed({ alerts }: { alerts: Alert[] }) {
    return (
        <div className="glass-dark border border-slate-800/50 rounded-[2.5rem] p-8 h-full flex flex-col transition-all duration-500 hover:border-slate-700/50 relative overflow-hidden">
            {/* Background Decorative Element */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-slate-800/20 blur-[60px] rounded-full" />

            <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center shadow-lg">
                        <HistoryIcon className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white tracking-tight leading-none mb-1">Alert History</h3>
                        <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest flex items-center gap-2">
                            <Bell className="w-3 h-3" />
                            {alerts.length} Recent Events
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-4 space-y-4 custom-scrollbar relative z-10">
                {alerts.length > 0 ? (
                    alerts.map((alert, idx) => (
                        <div
                            key={alert.id}
                            className={cn(
                                "group p-5 rounded-2xl border transition-all duration-500 hover:scale-[1.02]",
                                alert.status === "critical"
                                    ? "bg-red-500/10 border-red-500/20 shadow-[0_4px_20px_rgba(239,68,68,0.1)]"
                                    : "bg-white/5 border-white/5 hover:bg-white/10"
                            )}
                            style={{ animationDelay: `${idx * 100}ms` }}
                        >
                            <div className="flex items-start gap-4">
                                <div className={cn(
                                    "p-2.5 rounded-xl transition-colors shrink-0",
                                    alert.status === "critical" ? "bg-red-500 text-white shadow-lg" : "bg-slate-800 text-slate-400 group-hover:bg-amber-500/20 group-hover:text-amber-500"
                                )}>
                                    {alert.status === "critical" ? <ShieldAlert className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={cn(
                                            "text-[10px] font-black uppercase tracking-[0.2em]",
                                            alert.status === "critical" ? "text-red-400" : "text-amber-400"
                                        )}>
                                            {alert.status} Event
                                        </span>
                                        <div className="flex items-center gap-1 text-slate-500 text-[10px] font-bold bg-black/20 px-2 py-0.5 rounded-md border border-white/5">
                                            <Clock className="w-3 h-3" />
                                            {new Date(alert.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                    <p className="text-white font-bold text-sm tracking-tight leading-snug">
                                        {alert.message}
                                    </p>
                                    {alert.value && (
                                        <div className="mt-3 flex items-center gap-2">
                                            <div className="h-1 flex-1 bg-black/20 rounded-full overflow-hidden">
                                                <div
                                                    className={cn("h-full", alert.status === 'critical' ? 'bg-red-500' : 'bg-amber-500')}
                                                    style={{ width: `${Math.min((alert.value / 200) * 100, 100)}%` }}
                                                />
                                            </div>
                                            <span className="text-[10px] font-mono text-slate-500 font-black">{alert.value} BPM</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center h-48 text-center px-4">
                        <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 opacity-50">
                            <HistoryIcon className="w-8 h-8 text-slate-700" />
                        </div>
                        <p className="text-slate-600 font-bold text-xs uppercase tracking-widest italic">
                            System Clear • No recent anomalies detected
                        </p>
                    </div>
                )}
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.1);
                }
            `}</style>
        </div>
    );
}
