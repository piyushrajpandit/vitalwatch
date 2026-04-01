"use client";

import { useEffect, useState } from "react";
import { PatientCard } from "./PatientCard";
import { AlertFeed } from "./AlertFeed";
import { DemoControlPanel } from "./DemoControlPanel";
import { FaceScan } from "./FaceScan";
import { NotificationBanner } from "./NotificationBanner";
import { AIBrainPanel } from "./AIBrainPanel";
import dynamic from 'next/dynamic';
import { Heart, BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";
import { HowItWorks } from "./HowItWorks";
import { ScannerPanel } from "./ScannerPanel";

const VitalsChart = dynamic(() => import('./VitalsChart').then(mod => mod.VitalsChart), { ssr: false });

interface DataPoint {
    timestamp: string;
    heart_rate: number;
    spo2: number;
    anomaly_status: "normal" | "warning" | "critical" | "none";
    severity_score: number;
}

export function Dashboard() {
    const [data, setData] = useState<DataPoint[]>([]);
    const [alerts, setAlerts] = useState<{ id: number, timestamp: string, status: "warning" | "critical", message: string, value: number }[]>([]);
    const [bannerAlert, setBannerAlert] = useState<{ id: number, timestamp: string, status: "warning" | "critical", message: string, value: number, title?: string } | null>(null);
    const [isTriggerFlashing, setIsTriggerFlashing] = useState(false);
    const [isConnected, setIsConnected] = useState(true);
    const [isAppLoading, setIsAppLoading] = useState(true);
    const [progress, setProgress] = useState(0);
    const [mode, setMode] = useState<"simulate" | "scanner">("simulate");
    const [loadingText, setLoadingText] = useState("Initializing AI Health Monitor...");

    const handleModeSwitch = async (newMode: "simulate" | "scanner") => {
        if (mode === newMode) return;

        setMode(newMode);
        setLoadingText(`Switching to ${newMode === 'scanner' ? 'Live Scanner' : 'Simulated Data'}...`);
        setIsAppLoading(true);
        setProgress(0);

        // Hard reset all charts, history, and AI alerts instantaneously
        setData([]);
        setAlerts([]);
        setBannerAlert(null);

        try {
            await fetch("http://localhost:8000/vitals/mode", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mode: newMode })
            });
        } catch (e) {
            console.error("Mode switch error:", e);
        }

        let p = 0;
        const interval = setInterval(() => {
            p += 25;
            setProgress(p);
            if (p >= 100) clearInterval(interval);
        }, 100);

        setTimeout(() => {
            setIsAppLoading(false);
            setLoadingText("Initializing AI Health Monitor...");
        }, 1000);
    };

    useEffect(() => {
        const timer1 = setTimeout(() => setProgress(100), 100);
        const timer2 = setTimeout(() => setIsAppLoading(false), 2200);
        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, []);

    useEffect(() => {
        if (typeof window !== "undefined" && "Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
            Notification.requestPermission();
        }

        fetch("http://localhost:8000/alerts/history")
            .then(res => res.json())
            .then((history: any[]) => {
                if (Array.isArray(history)) {
                    const formatted = history.map(item => ({
                        id: Number(item.id || Date.now() + Math.random()),
                        timestamp: String(item.timestamp),
                        status: (item.severity === 'critical' ? 'critical' : 'warning') as "critical" | "warning",
                        message: `Heart rate reached ${item.heart_rate} BPM (SpO2: ${item.spo2}%)`,
                        value: Number(item.heart_rate)
                    }));
                    setAlerts(formatted);
                }
            })
            .catch(err => console.error("Failed to load backfilled alerts", err));

        let eventSource: EventSource;
        let reconnectTimeout: NodeJS.Timeout;

        const connect = () => {
            eventSource = new EventSource("http://localhost:8000/vitals/stream");

            eventSource.onopen = () => {
                setIsConnected(true);
            };

            eventSource.onmessage = (event) => {
                try {
                    const parsed: DataPoint = JSON.parse(event.data);

                    setData((prev) => {
                        const newData = [...prev, parsed].slice(-60); // Keep last 60 seconds
                        return newData;
                    });

                    if (parsed.anomaly_status !== "normal") {
                        setAlerts((prev) => {
                            const lastAlert = prev[0];
                            if (lastAlert && lastAlert.status === parsed.anomaly_status && (Date.now() - new Date(lastAlert.timestamp).getTime() < 5000)) {
                                return prev;
                            }
                            const newAlert = {
                                id: Date.now() + Math.random(),
                                timestamp: parsed.timestamp,
                                status: parsed.anomaly_status as "warning" | "critical",
                                message: `Heart rate reached ${parsed.heart_rate} BPM (SpO2: ${parsed.spo2}%)`,
                                value: parsed.heart_rate
                            };

                            if (parsed.anomaly_status === "critical") {
                                const timeStr = new Date(parsed.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                const bannerMsg = `🚨 CRITICAL ALERT — John's heart rate reached ${parsed.heart_rate} BPM at ${timeStr}. Immediate attention recommended.`;

                                setBannerAlert({
                                    ...newAlert,
                                    title: "🚨 CRITICAL ALERT",
                                    message: bannerMsg
                                });

                                if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
                                    new Notification("🚨 CRITICAL ALERT", { body: bannerMsg });
                                }

                                fetch("http://localhost:8000/notifications/send", {
                                    method: "POST",
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        title: "🚨 CRITICAL ALERT",
                                        body: bannerMsg
                                    })
                                }).catch(() => { });
                            }

                            return [newAlert, ...prev].slice(0, 10);
                        });
                    }
                } catch (err) {
                    console.error("Error parsing stream content", err);
                }
            };

            eventSource.onerror = (err) => {
                console.error("EventSource failed, reconnecting in 3s...", err);
                eventSource.close();
                setIsConnected(false);
                reconnectTimeout = setTimeout(connect, 3000);
            };
        };

        connect();

        return () => {
            if (eventSource) eventSource.close();
            clearTimeout(reconnectTimeout);
        };
    }, []);

    const handleTriggerAnomaly = async () => {
        setIsTriggerFlashing(true);
        setTimeout(() => setIsTriggerFlashing(false), 3000);
        const res = await fetch("http://localhost:8000/vitals/trigger-anomaly", { method: "POST" });
        if (!res.ok) throw new Error("Trigger failure");
    };

    const handleReset = async () => {
        try {
            await fetch("http://localhost:8000/vitals/reset", { method: "POST" });
            setAlerts([]);
            setBannerAlert(null);
        } catch (err) {
            console.error("Reset failed:", err);
        }
    };

    const handleScanComplete = (hr: number) => {
        // Modify last point visually to show effect
        setData(pts => {
            const newPts = [...pts];
            if (newPts.length > 0) {
                newPts[newPts.length - 1] = { ...newPts[newPts.length - 1], heart_rate: hr };
            }
            return newPts;
        });
    };

    const latestStatus = data.length > 0 ? data[data.length - 1].anomaly_status : "normal";
    const cleanedStatus = latestStatus === "none" ? "normal" : latestStatus;
    const isCritical = latestStatus === "critical";
    const currentHR = data.length > 0 ? data[data.length - 1].heart_rate : 0;
    const currentSpO2 = data.length > 0 ? data[data.length - 1].spo2 : 0;

    return (
        <>
            {/* Initial Loading Screen Overlay */}
            <div className={cn(
                "fixed inset-0 z-[200] bg-[#0A1128] flex flex-col items-center justify-center transition-all duration-1000",
                isAppLoading ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
            )}>
                <div className="flex flex-col items-center max-w-sm w-full px-8 animate-slide-down">
                    <Heart className="w-20 h-20 text-red-500 fill-red-500/20 animate-pulse mb-6 drop-shadow-[0_0_20px_rgba(239,68,68,0.3)]" />
                    <h1 className="text-4xl font-black text-white tracking-widest mb-3">VITALWATCH</h1>
                    <p className="text-cyan-500/80 font-bold text-[10px] uppercase tracking-[0.2em] mb-12 text-center text-balance transition-all">
                        {loadingText}
                    </p>

                    {/* Progress Bar */}
                    <div className="w-full h-1 bg-slate-800/80 rounded-full overflow-hidden shadow-inner flex justify-start">
                        <div
                            className="h-full bg-gradient-to-r from-red-500 via-emerald-500 to-cyan-500 rounded-full"
                            style={{ width: `${progress}%`, transition: 'width 2s cubic-bezier(0.16, 1, 0.3, 1)' }}
                        ></div>
                    </div>
                </div>
            </div>

            <div className={`min-h-screen bg-clinical-dark p-6 transition-all duration-300 border-4 border-solid ${isTriggerFlashing ? 'border-red-500 shadow-[inset_0_0_150px_rgba(239,68,68,0.4)]' : isCritical ? 'border-red-500/20 shadow-[inset_0_0_100px_rgba(239,68,68,0.1)]' : 'border-transparent'}`}>
                {!isConnected && (
                    <div className="fixed top-0 left-0 right-0 bg-red-600/90 backdrop-blur-sm text-white font-extrabold py-3 text-center z-[100] animate-pulse shadow-2xl tracking-widest uppercase text-sm border-b-2 border-red-400">
                        ⚠️ Connection to backend lost. Reconnecting...
                    </div>
                )}
                <NotificationBanner alert={bannerAlert} onClose={() => setBannerAlert(null)} />
                <div className="max-w-[1600px] mx-auto space-y-6 mt-4 relative">
                    {/* Header */}
                    <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                        <div className="flex flex-col md:flex-row md:items-center gap-6">
                            <div className="flex items-center gap-3">
                                <Heart className="w-8 h-8 text-red-500 fill-red-500/20" />
                                <div>
                                    <h1 className="text-3xl font-black text-white tracking-tight">VitalWatch</h1>
                                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">AI-Powered Patient Monitoring</p>
                                </div>
                            </div>

                            {/* Data Source Toggle */}
                            <div className="hidden md:flex bg-clinical-card p-1.5 rounded-xl border border-slate-800/80 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
                                <button
                                    onClick={() => handleModeSwitch("simulate")}
                                    className={cn("px-4 py-2.5 font-black text-[10px] uppercase tracking-widest rounded-lg transition-all duration-300", mode === "simulate" ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.15)] scale-105" : "text-slate-500 hover:text-slate-300 border border-transparent")}
                                >
                                    🔵 Simulated Data
                                </button>
                                <button
                                    onClick={() => handleModeSwitch("scanner")}
                                    className={cn("px-4 py-2.5 font-black text-[10px] uppercase tracking-widest rounded-lg transition-all duration-300", mode === "scanner" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)] scale-105" : "text-slate-500 hover:text-slate-300 border border-transparent")}
                                >
                                    📡 Live Scanner
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 text-slate-400 font-bold text-sm" suppressHydrationWarning>
                            <div className="flex items-center gap-2 bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-800 shadow-inner">
                                <span className={`relative flex h-2.5 w-2.5`}>
                                    {isConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                </span>
                                <span className={`text-[#0A1128] text-xs uppercase tracking-widest font-black mix-blend-difference ${isConnected ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {isConnected ? "Backend Connected" : "Connection Lost"}
                                </span>
                            </div>
                            <div className="mr-1">Live Connection • {new Date().toLocaleDateString()}</div>
                        </div>
                    </header>

                    {/* Main Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                        {/* Left Column (Main Stats) */}
                        <div className="lg:col-span-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                                <PatientCard status={cleanedStatus} isFlashing={isCritical} hr={currentHR} spo2={currentSpO2} />
                                {mode === "scanner" ? (
                                    <ScannerPanel currentHR={currentHR} />
                                ) : (
                                    <FaceScan onScanComplete={handleScanComplete} />
                                )}
                            </div>

                            <VitalsChart data={data} metric="heart_rate" title="Heart Rate History" />
                            <VitalsChart data={data} metric="spo2" title="Blood Oxygen (SpO2) History" />

                            <DemoControlPanel
                                onTriggerAnomaly={handleTriggerAnomaly}
                                onReset={handleReset}
                                isCritical={isCritical}
                            />
                        </div>

                        {/* Right Column (Alerts & AI) */}
                        <div className="lg:col-span-4 flex flex-col gap-6 h-full">
                            <div className="shrink-0">
                                <AIBrainPanel />
                            </div>
                            <div className="flex-1 min-h-[400px]">
                                <AlertFeed alerts={alerts} />
                            </div>
                        </div>
                    </div>

                    {/* Product Architecture Overview */}
                    <HowItWorks />
                </div>

                {/* Footer Bar */}
                <footer className="max-w-[1600px] mx-auto mt-8 border-t border-slate-800/80 pt-4 pb-2 flex flex-col md:flex-row items-center justify-between text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                    <div className="flex items-center gap-2 mb-2 md:mb-0">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-emerald-500/90">Monitoring Active</span>
                    </div>
                    <div suppressHydrationWarning>
                        {new Date().toLocaleTimeString()}
                    </div>
                    <div className="flex items-center gap-2 mt-2 md:mt-0">
                        <BrainCircuit className="w-4 h-4 text-cyan-500" />
                        <span className="text-cyan-500">AI Agent: Online</span>
                    </div>
                </footer>
            </div>
        </>
    );
}
