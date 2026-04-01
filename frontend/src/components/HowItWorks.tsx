import { Activity, BrainCircuit, Bot, BellRing, ArrowRight } from "lucide-react";

export function HowItWorks() {
    const steps = [
        {
            id: 1,
            icon: <Activity className="w-8 h-8 text-emerald-400" />,
            title: "Vitals Monitored",
            desc: "Continuous sensor data tracking of Heart Rate and SpO2.",
            color: "border-emerald-500/30 bg-emerald-950/20"
        },
        {
            id: 2,
            icon: <BrainCircuit className="w-8 h-8 text-cyan-400" />,
            title: "AI Detects Anomaly",
            desc: "Isolation Forest ML model flags critical deviations.",
            color: "border-cyan-500/30 bg-cyan-950/20"
        },
        {
            id: 3,
            icon: <Bot className="w-8 h-8 text-indigo-400" />,
            title: "Agent Reasons",
            desc: "Groq LLaMA autonomously evaluates clinical risk.",
            color: "border-indigo-500/30 bg-indigo-950/20"
        },
        {
            id: 4,
            icon: <BellRing className="w-8 h-8 text-red-500" />,
            title: "Alert Sent",
            desc: "Instant multi-channel push notification is fired.",
            color: "border-red-500/30 bg-red-950/20"
        }
    ];

    return (
        <div className="w-full mt-12 mb-8 pt-10 border-t border-slate-800/80">
            <div className="text-center mb-10">
                <h2 className="text-2xl font-black text-white tracking-tight">How VitalWatch Works</h2>
                <p className="text-slate-400 text-[10px] mt-2 font-bold tracking-[0.2em] uppercase">The Autonomous Triage Pipeline</p>
            </div>

            <div className="flex flex-col md:flex-row items-stretch justify-between gap-4 md:gap-2">
                {steps.map((step, index) => (
                    <div key={step.id} className="flex flex-col md:flex-row items-center flex-1 w-full relative group">
                        <div className={`flex flex-col items-center justify-center p-6 rounded-3xl border transition-all duration-500 w-full h-full text-center hover:shadow-[0_0_40px_rgba(255,255,255,0.03)] ${step.color} hover:-translate-y-2 backdrop-blur-sm z-10`}>
                            <div className="bg-slate-900/60 p-4 rounded-2xl mb-5 shadow-lg border border-slate-700/50 group-hover:scale-110 transition-transform duration-500">
                                {step.icon}
                            </div>
                            <h3 className="text-[15px] font-black text-white mb-2 tracking-tight uppercase">{step.title}</h3>
                            <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-[200px]">{step.desc}</p>
                        </div>

                        {/* Desktop Connecting Arrow */}
                        {index < steps.length - 1 && (
                            <div className="hidden md:flex shrink-0 px-2 z-0 opacity-30 group-hover:opacity-100 transition-opacity duration-500">
                                <ArrowRight className="w-8 h-8 text-slate-500" />
                            </div>
                        )}

                        {/* Mobile Connecting Arrow */}
                        {index < steps.length - 1 && (
                            <div className="flex md:hidden shrink-0 py-4 opacity-30 group-hover:opacity-100 transition-opacity duration-500">
                                <ArrowRight className="w-6 h-6 text-slate-500 rotate-90" />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
