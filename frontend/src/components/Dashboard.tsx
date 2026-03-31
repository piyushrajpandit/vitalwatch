"use client";

import { useEffect, useState } from "react";
import { PatientCard } from "./PatientCard";
import { VitalsChart } from "./VitalsChart";
import { AlertFeed } from "./AlertFeed";
import { DemoControlPanel } from "./DemoControlPanel";
import { FaceScan } from "./FaceScan";
import { NotificationBanner } from "./NotificationBanner";

interface DataPoint {
    timestamp: string;
    heart_rate: number;
    spo2: number;
    anomaly_status: "normal" | "warning" | "critical";
    severity_score: number;
}

export function Dashboard() {
    const [data, setData] = useState<DataPoint[]>([]);
    const [alerts, setAlerts] = useState<{ id: number, timestamp: string, status: "warning" | "critical", message: string, value: number }[]>([]);
    const [bannerAlert, setBannerAlert] = useState<{ id: number, timestamp: string, status: "warning" | "critical", message: string, value: number, title?: string } | null>(null);
    const [isTriggerFlashing, setIsTriggerFlashing] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined" && "Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
            Notification.requestPermission();
        }
        let eventSource: EventSource;
        let reconnectTimeout: NodeJS.Timeout;

        const connect = () => {
            eventSource = new EventSource("http://localhost:8000/vitals/stream");

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
        try {
            setIsTriggerFlashing(true);
            setTimeout(() => setIsTriggerFlashing(false), 3000);
            await fetch("http://localhost:8000/vitals/trigger-anomaly", { method: "POST" });
        } catch (err) {
            console.error("Trigger anomaly failed:", err);
        }
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
    const isCritical = latestStatus === "critical";
    const currentHR = data.length > 0 ? data[data.length - 1].heart_rate : 0;
    const currentSpO2 = data.length > 0 ? data[data.length - 1].spo2 : 0;

    return (
        <div className={`min-h-screen bg-clinical-dark p-6 transition-all duration-300 border-4 border-solid ${isTriggerFlashing ? 'border-red-500 shadow-[inset_0_0_150px_rgba(239,68,68,0.4)]' : isCritical ? 'border-red-500/20 shadow-[inset_0_0_100px_rgba(239,68,68,0.1)]' : 'border-transparent'}`}>
            <NotificationBanner alert={bannerAlert} onClose={() => setBannerAlert(null)} />
            <div className="max-w-[1600px] mx-auto space-y-6 mt-4">
                {/* Header */}
                <header className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-clinical-normal animate-pulse shadow-[0_0_10px_#10B981]"></div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">VitalWatch <span className="text-slate-500 font-light">| System Monitor</span></h1>
                    </div>
                    <div className="text-slate-400 font-medium text-sm">
                        Live Connection • {new Date().toLocaleDateString()}
                    </div>
                </header>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                    {/* Left Column (Main Stats) */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <PatientCard status={latestStatus} isFlashing={isCritical} hr={currentHR} spo2={currentSpO2} />
                            <FaceScan onScanComplete={handleScanComplete} />
                        </div>

                        <VitalsChart data={data} metric="heart_rate" title="Heart Rate History" />
                        <VitalsChart data={data} metric="spo2" title="Blood Oxygen (SpO2) History" />

                        <DemoControlPanel
                            onTriggerAnomaly={handleTriggerAnomaly}
                            onReset={handleReset}
                            isCritical={isCritical}
                        />
                    </div>

                    {/* Right Column (Alerts) */}
                    <div className="lg:col-span-4 h-full">
                        <AlertFeed alerts={alerts} />
                    </div>
                </div>
            </div>
        </div>
    );
}
