import { AlertOctagon, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface DemoControlPanelProps {
  onTriggerAnomaly: () => void;
  onReset: () => void;
  isCritical: boolean;
}

export function DemoControlPanel({ onTriggerAnomaly, onReset, isCritical }: DemoControlPanelProps) {
  return (
    <div className={cn(
      "bg-clinical-card border p-6 rounded-2xl transition-colors duration-300",
      isCritical ? "border-clinical-critical bg-red-950/20" : "border-clinical-border"
    )}>
      <h3 className="text-xl font-bold text-white mb-6">Demo Controls</h3>
      <div className="flex gap-4">
        <button
          onClick={onTriggerAnomaly}
          className="flex-1 bg-clinical-critical hover:bg-red-600 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-colors shadow-lg shadow-red-500/20"
        >
          <AlertOctagon className="w-6 h-6" />
          TRIGGER ANOMALY
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
