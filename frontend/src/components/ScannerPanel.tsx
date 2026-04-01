import { useEffect, useState } from "react";
import { Camera, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export function ScannerPanel({ currentHR }: { currentHR: number }) {
    const [frame, setFrame] = useState<string | null>(null);

    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const res = await fetch("https://vitalwatch-production-ed1f.up.railway.app/scanner/frame");
                const data = await res.json();
                if (data.frame) {
                    setFrame(data.frame);
                }
            } catch (e) { }
        }, 100);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-clinical-card border border-clinical-border rounded-2xl p-6 relative overflow-hidden h-full flex flex-col justify-between shadow-[0_0_30px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Camera className="w-5 h-5 text-emerald-500" />
                    <h3 className="text-lg font-black text-white tracking-tight uppercase">📡 Live Watch Scanner</h3>
                </div>
            </div>
            
            <div className="flex-1 bg-black rounded-xl border-2 border-slate-800 overflow-hidden relative flex items-center justify-center min-h-[220px]">
                {frame ? (
                    <img src={`data:image/jpeg;base64,${frame}`} className="w-full h-full object-cover" alt="Scanner Frame" />
                ) : (
                    <div className="text-slate-500 flex flex-col items-center gap-2">
                        <Camera className="w-8 h-8 opacity-50 animate-pulse" />
                        <span className="text-[10px] uppercase tracking-widest font-bold">Awaiting Video Matrix...</span>
                    </div>
                )}
                
                <div className="absolute top-2 right-2 bg-[#0A1128]/80 border border-emerald-500/30 text-emerald-400 px-3 py-1.5 rounded-lg text-[9px] font-black tracking-[0.2em] uppercase flex items-center gap-2 shadow-lg backdrop-blur-sm">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
                    OPTICAL LINK ACTIVE
                </div>
            </div>
            
            <div className="mt-4 bg-[#0A1128]/50 border border-slate-800 p-4 rounded-xl flex items-center gap-3 shadow-inner">
                <Activity className={cn("w-6 h-6", currentHR > 0 ? "text-emerald-500" : "text-amber-500")} />
                <div>
                     <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-0.5">Scanner Status</div>
                     {currentHR > 0 ? (
                         <div className="text-emerald-400 text-sm font-black text-balance">BPM Detected: {currentHR} BPM</div>
                     ) : (
                         <div className="text-orange-400 text-sm font-black animate-pulse shadow-orange-500">Scanning for valid numbers...</div>
                     )}
                </div>
            </div>
        </div>
    );
}
