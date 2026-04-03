import { Activity, BrainCircuit, Bot, BellRing, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function HowItWorks() {
    const steps = [
        {
            id: 1,
            icon: <Activity className="w-8 h-8 text-cyan-400" />,
            title: "Vitals Monitored",
            desc: "Continuous high-fidelity tracking of Cardiac Rhythms and SpO2.",
            color: "border-cyan-500/20 bg-cyan-500/[0.02]"
        },
        {
            id: 2,
            icon: <BrainCircuit className="w-8 h-8 text-indigo-400" />,
            title: "Anomaly Detection",
            desc: "Isolation Forest ML engine identifies critical deviations.",
            color: "border-indigo-500/20 bg-indigo-500/[0.02]"
        },
        {
            id: 3,
            icon: <Bot className="w-8 h-8 text-purple-400" />,
            title: "Neural Reasoning",
            desc: "Groq LLaMA models autonomously evaluate patient risk.",
            color: "border-purple-500/20 bg-purple-500/[0.02]"
        },
        {
            id: 4,
            icon: <BellRing className="w-8 h-8 text-red-500" />,
            title: "Multi-Channel Alert",
            desc: "Instant dispatch via WhatsApp and Clinical Dashboard.",
            color: "border-red-500/20 bg-red-500/[0.02]"
        }
    ];

    return (
        <div className="w-full mt-24 mb-12 pt-16 border-t border-white/5">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-black text-white tracking-widest uppercase">The VitalWatch Pipeline</h2>
                <div className="flex items-center justify-center gap-4 mt-4">
                    <div className="h-px w-12 bg-gradient-to-r from-transparent to-cyan-500" />
                    <p className="text-slate-500 text-[10px] font-black tracking-[0.4em] uppercase">Autonomous Triage Architecture</p>
                    <div className="h-px w-12 bg-gradient-to-l from-transparent to-cyan-500" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {steps.map((step, index) => (
                    <div key={step.id} className="relative group">
                        <div className={cn(
                            "flex flex-col items-center justify-center p-8 rounded-[2.5rem] border transition-all duration-500 text-center hover:scale-[1.02] backdrop-blur-md z-10 h-full",
                            step.color
                        )}>
                            <div className="bg-slate-900/80 p-5 rounded-2xl mb-6 shadow-xl border border-white/5 group-hover:scale-110 transition-transform duration-500">
                                {step.icon}
                            </div>
                            <h3 className="text-sm font-black text-white mb-3 tracking-widest uppercase">{step.title}</h3>
                            <p className="text-[11px] text-slate-500 font-bold leading-relaxed max-w-[180px]">{step.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
