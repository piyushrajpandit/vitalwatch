import { useState, useEffect } from "react";
import { Camera, CheckCircle2 } from "lucide-react";

interface FaceScanProps {
    onScanComplete: (hr: number) => void;
}

export function FaceScan({ onScanComplete }: FaceScanProps) {
    const [isScanning, setIsScanning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<number | null>(null);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isScanning && progress < 100) {
            interval = setInterval(() => {
                setProgress(p => {
                    if (p >= 100) {
                        clearInterval(interval);
                        return 100;
                    }
                    return p + (100 / 30); // 30 seconds total (1 tick per second)
                });
            }, 1000);
        } else if (isScanning && progress >= 100) {
            // Complete
            setIsScanning(false);
            fetch("http://localhost:8000/rppg/start")
                .then(res => res.json())
                .then(data => {
                    setResult(data.heart_rate);
                    onScanComplete(data.heart_rate);
                })
                .catch(console.error);
        }
        return () => clearInterval(interval);
    }, [isScanning, progress]);

    const startScan = () => {
        setIsScanning(true);
        setProgress(0);
        setResult(null);
    };

    const strokeDasharray = 2 * Math.PI * 45; // r=45
    const strokeDashoffset = strokeDasharray - (progress / 100) * strokeDasharray;

    return (
        <div className="bg-clinical-card border border-clinical-border rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden h-full min-h-[220px]">
            <h3 className="text-lg font-bold text-slate-200 mb-6 absolute top-6 left-6">rPPG Face Scan</h3>

            {!isScanning && result === null ? (
                <button
                    onClick={startScan}
                    className="bg-slate-800 hover:bg-slate-700 text-white rounded-full w-32 h-32 flex flex-col items-center justify-center gap-2 transition-transform hover:scale-105"
                >
                    <Camera className="w-8 h-8 text-slate-400" />
                    <span className="font-semibold text-sm text-slate-300">Start Scan</span>
                </button>
            ) : isScanning ? (
                <div className="relative w-32 h-32 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90 absolute inset-0">
                        <circle cx="64" cy="64" r="45" className="stroke-slate-800" strokeWidth="8" fill="none" />
                        <circle
                            cx="64" cy="64" r="45"
                            className="stroke-clinical-normal transition-all duration-1000 ease-linear"
                            strokeWidth="8" fill="none"
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="text-2xl font-bold text-white z-10">{Math.floor(30 - (progress / 100) * 30)}s</div>
                </div>
            ) : (
                <div className="flex flex-col items-center animate-slide-down">
                    <CheckCircle2 className="w-16 h-16 text-clinical-normal mb-3" />
                    <div className="text-4xl font-bold text-white mb-1">{result} <span className="text-lg text-slate-400">BPM</span></div>
                    <p className="text-sm text-clinical-normal font-medium">Scan Complete</p>
                    <button onClick={startScan} className="mt-4 text-xs tracking-wider text-slate-400 hover:text-white uppercase font-semibold">Rescan</button>
                </div>
            )}
        </div>
    );
}
