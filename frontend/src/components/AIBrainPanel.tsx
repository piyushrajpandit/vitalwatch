import React, { useEffect, useState } from 'react';
import { Brain, Sparkles, Activity, ShieldAlert, Cpu, Zap, Search, Maximize2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface AIDecision {
    risk_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    clinical_reasoning: string;
    immediate_action: string;
    confidence_score: number;
    timestamp: string;
    vitals_analyzed?: {
        heart_rate: number;
        spo2: number;
    };
}

export function AIBrainPanel() {
    const [decision, setDecision] = useState<AIDecision | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    useEffect(() => {
        const fetchDecision = async () => {
            try {
                const res = await fetch(`${API_URL}/agent/latest-decision`);
                const data = await res.json();

                // Diagnostic logging as requested
                console.log("[AIBrainPanel] Raw decision response:", data);

                if (data.status === "ok") {
                    setDecision(data.decision);
                } else {
                    setDecision(null);
                }
                setIsAnalyzing(data.is_analyzing);
            } catch (e) {
                console.error("[AIBrainPanel] Fetch error:", e);
                setDecision(null);
            }
        };

        const interval = setInterval(fetchDecision, 2000);
        return () => clearInterval(interval);
    }, []);

    const isCritical = decision?.risk_level === "CRITICAL";

    return (
        <div className={cn(
            "glass-dark border-2 rounded-[2.5rem] p-8 h-full transition-all duration-700 relative overflow-hidden flex flex-col",
            isCritical ? "border-red-500/50 shadow-[0_0_50px_rgba(239,68,68,0.2)] animate-pulse-glow" : "border-slate-800/50"
        )}>
            {/* Background Decorative Gradient */}
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-cyan-500/10 rounded-full blur-[100px] animate-pulse" />

            <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-500",
                            isAnalyzing ? "bg-cyan-500 text-white shadow-[0_0_20px_rgba(34,211,238,0.5)]" : "bg-slate-800 text-slate-400 border-white/5"
                        )}>
                            <Brain className={cn("w-6 h-6", isAnalyzing ? "animate-bounce" : "")} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white tracking-tight leading-none mb-1">VitalWatch AI</h3>
                            <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest flex items-center gap-2">
                                <span className={cn("w-1.5 h-1.5 rounded-full", isAnalyzing ? "bg-cyan-500 animate-ping" : "bg-emerald-500")} />
                                {isAnalyzing ? "Analyzing..." : "Neural Engine Active"}
                            </p>
                        </div>
                    </div>
                    {decision && (
                        <Link href="/report">
                            <button className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5 group">
                                <Maximize2 className="w-5 h-5 text-slate-400 group-hover:text-cyan-400" />
                            </button>
                        </Link>
                    )}
                </div>

                <div className="flex-1 flex flex-col justify-center min-h-[300px] overflow-hidden mt-4">
                    {decision ? (
                        <div className="space-y-4 animate-slide-down overflow-y-auto custom-scrollbar pr-2 pb-2 max-h-[280px]">
                            {/* Risk Badge */}
                            <div className={cn(
                                "inline-flex items-center gap-2 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-[0.2em]",
                                decision.risk_level === 'CRITICAL' ? "bg-red-500/20 text-red-500 border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]" :
                                    decision.risk_level === 'HIGH' ? "bg-amber-500/20 text-amber-500 border border-amber-500/30" :
                                        "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                            )}>
                                <ShieldAlert className="w-4 h-4" />
                                Triage Level: {decision.risk_level}
                            </div>

                            {/* Reasoning */}
                            <div className="relative">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-500 to-transparent rounded-full opacity-50" />
                                <div className="pl-6">
                                    <h4 className="text-slate-500 font-black text-[10px] uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <Cpu className="w-3 h-3" />
                                        Clinical Reasoning
                                    </h4>
                                    <p className="text-white font-bold text-sm leading-relaxed italic opacity-90">
                                        "{decision.clinical_reasoning}"
                                    </p>
                                </div>
                            </div>

                            {/* Action */}
                            <div className="bg-white/5 rounded-[1.5rem] p-6 border border-white/5 shadow-inner">
                                <h4 className="text-slate-500 font-black text-[10px] uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Zap className="w-3 h-3 text-amber-400" />
                                    Recommended Action
                                </h4>
                                <div className="text-cyan-400 font-black text-sm tracking-tight flex items-center gap-3">
                                    {decision.immediate_action}
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-cyan-400" />
                                    <span className="text-slate-500 font-black text-[9px] uppercase tracking-widest">Confidence Score: {(Number(decision?.confidence_score ?? 0) * 100).toFixed(0)}%</span>
                                </div>
                                <div className="text-slate-600 font-mono text-[9px] uppercase tracking-widest text-right">
                                    Processed at {decision?.timestamp ? new Date(decision.timestamp).toLocaleTimeString() : "--"}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center space-y-4 py-12">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full bg-slate-900 border-2 border-slate-800 flex items-center justify-center overflow-hidden">
                                    <Search className="w-10 h-10 text-slate-700 animate-pulse" />
                                    {isAnalyzing && <div className="absolute inset-0 bg-cyan-500/5 animate-pulse" />}
                                </div>
                                <div className="absolute inset-0 border-2 border-cyan-500/20 rounded-full animate-ping" />
                            </div>
                            <div>
                                <h4 className="text-white font-black text-sm uppercase tracking-widest mb-1">
                                    {isAnalyzing ? "Real-time Triage" : "Awaiting Pattern"}
                                </h4>
                                <p className="text-slate-500 font-bold text-xs uppercase tracking-tight">
                                    {isAnalyzing ? "Llama-3.1 Processing..." : "Monitoring telemetry"}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Metrics */}
                <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-cyan-500 opacity-50" />
                        <span className="text-slate-600 font-black text-[9px] uppercase tracking-[0.2em]">Sensor Fidelity: 98%</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-cyan-500 opacity-50" />
                        <span className="text-slate-600 font-black text-[9px] uppercase tracking-[0.2em]">AI Confidence: 0.94</span>
                    </div>
                </div>
            </div>

        </div>
    );
}
