import { AlertOctagon, RotateCcw, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface DemoControlPanelProps {
  onTriggerAnomaly: () => Promise<void> | void;
  onReset: () => void;
  isCritical: boolean;
}

export function DemoControlPanel({ onTriggerAnomaly, onReset, isCritical }: DemoControlPanelProps) {
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleTrigger = async () => {
    try {
      if (onTriggerAnomaly) await onTriggerAnomaly();
    } catch (e) {
      setToastMsg("Retrying...");
      setTimeout(async () => {
        try {
          if (onTriggerAnomaly) await onTriggerAnomaly();
          setToastMsg(null);
        } catch (e2) {
          setToastMsg("System unreachable");
          setTimeout(() => setToastMsg(null), 3000);
        }
      }, 1500);
    }
  };

  return (
    <div className={cn(
      "bg-clinical-card border p-6 rounded-2xl transition-colors duration-300 relative",
      isCritical ? "border-clinical-critical bg-red-950/20" : "border-clinical-border"
    )}>
      <h3 className="text-xl font-bold text-white mb-6">Demo Controls</h3>

      {toastMsg && (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-amber-500 text-amber-950 px-4 py-2 rounded-lg font-black uppercase tracking-widest text-sm shadow-xl flex items-center gap-2 animate-bounce z-50">
          <Loader2 className="w-4 h-4 animate-spin" />
          {toastMsg}
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={handleTrigger}
          className="flex-1 bg-red-600 hover:bg-red-500 text-white font-extrabold py-5 px-6 rounded-2xl transition-all duration-300 min-w-[250px] text-base uppercase tracking-widest shadow-[0_0_30px_rgba(239,68,68,0.4)] hover:shadow-[0_0_50px_rgba(239,68,68,0.8)] flex items-center justify-center gap-3 animate-pulse-fast border-2 border-red-400"
        >
          <AlertTriangle className="w-6 h-6" />
          TRIGGER CRITICAL ANOMALY
        </button>
        <button
          onClick={onReset}
          className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-colors"
        >
          <RotateCcw className="w-5 h-5" />
          RESET TO NORMAL
        </button>
      </div>
      {isCritical && (
        <p className="text-clinical-critical mt-4 text-sm font-medium animate-pulse">
          Anomaly injected. System is responding...
        </p>
      )}
    </div>
  );
}
