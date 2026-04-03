"use client";

import React, { useEffect, useState } from 'react';
import { Brain, Sparkles, Activity, ShieldAlert, Cpu, Zap, Heart, ArrowLeft, Loader2 } from 'lucide-react';
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

export default function DiagnosticReportPage() {
    const [decision, setDecision] = useState<AIDecision | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDecision = async () => {
            try {
                const res = await fetch(`${API_URL}/agent/latest-decision`);
                const data = await res.json();

                if (data.status === "ok" && data.decision) {
                    setDecision(data.decision);
                }
            } catch (e) {
                console.error("Fetch error:", e);
            } finally {
                setLoading(false);
            }
        };

        fetchDecision();
    }, []);

    return (
        <div className="min-h-screen bg-[#070C18] text-slate-200 selection:bg-cyan-500/30 overflow-x-hidden relative p-8 flex justify-center pt-32 pb-24">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none opacity-40 animate-grid"
                style={{
                    backgroundImage: 'linear-gradient(rgba(17, 24, 39, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(17, 24, 39, 0.5) 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}
            />
            <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/[0.03] rounded-full blur-[120px] pointer-events-none" />

            <Link href="/" className="fixed top-8 left-8 z-50">
                <button className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-xs rounded-2xl border border-white/10 transition-all shadow-xl group backdrop-blur-md">
                    <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:-translate-x-1 transition-transform" />
                    Back to Dashboard
                </button>
            </Link>

            <div className="w-full max-w-4xl relative z-10 animate-in slide-in-from-bottom-8 duration-700">
                {loading ? (
                    <div className="h-[60vh] flex flex-col items-center justify-center space-y-6">
                        <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
                        <h2 className="text-xl font-black text-slate-400 uppercase tracking-widest">Loading Diagnostic Data...</h2>
                    </div>
                ) : !decision ? (
                     <div className="h-[60vh] flex flex-col items-center justify-center space-y-6 text-center">
                        <ShieldAlert className="w-16 h-16 text-slate-600 mb-4" />
                        <h2 className="text-2xl font-black text-white uppercase tracking-widest">No Diagnostic Data Found</h2>
                        <p className="text-slate-400">The neural engine has not processed any anomalies recently.</p>
                     </div>
                ) : (
                    <div className="bg-[#0b1221]/80 backdrop-blur-3xl border-2 border-cyan-500/30 rounded-[3rem] p-12 w-full shadow-[0_0_100px_rgba(34,211,238,0.1)] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px]" />
                        
                        <div className="relative z-10">
                            <div className="flex flex-col md:flex-row md:items-start justify-between mb-12 gap-6">
                                <div>
                                    <div className="flex items-center gap-4 mb-3">
                                        <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                                            <Brain className="w-8 h-8 text-cyan-400" />
                                        </div>
                                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">AI Diagnostic Report</h1>
                                    </div>
                                    <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-sm md:ml-[5.5rem]">
                                        Generated at {decision?.timestamp ? new Date(decision.timestamp).toLocaleString() : "--"}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-8">
                                {/* Vitals Snapshot */}
                                {decision.vitals_analyzed && (
                                    <div className="flex flex-col md:flex-row gap-6">
                                        <div className="flex-1 bg-red-500/10 border border-red-500/20 rounded-[2.5rem] p-8 flex items-center gap-8">
                                            <div className="w-16 h-16 rounded-[1.5rem] bg-red-500/20 flex items-center justify-center shadow-inner">
                                                <Heart className="w-8 h-8 text-red-500 animate-pulse" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-red-500 uppercase tracking-[0.2em] mb-2">Heart Rate</p>
                                                <p className="text-5xl font-black text-white leading-none tracking-tighter">{decision.vitals_analyzed.heart_rate} <span className="text-2xl text-red-400 tracking-normal inline-block ml-1">BPM</span></p>
                                            </div>
                                        </div>
                                        <div className="flex-1 bg-cyan-500/10 border border-cyan-500/20 rounded-[2.5rem] p-8 flex items-center gap-8">
                                            <div className="w-16 h-16 rounded-[1.5rem] bg-cyan-500/20 flex items-center justify-center shadow-inner">
                                                <Activity className="w-8 h-8 text-cyan-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-cyan-500 uppercase tracking-[0.2em] mb-2">Blood Oxygen</p>
                                                <p className="text-5xl font-black text-white leading-none tracking-tighter">{decision.vitals_analyzed.spo2} <span className="text-2xl text-cyan-400 tracking-normal inline-block ml-1">%</span></p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="bg-white/[0.02] rounded-[2.5rem] p-8 border border-white/5">
                                        <h4 className="text-slate-500 font-black text-xs uppercase tracking-[0.2em] mb-4 flex items-center gap-3">
                                            <ShieldAlert className="w-5 h-5 text-amber-500" />
                                            Calculated Severity
                                        </h4>
                                        <div className={cn(
                                            "inline-flex px-8 py-3 rounded-2xl text-lg font-black tracking-widest border-2",
                                            decision.risk_level === 'CRITICAL' ? "bg-red-500/10 text-red-500 border-red-500/30" :
                                                decision.risk_level === 'HIGH' ? "bg-amber-500/10 text-amber-500 border-amber-500/30" :
                                                    "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                                        )}>
                                            {decision.risk_level}
                                        </div>
                                    </div>
                                    <div className="bg-white/[0.02] rounded-[2.5rem] p-8 border border-white/5">
                                        <h4 className="text-slate-500 font-black text-xs uppercase tracking-[0.2em] mb-4 flex items-center gap-3">
                                            <Sparkles className="w-5 h-5 text-cyan-400" />
                                            Model Confidence
                                        </h4>
                                        <div className="text-white text-4xl font-black tracking-tighter">
                                            {((decision?.confidence_score ?? 0) * 100).toFixed(1)}%
                                            <span className="text-sm text-slate-500 font-medium tracking-normal block mt-2 opacity-80">Precision mapping active</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-10 bg-[#070c18]/50 rounded-[3rem] border border-white/5 shadow-inner">
                                    <h4 className="text-slate-500 font-black text-sm uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                                        <Cpu className="w-6 h-6 text-indigo-400" />
                                        Advanced Neural Reasoning
                                    </h4>
                                    <p className="text-slate-200 text-xl font-medium leading-[1.8] italic">
                                        "{decision.clinical_reasoning}"
                                    </p>
                                </div>

                                <div className="p-10 bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 rounded-[3rem] border-2 border-cyan-500/30 relative overflow-hidden shadow-[0_0_50px_rgba(34,211,238,0.05)]">
                                     <div className="absolute inset-0 bg-cyan-500/5 animate-pulse" />
                                    <h4 className="relative z-10 text-cyan-400 font-black text-sm uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                                        <Zap className="w-6 h-6 text-amber-400" />
                                        Immediate Action Required
                                    </h4>
                                    <p className="relative z-10 text-white text-2xl md:text-3xl font-black tracking-tight leading-snug">
                                        {decision.immediate_action}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
