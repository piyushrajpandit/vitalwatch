import { cn } from "@/lib/utils";
import { User, MapPin, Heart, Activity } from "lucide-react";

interface PatientCardProps {
    status: "normal" | "warning" | "critical";
    isFlashing: boolean;
    hr: number;
    spo2: number;
}

export function PatientCard({ status, isFlashing, hr, spo2 }: PatientCardProps) {
    const statusColors = {
        normal: "bg-clinical-normal text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]",
        warning: "bg-clinical-warning text-slate-900 shadow-[0_0_15px_rgba(245,158,11,0.4)]",
        critical: "bg-clinical-critical text-white shadow-[0_0_20px_rgba(239,68,68,0.6)]"
    };

    return (
        <div className={cn(
            "p-6 rounded-2xl bg-clinical-card border-2 transition-colors duration-300 flex flex-col justify-between h-full min-h-[220px]",
            status === "critical" && isFlashing ? "border-clinical-critical" : "border-clinical-border"
        )}>
            <div className="flex items-start justify-between">
                <div className="flex gap-4 items-center">
                    <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center relative overflow-hidden group">
                        <User className="w-8 h-8 text-slate-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-white">John Mitchell</h2>
                        <div className="flex items-center gap-2 text-slate-400 mt-1">
                            <span className="font-medium text-slate-300">Age 72</span>
                            <span>•</span>
                            <MapPin className="w-4 h-4 text-clinical-normal" />
                            <span>Independent</span>
                        </div>
                    </div>
                </div>
                <div className={cn(
                    "px-4 py-2 rounded-full font-bold uppercase tracking-wider text-sm transition-colors duration-500 flex items-center gap-2",
                    statusColors[status],
                    status === "critical" ? "animate-pulse" : ""
                )}>
                    {status === 'critical' ? <Activity className="w-4 h-4" /> : null}
                    {status}
                </div>
            </div>

            {/* Real-Time Vitals Display */}
            <div className="mt-8 flex items-end justify-between border-t border-slate-800/60 pt-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Heart className={cn("w-5 h-5", status !== 'normal' ? "text-clinical-critical animate-pulse-fast" : "text-clinical-normal")} />
                        <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Heart Rate</p>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className={cn(
                            "text-6xl font-black tabular-nums tracking-tighter transition-colors duration-300",
                            status === "critical" ? "text-clinical-critical" : status === "warning" ? "text-clinical-warning" : "text-white"
                        )}>
                            {hr > 0 ? hr.toFixed(0) : "--"}
                        </span>
                        <span className="text-slate-500 font-bold text-xl">BPM</span>
                    </div>
                </div>

                <div className="text-right">
                    <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">SpO2</p>
                    <div className="flex items-baseline gap-2 justify-end">
                        <span className={cn(
                            "text-4xl font-bold tabular-nums tracking-tight transition-colors duration-300",
                            status === "critical" || spo2 < 92 ? "text-clinical-critical" : status === "warning" ? "text-clinical-warning" : "text-slate-200"
                        )}>
                            {spo2 > 0 ? spo2.toFixed(1) : "--"}
                        </span>
                        <span className="text-slate-500 font-bold text-lg">%</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
