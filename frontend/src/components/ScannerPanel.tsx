"use client";

import React, { useEffect, useState } from "react";
import { Camera, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function ScannerPanel({ currentHR }: { currentHR: number | null }) {
    const [frame, setFrame] = useState<string | null>(null);

    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`${API_URL}/scanner/frame`);
                const data = await res.json();
                if (data.frame) {
                    setFrame(data.frame);
                }
            } catch (e) { }
        }, 100);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="glass-dark border border-white/5 rounded-[2.5rem] p-8 h-full flex flex-col transition-all duration-500 hover:border-white/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[60px] rounded-full" />

            <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center shadow-lg">
                        <Camera className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white tracking-widest uppercase mb-0.5">Live Scanner</h3>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">Optical Vitals Link</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 bg-black/40 rounded-3xl border border-white/5 overflow-hidden relative flex items-center justify-center aspect-video mb-6 shadow-inner group-hover:border-cyan-500/20 transition-colors">
                {frame ? (
                    <img src={`data:image/jpeg;base64,${frame}`} className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-105" alt="Scanner Frame" />
                ) : (
                    <div className="text-slate-700 flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-800 flex items-center justify-center animate-spin-slow">
                            <Camera className="w-6 h-6 opacity-40" />
                        </div>
                        <span className="text-[10px] uppercase tracking-[0.3em] font-black italic">Awaiting Matrix...</span>
                    </div>
                )}

                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md border border-cyan-500/30 text-cyan-400 px-3 py-1.5 rounded-xl text-[9px] font-black tracking-widest uppercase flex items-center gap-2 shadow-xl">
                    <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                    LIVE LINK
                </div>
            </div>

            <div className="bg-white/5 border border-white/5 p-5 rounded-2xl flex items-center justify-between shadow-inner group-hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-all duration-500",
                        (currentHR !== null && currentHR > 0) ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "bg-slate-800 text-slate-600 border border-white/5"
                    )}>
                        <Activity className={cn("w-6 h-6", (currentHR !== null && currentHR > 0) && "animate-heartbeat")} />
                    </div>
                    <div>
                        <div className="text-[9px] uppercase tracking-widest font-black text-slate-500 mb-1">Signal Status</div>
                        {currentHR !== null && currentHR > 0 ? (
                            <div className="text-cyan-400 text-xs font-black tracking-widest uppercase">Signal Locked</div>
                        ) : (
                            <div className="text-slate-600 text-xs font-black tracking-widest uppercase italic animate-pulse">Searching...</div>
                        )}
                    </div>
                </div>
                {currentHR !== null && currentHR > 0 && (
                    <div className="text-right">
                        <div className="text-[9px] uppercase tracking-widest font-black text-slate-500 mb-1">Detected</div>
                        <div className="text-white text-xl font-black leading-none">{currentHR} <span className="text-[10px] text-slate-500">BPM</span></div>
                    </div>
                )}
            </div>

            <style jsx>{`
                @keyframes spin-slow {
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 8s linear infinite;
                }
            `}</style>
        </div>
    );
}
