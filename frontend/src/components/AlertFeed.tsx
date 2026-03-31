import { AlertCircle, Activity, Info, Clock } from "lucide-react";

interface Alert {
    id: number;
    timestamp: string;
    status: "warning" | "critical";
    message: string;
    value: number;
}

interface AlertFeedProps {
    alerts: Alert[];
}

export function AlertFeed({ alerts }: AlertFeedProps) {
    return (
        <div className="bg-clinical-card border border-clinical-border rounded-2xl p-6 h-full flex flex-col shadow-xl">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                        <Activity className="w-5 h-5 text-clinical-normal" />
                    </div>
                    <h3 className="text-xl font-bold text-white tracking-tight">Alert Feed</h3>
                </div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-800 px-3 py-1 rounded-full">{alerts.length} Events</span>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                {alerts.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4 min-h-[400px]">
                        <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center">
                            <Info className="w-8 h-8 opacity-50 text-clinical-normal" />
                        </div>
                        <p className="font-medium text-lg text-white">No anomalies detected</p>
                        <p className="text-sm opacity-60 text-center max-w-[200px]">System is monitoring vitals continuously.</p>
                    </div>
                ) : (
                    alerts.map(alert => (
                        <div
                            key={alert.id}
                            className={`p-5 rounded-2xl border animate-slide-down flex items-start gap-4 shadow-lg transition-colors ${alert.status === 'critical' ? 'bg-red-950/40 border-red-500/50 text-red-50' : 'bg-amber-950/40 border-amber-500/50 text-amber-50'
                                }`}
                        >
                            <div className={`mt-1 w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${alert.status === 'critical' ? 'bg-red-500/20' : 'bg-amber-500/20'}`}>
                                <AlertCircle className={`w-6 h-6 ${alert.status === 'critical' ? 'text-red-400' : 'text-amber-400'}`} />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-2">
                                    <span className={`px-2.5 py-1 text-xs font-black uppercase tracking-wider rounded-md ${alert.status === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                        {alert.status}
                                    </span>
                                    <div className="flex items-center gap-1.5 text-xs opacity-70 font-medium font-mono">
                                        <Clock className="w-3 h-3" />
                                        {new Date(alert.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </div>
                                </div>
                                <div className="flex items-end gap-2 mb-1">
                                    <span className="text-2xl font-bold tabular-nums tracking-tight">
                                        {alert.value.toFixed(0)}
                                    </span>
                                    <span className="text-sm font-bold opacity-70 pb-0.5">BPM</span>
                                </div>
                                <p className="text-sm font-medium opacity-90 leading-snug">{alert.message}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
