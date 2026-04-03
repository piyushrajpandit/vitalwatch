"use client";

import React, { useEffect, useState, useRef } from "react";
import {
    Activity,
    ShieldAlert,
    Bell,
    Stethoscope,
    Radio,
    ScanHeart,
    Heart,
    X,
    Menu
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PatientCard } from "./PatientCard";
import { AlertFeed } from "./AlertFeed";
import { AIBrainPanel } from "./AIBrainPanel";
import { DemoControlPanel } from "./DemoControlPanel";
import { ScannerPanel } from "./ScannerPanel";
import { NotificationBanner } from "./NotificationBanner";
import { FaceScan } from "./FaceScan";
import Link from "next/link";
import dynamic from 'next/dynamic';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const VitalsChart = dynamic(() => import('./VitalsChart').then(mod => mod.VitalsChart), { ssr: false });

interface DataPoint {
    timestamp: string;
    heart_rate: number | null;
    spo2: number | null;
    anomaly_status: "normal" | "warning" | "critical" | "none";
    severity_score: number;
    whatsapp_alert_sent: boolean;
    is_anomaly: boolean;
    message: string;
}

export function Dashboard() {
    const [data, setData] = useState<DataPoint[]>([]);
    const [alerts, setAlerts] = useState<{ id: number, timestamp: string, status: "warning" | "critical", message: string, value: number | null }[]>([]);
    const [bannerAlert, setBannerAlert] = useState<{ id: number, timestamp: string, status: "warning" | "critical", message: string, value: number | null, title?: string } | null>(null);
    const [isTriggerFlashing, setIsTriggerFlashing] = useState(false);
    const [isConnected, setIsConnected] = useState(true);
    const [isAppLoading, setIsAppLoading] = useState(true);
    const [progress, setProgress] = useState(0);
    const [mode, setMode] = useState<"simulate" | "scanner">("simulate");
    const [showWhatsAppAlert, setShowWhatsAppAlert] = useState(false);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const eventSourceRef = useRef<EventSource | null>(null);

    const handleModeSwitch = async (newMode: "simulate" | "scanner") => {
        if (mode === newMode) return;
        setMode(newMode);
        setIsAppLoading(true);
        setProgress(0);
        setData([]);
        setAlerts([]);
        setBannerAlert(null);

        try {
            await fetch(`${API_URL}/vitals/mode`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mode: newMode })
            });
        } catch (e) { console.error(e); }

        let p = 0;
        const interval = setInterval(() => {
            p += 25;
            setProgress(p);
            if (p >= 100) clearInterval(interval);
        }, 100);

        setTimeout(() => setIsAppLoading(false), 800);
    };

    useEffect(() => {
        setIsAppLoading(true);
        let p = 0;
        const interval = setInterval(() => {
            p += 10;
            setProgress(p);
            if (p >= 100) clearInterval(interval);
        }, 100);
        setTimeout(() => setIsAppLoading(false), 1200);

        const connect = () => {
            if (eventSourceRef.current) eventSourceRef.current.close();
            const es = new EventSource(`${API_URL}/vitals/stream`);
            eventSourceRef.current = es;

            es.onopen = () => setIsConnected(true);
            es.onmessage = (event) => {
                const parsed: DataPoint = JSON.parse(event.data);
                setData(prev => [...prev, parsed].slice(-100));

                if (parsed.anomaly_status !== "normal" && parsed.anomaly_status !== "none") {
                    const newAlert = {
                        id: Date.now() + Math.random(),
                        timestamp: parsed.timestamp,
                        status: parsed.anomaly_status as "warning" | "critical",
                        message: parsed.message || `Anomalous activity: ${parsed.heart_rate} BPM`,
                        value: parsed.heart_rate
                    };
                    setAlerts(prev => [newAlert, ...prev].slice(0, 20));

                    if (parsed.anomaly_status === "critical") {
                        setBannerAlert({ ...newAlert, title: "🚨 CRITICAL ALERT" });
                    }
                } else if (parsed.anomaly_status === "normal") {
                    setBannerAlert(null);
                    setShowWhatsAppAlert(false);
                }

                if (parsed.whatsapp_alert_sent) setShowWhatsAppAlert(true);
            };

            es.onerror = () => {
                setIsConnected(false);
                es.close();
                setTimeout(connect, 3000);
            };
        };

        connect();
        return () => {
            if (eventSourceRef.current) eventSourceRef.current.close();
        };
    }, []);

    const latestData = data[data.length - 1] || {
        heart_rate: null,
        spo2: null,
        anomaly_status: "normal" as const
    };

    const isCritical = latestData.anomaly_status === "critical";

    return (
        <div className="min-h-screen bg-[#070C18] text-slate-200 selection:bg-cyan-500/30 overflow-x-hidden relative">
            {/* Animated Loading Overlay */}
            <div className={cn(
                "fixed inset-0 z-[200] bg-[#070C18] flex flex-col items-center justify-center transition-all duration-700",
                isAppLoading ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
            )}>
                <div className="flex flex-col items-center animate-pulse">
                    <Heart className="w-16 h-16 text-red-500 fill-red-500/20 mb-4" />
                    <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                    </div>
                </div>
            </div>

            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none opacity-40 animate-grid"
                style={{
                    backgroundImage: 'linear-gradient(rgba(17, 24, 39, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(17, 24, 39, 0.5) 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}
            />
            <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/[0.03] rounded-full blur-[120px] pointer-events-none" />
            <div className="fixed bottom-0 right-1/4 w-[600px] h-[600px] bg-indigo-500/[0.03] rounded-full blur-[120px] pointer-events-none" />

            {/* Connection Warning */}
            {!isConnected && (
                <div className="fixed top-0 left-0 right-0 z-[101] bg-red-500 text-white py-2 text-center text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3">
                    <ShieldAlert className="w-4 h-4 animate-bounce" />
                    System Offline • Attempting Reconnection...
                </div>
            )}

            {/* Header */}
            <header className="sticky top-0 z-50 glass border-b border-white/5 px-4 md:px-8 py-3 md:py-4 flex items-center justify-between">
                <div className="flex items-center gap-3 md:gap-10">
                    <div className="flex items-center gap-3 relative group">
                        <div className="absolute -inset-2 bg-cyan-500 rounded-full blur-xl opacity-10 group-hover:opacity-20 transition-opacity" />
                        <div className="bg-gradient-to-br from-cyan-500 to-indigo-600 p-2 rounded-2xl shadow-xl border border-white/10">
                            <Activity className="w-5 h-5 md:w-6 md:h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-base md:text-xl font-black text-white tracking-widest leading-none mb-0.5 uppercase">VitalWatch</h1>
                            <p className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">AI Patient Platform</p>
                        </div>
                    </div>

                    <nav className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/5">
                        <button
                            onClick={() => handleModeSwitch("simulate")}
                            className={cn(
                                "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2",
                                mode === "simulate" ? "bg-white text-black shadow-lg" : "text-slate-500 hover:text-white"
                            )}
                        >
                            <Radio className="w-3.5 h-3.5" />
                            Simulated
                        </button>
                        <button
                            onClick={() => handleModeSwitch("scanner")}
                            className={cn(
                                "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2",
                                mode === "scanner" ? "bg-white text-black shadow-lg" : "text-slate-500 hover:text-white"
                            )}
                        >
                            <ScanHeart className="w-3.5 h-3.5" />
                            Scanner
                        </button>
                    </nav>
                </div>

                <div className="flex items-center gap-2 md:gap-4">
                    <Link href="/pocket-doctor">
                        <button className="flex items-center gap-2 px-3 md:px-6 py-2 md:py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-95">
                            <Stethoscope className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            <span className="hidden sm:inline">Pocket Doctor</span>
                            <span className="sm:hidden">Doc</span>
                        </button>
                    </Link>
                    <div className="h-8 w-px bg-white/10 mx-1 hidden md:block" />
                    <div className="hidden md:flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/5 flex items-center justify-center">
                            <Bell className="w-4 h-4 text-slate-500" />
                        </div>
                    </div>
                    {/* Mobile mode switcher */}
                    <div className="flex md:hidden items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
                        <button onClick={() => handleModeSwitch("simulate")} className={cn("p-1.5 rounded-lg transition-all", mode === "simulate" ? "bg-white" : "text-slate-500")}>
                            <Radio className={cn("w-3.5 h-3.5", mode === "simulate" ? "text-black" : "")} />
                        </button>
                        <button onClick={() => handleModeSwitch("scanner")} className={cn("p-1.5 rounded-lg transition-all", mode === "scanner" ? "bg-white" : "text-slate-500")}>
                            <ScanHeart className={cn("w-3.5 h-3.5", mode === "scanner" ? "text-black" : "")} />
                        </button>
                    </div>
                </div>
            </header>

            <main className="p-4 md:p-8 max-w-[1700px] mx-auto space-y-6 md:space-y-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                            <div className="md:col-span-1">
                                <PatientCard
                                    status={latestData.anomaly_status === 'none' ? 'normal' : latestData.anomaly_status}
                                    isFlashing={isCritical}
                                    hr={latestData.heart_rate}
                                    spo2={latestData.spo2}
                                />
                            </div>
                            <div className="md:col-span-1">
                                {mode === "scanner" ? (
                                    <ScannerPanel currentHR={latestData.heart_rate} />
                                ) : (
                                    <FaceScan onScanComplete={() => { }} />
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col gap-8">
                            <VitalsChart data={data} metric="heart_rate" title="Cardiac Rhythms" />
                            <VitalsChart data={data} metric="spo2" title="Oxygen Saturation" />
                        </div>

                        <DemoControlPanel
                            onTriggerAnomaly={() => { fetch(`${API_URL}/vitals/trigger-anomaly`, { method: "POST" }); }}
                            onReset={() => {
                                fetch(`${API_URL}/vitals/reset`, { method: "POST" });
                                setAlerts([]);
                                setBannerAlert(null);
                                setShowWhatsAppAlert(false);
                            }}
                            isCritical={isCritical}
                        />
                    </div>

                    <div className="lg:col-span-4 flex flex-col gap-8">
                        <div className="h-[450px]">
                            <AIBrainPanel />
                        </div>
                        <div className="flex-1 min-h-[400px]">
                            <AlertFeed alerts={alerts} />
                        </div>
                    </div>
                </div>
            </main>

            <div className="fixed bottom-8 left-8 z-[100] flex flex-col items-start gap-4 w-full sm:w-[420px] pointer-events-none">
                <NotificationBanner alert={bannerAlert} onClose={() => setBannerAlert(null)} />
                {showWhatsAppAlert && (
                    <div className="w-[calc(100%-64px)] sm:w-full bg-[#25D366] text-white p-6 rounded-[2rem] shadow-2xl border border-white/20 animate-slide-right pointer-events-auto flex items-center gap-5 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                            <ShieldAlert className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest mb-1">WhatsApp Alert</h4>
                            <p className="text-sm font-bold opacity-95">📱 Secondary dispatch confirmed.</p>
                        </div>
                        <button onClick={() => setShowWhatsAppAlert(false)} className="ml-auto p-2 hover:bg-white/10 rounded-xl transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>

            <style jsx global>{`
                .toast-error, [data-sonner-toast][data-type="error"], .error-toast {
                    display: none !important;
                }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
             `}</style>
        </div>
    );
}
