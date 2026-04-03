"use client";

import { useState, useCallback, useEffect } from "react";
import {
    ArrowLeft,
    Heart,
    Search,
    AlertTriangle,
    Phone,
    MapPin,
    Navigation,
    X,
    CheckCircle2,
    Loader2,
    ChevronRight,
    Activity,
    Stethoscope,
    ShieldAlert,
    Clock,
    Sparkles,
    User
} from "lucide-react";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import Link from "next/link";

const DoctorMap = dynamic(() => import("./DoctorMap"), { ssr: false });

/* ───── Types ───── */
interface Hospital {
    id: number;
    name: string;
    lat: number;
    lng: number;
    distance: number;
}

interface AIResult {
    urgency: "low" | "medium" | "high" | "critical";
    assessment: string;
    immediate_actions: string[];
    specialist_needed: string;
    should_call_911: boolean;
    search_query: string;
    disclaimer: string;
}

interface RouteInfo {
    distance: number;
    duration: number;
    geometry: any;
}

/* ───── Helpers ───── */
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const urgencyConfig: Record<string, { color: string; bg: string; border: string; label: string }> = {
    critical: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/50", label: "CRITICAL" },
    high: { color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/50", label: "HIGH" },
    medium: { color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/50", label: "MEDIUM" },
    low: { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/50", label: "LOW" },
};

/* ──────────────────────────────────── */
export function PocketDoctor() {
    // Symptoms & vitals
    const [symptoms, setSymptoms] = useState("");
    const [hr, setHr] = useState<number | null>(null);
    const [spo2, setSpo2] = useState<number | null>(null);
    const [vitalsFetched, setVitalsFetched] = useState(false);

    // AI analysis
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiResult, setAiResult] = useState<AIResult | null>(null);
    const [aiError, setAiError] = useState<string | null>(null);
    const [checkedActions, setCheckedActions] = useState<Set<number>>(new Set());

    // Location & hospitals
    const [userLat, setUserLat] = useState<number | null>(null);
    const [userLng, setUserLng] = useState<number | null>(null);
    const [hospitals, setHospitals] = useState<Hospital[]>([]);
    const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "done" | "denied">("idle");
    const [hospitalsLoading, setHospitalsLoading] = useState(false);

    // Routing
    const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
    const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
    const [routeGeo, setRouteGeo] = useState<any | null>(null);

    /* ── Fetch current vitals ── */
    const fetchVitals = useCallback(async () => {
        try {
            const res = await fetch("http://localhost:8000/vitals/current");
            const data = await res.json();
            if (data.heart_rate !== null && data.heart_rate > 0) setHr(data.heart_rate);
            if (data.spo2 !== null && data.spo2 > 0) setSpo2(data.spo2);
            setVitalsFetched(true);
        } catch {
            setVitalsFetched(true);
        }
    }, []);

    useEffect(() => {
        fetchVitals();
    }, [fetchVitals]);

    /* ── Analyze symptoms via Groq ── */
    const parseAIResponse = (text: string) => {
        try {
            let clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
            clean = clean.replace(/'/g, '"');
            return JSON.parse(clean);
        } catch (e) {
            const match = text.match(/\{[\s\S]*\}/);
            if (match) {
                try {
                    return JSON.parse(match[0]);
                } catch {
                    return null;
                }
            }
            return null;
        }
    };

    const analyzeSymptoms = async () => {
        if (!symptoms.trim()) return;
        setIsAnalyzing(true);
        setAiError(null);
        setAiResult(null);

        const systemPrompt = `You are an emergency medical AI assistant for VitalWatch. Respond ONLY in this exact JSON format:
{
  "urgency": "low|medium|high|critical",
  "assessment": "Clear 2-3 sentence medical assessment",
  "immediate_actions": ["Action 1", "Action 2", "Action 3"],
  "specialist_needed": "cardiologist|general physician|emergency|neurologist|pulmonologist",
  "should_call_911": true|false,
  "search_query": "hospital|cardiologist|clinic|neurologist",
  "disclaimer": "This is AI assistance only."
}`;

        const userMessage = `Patient: John Mitchell, Age 72\nHR: ${hr ?? "N/A"} BPM\nSpO2: ${spo2 ?? "N/A"}%\nSymptoms: ${symptoms}`;

        try {
            const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${process.env.NEXT_PUBLIC_GROQ_API_KEY}`,
                },
                body: JSON.stringify({
                    model: "llama-3.1-8b-instant",
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userMessage },
                    ],
                    temperature: 0.3,
                    max_tokens: 500,
                }),
            });

            const data = await res.json();
            const raw = data.choices?.[0]?.message?.content || "";
            const parsed = parseAIResponse(raw);

            if (!parsed) {
                setAiError("Could not analyze symptoms. Please describe them differently.");
                return;
            }

            setAiResult(parsed as AIResult);
            setCheckedActions(new Set());
            findDoctors(parsed.search_query, parsed.urgency);
        } catch (e: any) {
            setAiError("Connection to AI Engine lost. Try again.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    /* ── Doctor finder ── */
    const findDoctors = (searchQuery: string, urgency: string) => {
        setLocationStatus("loading");
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                setUserLat(lat);
                setUserLng(lng);
                setLocationStatus("done");
                setHospitalsLoading(true);

                const isEmergency = urgency === "critical" || searchQuery === "hospital";
                const amenity = isEmergency ? "hospital" : "clinic";
                const radius = isEmergency ? 5000 : 8000;

                try {
                    const overpassQ = `[out:json];node["amenity"="${amenity}"](around:${radius},${lat},${lng});out 8;`;
                    const res = await fetch("https://overpass-api.de/api/interpreter", {
                        method: "POST",
                        headers: { "Content-Type": "application/x-www-form-urlencoded" },
                        body: `data=${encodeURIComponent(overpassQ)}`,
                    });
                    const data = await res.json();

                    const results: Hospital[] = (data.elements || [])
                        .filter((el: any) => el.tags?.name)
                        .map((el: any, i: number) => ({
                            id: el.id || i,
                            name: el.tags.name,
                            lat: el.lat,
                            lng: el.lon,
                            distance: haversine(lat, lng, el.lat, el.lon),
                        }))
                        .sort((a: Hospital, b: Hospital) => a.distance - b.distance)
                        .slice(0, 8);

                    setHospitals(results);
                } catch (e) {
                    console.error("Overpass error:", e);
                } finally {
                    setHospitalsLoading(false);
                }
            },
            () => setLocationStatus("denied"),
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    /* ── Get directions ── */
    const getDirections = async (hospital: Hospital) => {
        if (!userLat || !userLng) return;
        setSelectedHospital(hospital);
        setRouteGeo(null);
        setRouteInfo(null);

        try {
            const res = await fetch(
                `https://router.project-osrm.org/route/v1/driving/${userLng},${userLat};${hospital.lng},${hospital.lat}?overview=full&geometries=geojson`
            );
            const data = await res.json();
            if (data.routes?.[0]) {
                const route = data.routes[0];
                setRouteGeo({ type: "Feature", geometry: route.geometry });
                setRouteInfo({
                    distance: route.distance / 1000,
                    duration: route.duration / 60,
                    geometry: route.geometry,
                });
            }
        } catch (e) { console.error(e); }
    };

    const toggleAction = (idx: number) => {
        setCheckedActions((prev) => {
            const next = new Set(prev);
            if (next.has(idx)) next.delete(idx);
            else next.add(idx);
            return next;
        });
    };

    const uc = aiResult ? urgencyConfig[aiResult.urgency] || urgencyConfig.low : null;

    return (
        <div className="min-h-screen bg-[#070C18] text-white selection:bg-cyan-500/30 relative">
            {/* Animated Background */}
            <div className="fixed inset-0 pointer-events-none opacity-20 bg-gradient-to-br from-indigo-900/10 via-slate-900/10 to-cyan-900/10 animate-gradient" />
            <div className="fixed inset-0 pointer-events-none opacity-20 animate-grid"
                style={{
                    backgroundImage: 'linear-gradient(rgba(17, 24, 39, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(17, 24, 39, 0.4) 1px, transparent 1px)',
                    backgroundSize: '30px 30px'
                }}
            />

            {/* ─── Header ─── */}
            <header className="sticky top-0 z-50 glass border-b border-white/5 px-8 py-6">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link href="/" className="p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all active:scale-95 group">
                            <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-white" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-black tracking-tighter flex items-center gap-3">
                                <span className="bg-gradient-to-br from-cyan-400 to-indigo-500 text-transparent bg-clip-text">Pocket Doctor</span>
                                <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2.5 py-1 rounded-full border border-cyan-400/20 uppercase tracking-widest font-black shadow-[0_0_15px_rgba(34,211,238,0.2)]">AI PRO</span>
                            </h1>
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Intelligent Symptom Diagnostics</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-8 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* ─── Left Column: Input ─── */}
                <div className="lg:col-span-5 space-y-8">
                    <section className="glass-dark border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[50px] rounded-full group-hover:bg-cyan-500/10 transition-colors" />

                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                                    <Activity className="w-5 h-5 text-orange-400" />
                                </div>
                                <h2 className="text-xl font-black tracking-tight">Symptom Checker</h2>
                            </div>

                            {/* Patient Context Card */}
                            <div className="bg-white/5 border border-white/5 rounded-2xl p-5 mb-8 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center border border-white/5">
                                            <User className="w-4 h-4 text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Patient</p>
                                            <p className="text-sm font-bold text-white leading-none">John Mitchell, 72</p>
                                        </div>
                                    </div>
                                    <div className="h-4 w-px bg-white/10" />
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</p>
                                        <p className="text-sm font-black text-emerald-500 flex items-center gap-1.5 justify-end">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            Live Connection
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-2">
                                        <Heart className="w-4 h-4 text-red-500 animate-heartbeat" />
                                        <span className="text-lg font-black text-white">{hr ?? "--"}<span className="text-[10px] ml-1 text-slate-500 uppercase">BPM</span></span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-cyan-400" />
                                        <span className="text-lg font-black text-white">{spo2 ?? "--"}<span className="text-[10px] ml-1 text-slate-500 uppercase">%</span></span>
                                    </div>
                                </div>
                            </div>

                            <div className="relative group">
                                <textarea
                                    value={symptoms}
                                    onChange={(e) => setSymptoms(e.target.value)}
                                    placeholder="Describe current symptoms... e.g. acute chest tightness, radiates to arm"
                                    className="w-full h-48 bg-slate-900/50 border-2 border-white/5 rounded-3xl p-6 text-white placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500/40 resize-none text-lg font-medium transition-all shadow-inner"
                                />
                                <div className="absolute bottom-4 right-4 text-slate-700 font-black text-[10px] uppercase tracking-widest">
                                    Natural Language Mode
                                </div>
                            </div>

                            <button
                                onClick={analyzeSymptoms}
                                disabled={isAnalyzing || !symptoms.trim()}
                                className={cn(
                                    "mt-8 w-full py-5 rounded-3xl font-black uppercase tracking-[0.2em] text-sm transition-all duration-300 flex items-center justify-center gap-3 relative overflow-hidden group",
                                    isAnalyzing
                                        ? "bg-slate-800 text-slate-500 cursor-wait"
                                        : "bg-gradient-to-r from-cyan-600 to-indigo-700 hover:from-cyan-500 hover:to-indigo-600 text-white shadow-[0_20px_40px_-5px_rgba(34,211,238,0.3)] hover:scale-[1.02] active:scale-95 animate-pulse-glow"
                                )}
                            >
                                {isAnalyzing ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Consulting Neural Core...
                                    </>
                                ) : (
                                    <><Search className="w-5 h-5" /> Run Diagnostics</>
                                )}
                            </button>

                            {aiError && (
                                <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-300 text-xs font-bold text-center leading-relaxed">
                                    {aiError}
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                {/* ─── Right Column: Results & Map ─── */}
                <div className="lg:col-span-7 space-y-8">
                    {!aiResult && !isAnalyzing ? (
                        <div className="h-full min-h-[600px] glass-dark border-2 border-dashed border-white/10 rounded-[3rem] flex flex-col items-center justify-center text-center p-12 group transition-all hover:border-cyan-500/20">
                            <div className="w-24 h-24 rounded-full bg-slate-800/50 flex items-center justify-center mb-8 border border-white/5 shadow-xl group-hover:scale-110 transition-transform">
                                <Stethoscope className="w-10 h-10 text-slate-600 group-hover:text-cyan-500 transition-colors" />
                            </div>
                            <h3 className="text-2xl font-black text-white tracking-widest uppercase mb-4">Diagnostics Pending</h3>
                            <p className="text-slate-500 font-bold text-sm max-w-[300px] leading-relaxed">
                                Enter symptoms to generate AI-powered medical assessment and local hospital routing.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-slide-right">
                            {aiResult && uc && (
                                <>
                                    {/* Urgency Card */}
                                    <div className={cn(
                                        "p-8 rounded-[2.5rem] border-2 flex items-center gap-6 relative overflow-hidden transition-all duration-700",
                                        uc.bg, uc.border, aiResult.urgency === "critical" ? "animate-pulse shadow-[0_0_50px_rgba(239,68,68,0.3)]" : "shadow-2xl"
                                    )}>
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-[50px] rounded-full translate-x-1/2 -translate-y-1/2" />
                                        <div className={cn("p-5 rounded-3xl transition-all duration-500", uc.bg, "border border-white/10 shadow-xl")}>
                                            <ShieldAlert className={cn("w-10 h-10", uc.color)} />
                                        </div>
                                        <div>
                                            <div className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] mb-1">Triage urgency</div>
                                            <div className={cn("text-4xl font-black tracking-tighter", uc.color)}>{uc.label}</div>
                                        </div>
                                        {aiResult.should_call_911 && (
                                            <Link href="tel:911" className="ml-auto">
                                                <button className="px-8 py-4 bg-red-600 hover:bg-red-500 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl animate-pulse border-2 border-red-400">
                                                    Call 911
                                                </button>
                                            </Link>
                                        )}
                                    </div>

                                    {/* Assessment & Actions */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="glass-dark border border-white/5 rounded-[2.5rem] p-8 shadow-xl">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                                                    <Sparkles className="w-4 h-4 text-cyan-400" />
                                                </div>
                                                <h3 className="text-sm font-black uppercase tracking-widest">Medical Insight</h3>
                                            </div>
                                            <p className="text-white font-bold text-lg leading-relaxed italic opacity-90">&quot;{aiResult.assessment}&quot;</p>
                                        </div>

                                        <div className="glass-dark border border-white/5 rounded-[2.5rem] p-8 shadow-xl">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                                                    <Clock className="w-4 h-4 text-orange-400" />
                                                </div>
                                                <h3 className="text-sm font-black uppercase tracking-widest">Immediate Steps</h3>
                                            </div>
                                            <div className="space-y-4">
                                                {aiResult.immediate_actions.map((action, i) => (
                                                    <div
                                                        key={i}
                                                        onClick={() => toggleAction(i)}
                                                        className={cn(
                                                            "flex items-center gap-3 cursor-pointer group transition-all duration-300",
                                                            checkedActions.has(i) ? "opacity-40" : "opacity-100"
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                                                            checkedActions.has(i) ? "bg-emerald-500 border-emerald-500" : "border-slate-700 bg-slate-900 group-hover:border-white/20"
                                                        )}>
                                                            {checkedActions.has(i) && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                                        </div>
                                                        <span className={cn("text-xs font-bold tracking-tight", checkedActions.has(i) ? "line-through" : "text-slate-200")}>{action}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Location Finder */}
                            {(locationStatus === "loading" || hospitalsLoading) ? (
                                <div className="h-64 glass-dark rounded-[2.5rem] flex flex-col items-center justify-center border border-white/5">
                                    <MapPin className="w-8 h-8 text-cyan-500 animate-bounce mb-4" />
                                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">Mapping Medical Facilities...</p>
                                </div>
                            ) : hospitals.length > 0 && (
                                <section className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-xl font-black tracking-tight flex items-center gap-3">
                                            <MapPin className="w-5 h-5 text-red-500" />
                                            Network Facilities
                                        </h2>
                                        <span className="text-[10px] font-black bg-white/5 px-3 py-1 rounded-full border border-white/5 text-slate-500 uppercase tracking-widest">
                                            {hospitals.length} result found
                                        </span>
                                    </div>

                                    <div className="rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl h-[400px]">
                                        <DoctorMap
                                            userLat={userLat!}
                                            userLng={userLng!}
                                            hospitals={hospitals}
                                            selectedHospital={selectedHospital}
                                            routeGeo={routeGeo}
                                            onSelectHospital={(h) => getDirections(h)}
                                        />
                                    </div>

                                    {/* Hospital Cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {hospitals.map((h) => (
                                            <div
                                                key={h.id}
                                                onClick={() => getDirections(h)}
                                                className={cn(
                                                    "glass p-6 rounded-3xl transition-all duration-300 cursor-pointer border relative overflow-hidden group",
                                                    selectedHospital?.id === h.id ? "bg-cyan-500/10 border-cyan-500/40 ring-1 ring-cyan-500/20" : "hover:bg-white/5 border-white/5"
                                                )}
                                            >
                                                <div className="flex justify-between items-start mb-4">
                                                    <h4 className="font-black text-white text-sm tracking-tight leading-none group-hover:text-cyan-400 transition-colors">{h.name}</h4>
                                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest bg-black/20 px-2.5 py-1 rounded-lg border border-white/5 shadow-inner">
                                                        {h.distance.toFixed(1)} km
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-widest">Open Now</span>
                                                    <ChevronRight className={cn("w-4 h-4 text-slate-600 transition-all duration-300", selectedHospital?.id === h.id ? "translate-x-1 text-cyan-400" : "group-hover:translate-x-1 group-hover:text-white")} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {routeInfo && selectedHospital && (
                                        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-lg px-8 z-50 animate-slide-down">
                                            <div className="bg-[#070C18]/90 backdrop-blur-2xl border-2 border-cyan-500/30 p-6 rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] flex items-center justify-between gap-6">
                                                <div className="flex-1">
                                                    <h4 className="text-sm font-black text-white mb-1 leading-none">{selectedHospital.name}</h4>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">{routeInfo.distance.toFixed(1)} km Away</span>
                                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">•</span>
                                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">{Math.ceil(routeInfo.duration)} Mins Drive</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <a
                                                        href={`https://www.google.com/maps/dir/${userLat},${userLng}/${selectedHospital.lat},${selectedHospital.lng}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-lg transition-all"
                                                    >
                                                        Navigate
                                                    </a>
                                                    <button onClick={() => setSelectedHospital(null)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-colors">
                                                        <X className="w-5 h-5 text-slate-500" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </section>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
