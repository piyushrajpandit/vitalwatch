import { User, Activity, Droplets, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export function PatientCard({ status, isFlashing, hr, spo2 }: { status: string, isFlashing: boolean, hr: number | null, spo2: number | null }) {
    const isCritical = status === "critical";
    const isWarning = status === "warning";

    return (
        <div className={cn(
            "relative overflow-hidden rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-8 transition-all duration-700 h-full",
            "glass-dark border-2",
            isCritical ? "border-red-500/50 shadow-[0_0_50px_rgba(239,68,68,0.2)] animate-pulse-glow" :
                isWarning ? "border-amber-500/50 shadow-[0_0_50px_rgba(245,158,11,0.1)]" :
                    "border-slate-800/50 hover:border-slate-700/50"
        )}>
            {/* Background Glow */}
            <div className={cn(
                "absolute -top-24 -right-24 w-64 h-64 rounded-full blur-[100px] transition-all duration-1000 opacity-50",
                isCritical ? "bg-red-500/20" : isWarning ? "bg-amber-500/10" : "bg-cyan-500/10"
            )} />

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-6 md:mb-10">
                    <div className="flex items-center gap-3 md:gap-5">
                        <div className="relative">
                            <div className="w-14 h-14 md:w-20 md:h-20 rounded-2xl md:rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center border border-white/10 shadow-2xl">
                                <User className="w-7 h-7 md:w-10 md:h-10 text-slate-400" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-4 border-[#070C18] animate-pulse shadow-lg" />
                        </div>
                        <div>
                            <h3 className="text-xl md:text-2xl font-black text-white tracking-tight leading-none mb-1 md:mb-2">John Mitchell</h3>
                            <div className="flex items-center gap-2">
                                <span className="text-slate-500 font-bold text-xs uppercase tracking-widest px-2 py-0.5 rounded bg-white/5 border border-white/5">Age 72</span>
                                <span className="text-slate-500 font-bold text-xs uppercase tracking-widest px-2 py-0.5 rounded bg-white/5 border border-white/5">Male</span>
                            </div>
                        </div>
                    </div>

                    <div className={cn(
                        "px-5 py-2.5 rounded-2xl font-black text-[11px] uppercase tracking-[0.25em] transition-all duration-500 border flex items-center gap-3",
                        isCritical ? "bg-red-500 text-white border-red-400 animate-breathe shadow-[0_10px_20px_rgba(239,68,68,0.4)]" :
                            isWarning ? "bg-amber-500/20 text-amber-500 border-amber-500/30 animate-breathe" :
                                "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                    )}>
                        <span className={cn("w-2.5 h-2.5 rounded-full", isCritical ? "bg-white animate-ping" : isWarning ? "bg-amber-500" : "bg-emerald-500")} />
                        {status || "Normal"}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 md:gap-8">
                    {/* Heart Rate */}
                    <div className="bg-white/[0.03] rounded-2xl md:rounded-3xl p-5 md:p-8 border border-white/5 hover:bg-white/[0.06] transition-all duration-500 group relative">
                        <div className="absolute top-4 right-4 text-slate-800 group-hover:text-red-500/20 transition-colors">
                            <Activity className="w-12 h-12" />
                        </div>
                        <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6 relative">
                            <div className={cn(
                                "p-2.5 rounded-xl transition-all duration-500",
                                isCritical ? "bg-red-500/20 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]" : "bg-slate-800 text-slate-400"
                            )}>
                                <Heart className={cn("w-6 h-6", (hr && hr > 0) ? "animate-heartbeat fill-current" : "")} />
                            </div>
                            <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">Heart Rate</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className={cn(
                                "text-3xl md:text-4xl font-black tracking-tighter number-transition",
                                isCritical ? "text-red-500 text-glow" : "text-white"
                            )}>
                                {hr || "--"}
                            </span>
                            <span className="text-slate-500 font-black text-sm tracking-widest uppercase">BPM</span>
                        </div>
                    </div>

                    {/* SpO2 */}
                    <div className="bg-white/[0.03] rounded-2xl md:rounded-3xl p-5 md:p-8 border border-white/5 hover:bg-white/[0.06] transition-all duration-500 group relative">
                        <div className="absolute top-4 right-4 text-slate-800 group-hover:text-cyan-500/20 transition-colors">
                            <Droplets className="w-12 h-12" />
                        </div>
                        <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6 relative">
                            <div className="p-2.5 rounded-xl bg-slate-800 text-slate-400 group-hover:text-cyan-400 group-hover:bg-cyan-500/10 transition-all duration-500">
                                <Droplets className="w-6 h-6" />
                            </div>
                            <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">Blood Oxygen</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl md:text-4xl font-black text-white tracking-tighter number-transition">
                                {spo2 || "--"}
                            </span>
                            <span className="text-slate-500 font-black text-sm tracking-widest uppercase">%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
