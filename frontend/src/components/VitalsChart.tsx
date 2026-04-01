import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';

interface DataPoint {
    timestamp: string;
    heart_rate: number;
    spo2: number;
    anomaly_status: "normal" | "warning" | "critical" | "none";
}

interface VitalsChartProps {
    data: DataPoint[];
    metric: "heart_rate" | "spo2";
    title: string;
}

export function VitalsChart({ data, metric, title }: VitalsChartProps) {
    const isHeartRate = metric === "heart_rate";
    const domain = isHeartRate ? [40, 180] : [80, 100];
    const unit = isHeartRate ? "BPM" : "%";

    // Color the line based on the latest point status
    const latestStatus = data.length > 0 ? data[data.length - 1].anomaly_status : "normal";
    const isWaiting = latestStatus === "none";
    const lineColor = latestStatus === "critical" ? "#EF4444" : latestStatus === "warning" ? "#F59E0B" : isWaiting ? "#475569" : "#10B981";

    return (
        <div className="bg-clinical-card border border-clinical-border rounded-2xl p-6 h-72 flex flex-col relative overflow-hidden">
            <div className="flex justify-between items-center mb-4 z-10 relative">
                <h3 className="text-lg font-semibold text-slate-300">{title}</h3>
                {data.length > 0 && !isWaiting && (
                    <div className="flex items-end gap-1">
                        <span className="text-3xl font-bold" style={{ color: lineColor }}>
                            {data[data.length - 1][metric].toFixed(1)}
                        </span>
                        <span className="text-slate-400 font-medium pb-1">{unit}</span>
                    </div>
                )}
            </div>

            {isWaiting && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0A1128]/80 backdrop-blur-sm">
                    <span className="text-emerald-500 font-bold mb-2 animate-bounce">📡</span>
                    <span className="text-slate-400 font-bold tracking-widest text-xs uppercase">Waiting for scanner input...</span>
                </div>
            )}

            <div className="flex-1 w-full relative z-0">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#172A46" vertical={false} />
                        <XAxis dataKey="timestamp" hide />
                        <YAxis domain={domain} stroke="#475569" fontSize={12} tickLine={false} axisLine={false} width={30} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0A1628', borderColor: '#172A46', color: '#fff' }}
                            itemStyle={{ color: lineColor }}
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            formatter={(value: any) => [`${value} ${unit}`, isHeartRate ? 'Heart Rate' : 'SpO2']}
                            labelFormatter={() => ''}
                        />
                        <Line
                            type="monotone"
                            dataKey={metric}
                            stroke={lineColor}
                            strokeWidth={3}
                            dot={false}
                            activeDot={{ r: 6, fill: lineColor, stroke: '#0A1628', strokeWidth: 2 }}
                            isAnimationActive={false}
                            style={{ transition: 'stroke 0.8s ease-in-out' }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
