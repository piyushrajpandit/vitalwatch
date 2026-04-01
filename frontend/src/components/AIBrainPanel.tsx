import { BrainCircuit, ShieldCheck, Activity, AlertCircle, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface AgentDecision {
    risk_level: string;
    reasoning: string;
    action: string;
    message: string;
    should_alert: boolean;
    timestamp: string;
    vitals_analyzed: Record<string, unknown>;
}

interface AgentState {
    decision: AgentDecision | null;
    is_analyzing: boolean;
}

export function AIBrainPanel() {
    const [state, setState] = useState<AgentState>({ decision: null, is_analyzing: false });

    useEffect(() => {
        const fetchDecision = async () => {
            try {
                const res = await fetch("https://vitalwatch-production-ed1f.up.railway.app/agent/latest-decision");
                if (!res.ok) throw new Error("Backend offline");
                const data = await res.json();
                setState({
                    decision: data.status === "none" ? null : data.decision,
                    is_analyzing: data.is_analyzing || false
                });
            } catch (e) {
                setState({
                    decision: {
                        risk_level: "warning",
                        reasoning: "AI Agent temporarily unavailable due to connectivity timeout. Standard numerical baseline monitoring remains active.",
                        action: "Awaiting automatic inference reconnections...",
                        message: "AI Agent Offline",
                        should_alert: false,
                        timestamp: new Date().toISOString(),
                        vitals_analyzed: {}
                    },
                    is_analyzing: false
                });
            }
        };

        fetchDecision();
        const interval = setInterval(fetchDecision, 3000);
        return () => clearInterval(interval);
    }, []);

    const d = state.decision;
    const risk = d?.risk_level || 'normal';

    const themeMap: Record<string, { border: string, badge: string, icon: string, bg: string, alertBox: string }> = {
        critical: {
            border: 'border-red-500/50 shadow-[0_0_40px_rgba(239,68,68,0.25)]',
            badge: 'bg-red-500/20 text-red-400 border-red-500/30',
            icon: 'text-red-400',
            bg: 'bg-red-950/10',
            alertBox: 'bg-red-950/40 border-red-500/40 text-red-200'
        },
        high: {
            border: 'border-orange-500/50 shadow-[0_0_40px_rgba(249,115,22,0.2)]',
            badge: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
            icon: 'text-orange-400',
            bg: 'bg-orange-950/10',
            alertBox: 'bg-orange-950/40 border-orange-500/40 text-orange-200'
        },
        warning: {
            border: 'border-amber-500/50 shadow-[0_0_40px_rgba(245,158,11,0.2)]',
            badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
            icon: 'text-amber-400',
            bg: 'bg-amber-950/10',
            alertBox: 'bg-amber-950/40 border-amber-500/40 text-amber-200'
        },
        normal: {
            border: 'border-emerald-500/50 shadow-[0_0_40px_rgba(16,185,129,0.15)]',
            badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
            icon: 'text-emerald-400',
            bg: 'bg-emerald-950/10',
            alertBox: 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
        }
    };
    const theme = themeMap[risk] || themeMap.normal;

    return (
        <div className={cn(
            "bg-[#0A1128] border bg-opacity-90 rounded-3xl p-6 flex flex-col h-full min-h-[500px] relative overflow-hidden transition-all duration-700",
            theme.border, theme.bg
        )}>
            {/* Background glow */}
            <div className={cn(
                "absolute top-0 right-0 w-72 h-72 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none transition-colors duration-700",
                risk === 'critical' ? 'bg-red-600/10' : risk === 'high' ? 'bg-orange-600/10' : risk === 'warning' ? 'bg-amber-600/10' : 'bg-emerald-600/10'
            )}></div>

            {/* Header */}
            <div className="flex items-center justify-between mb-6 relative z-10 w-full">
                <div className="flex items-center gap-4 w-full">
                    <div className={cn(
                        "p-3 rounded-2xl border shadow-lg transition-colors duration-500",
                        risk === 'critical' ? 'bg-red-950/50 border-red-800/50' :
                            risk === 'high' ? 'bg-orange-950/50 border-orange-800/50' :
                                risk === 'warning' ? 'bg-amber-950/50 border-amber-800/50' :
                                    'bg-emerald-950/50 border-emerald-800/50'
                    )}>
                        <BrainCircuit className={cn("w-8 h-8", theme.icon)} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-2xl font-black text-white tracking-tight flex justify-between w-full items-center">
                            <span>🤖 VitalWatch AI Agent</span>
                            {/* Pulsing Green Dot */}
                            <div className="flex items-center gap-2">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                </span>
                                <span className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">Active</span>
                            </div>
                        </h3>
                    </div>
                </div>
            </div>

            {/* Dynamic Content */}
            <div className="flex-1 relative z-10 flex flex-col justify-center">
                {state.is_analyzing ? (
                    <div className="flex flex-col items-center justify-center p-8 animate-pulse text-cyan-400 min-h-[300px]">
                        <Activity className="w-14 h-14 mb-4 opacity-80" />
                        <h4 className="text-xl font-black tracking-[0.2em] uppercase">Analyzing...</h4>
                        <p className="text-sm opacity-70 mt-2 font-medium">Processing physiological telemetry</p>
                    </div>
                ) : !d ? (
                    <div className="flex flex-col items-center justify-center text-emerald-500/60 p-8 min-h-[300px]">
                        <CheckCircle2 className="w-16 h-16 mb-4 opacity-50" />
                        <h4 className="text-xl font-black tracking-widest uppercase">Safe Baseline</h4>
                        <p className="text-sm font-medium opacity-70 mt-2 text-center max-w-[200px]">Continuous AI monitoring is perfectly stable.</p>
                    </div>
                ) : (
                    <div className="space-y-4 animate-slide-down flex-1 flex flex-col">
                        <div className="flex justify-between items-center pb-3 border-b border-slate-700/50">
                            <div className="flex items-center gap-3">
                                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Risk Assessment</h4>
                                <span className={cn("px-3 py-1 text-[11px] font-black uppercase tracking-widest rounded-md border shadow-sm", theme.badge)}>
                                    {d.risk_level}
                                </span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-500 font-bold bg-slate-900 px-2 py-1 rounded border border-slate-800" suppressHydrationWarning>
                                {new Date(d.timestamp).toLocaleTimeString([], { hour12: false })}
                            </span>
                        </div>

                        <div className="flex gap-3">
                            <div className="bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-1.5 flex items-center gap-2 shadow-inner">
                                <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">HR</span>
                                <span className={cn("font-bold font-mono text-sm", theme.icon)}>{Number(d.vitals_analyzed?.heart_rate || 0).toFixed(1)}</span>
                            </div>
                            <div className="bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-1.5 flex items-center gap-2 shadow-inner">
                                <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">SpO2</span>
                                <span className={cn("font-bold font-mono text-sm", theme.icon)}>{Number(d.vitals_analyzed?.spo2 || 0).toFixed(1)}%</span>
                            </div>
                        </div>

                        {/* Italic reasoning */}
                        <div className="bg-slate-900/40 p-4 rounded-xl border-l-4 border-slate-700 shadow-md">
                            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Clinical Reasoning</h4>
                            <p className="text-[13px] text-slate-300 italic font-medium leading-relaxed">&quot;{d.reasoning}&quot;</p>
                        </div>

                        {/* Bold action */}
                        <div className="mt-1">
                            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4" /> Recommendation
                            </h4>
                            <p className="text-[14px] text-white font-extrabold leading-snug tracking-tight">
                                {d.action}
                            </p>
                        </div>

                        {/* Highlighted alert message */}
                        <div className={cn("mt-auto p-4 rounded-xl border flex items-start gap-4 shadow-lg", theme.alertBox)}>
                            <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">Generated Alert</h4>
                                <p className="text-sm font-bold tracking-tight">{d.message}</p>
                            </div>
                        </div>

                        <div className="pt-2 flex justify-end items-center text-[9px] font-mono text-slate-600 font-bold uppercase tracking-widest">
                            Model: llama-3.1-8b-instant
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
