import React from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { cn } from "@/lib/utils";

interface VitalsChartProps {
    data: any[];
    metric: 'heart_rate' | 'spo2';
    title: string;
}

export function VitalsChart({ data, metric, title }: VitalsChartProps) {
    const isHR = metric === 'heart_rate';
    const color = isHR ? '#EF4444' : '#06B6D4';
    const gradientId = `gradient-${metric}`;

    // Filter points for this metric
    const chartData = data.map(d => ({
        time: new Date(d.timestamp).toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' }),
        val: d[metric]
    })).filter(d => d.val !== null);

    return (
        <div className="glass-dark border border-slate-800/50 rounded-[2.5rem] p-8 h-[340px] transition-all duration-500 hover:border-slate-700/50 relative overflow-hidden group">
            {/* Corner Decorative Element */}
            <div className={cn(
                "absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-20 transition-all duration-1000",
                isHR ? "bg-red-500/30" : "bg-cyan-500/30"
            )} />

            <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "w-2 h-8 rounded-full transition-all duration-500",
                        isHR ? "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]" : "bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]"
                    )} />
                    <div>
                        <h3 className="text-xl font-black text-white tracking-tight leading-none mb-1">{title}</h3>
                        <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Real-time Stream • 60s window</p>
                    </div>
                </div>
                {chartData.length > 0 && (
                    <div className="text-right">
                        <span className="text-slate-500 font-black text-[10px] uppercase tracking-widest block mb-1">Current</span>
                        <span className={cn("text-2xl font-black tracking-tighter", isHR ? "text-red-500" : "text-cyan-500")}>
                            {chartData[chartData.length - 1].val}
                            <span className="text-xs ml-1 opacity-50">{isHR ? 'BPM' : '%'}</span>
                        </span>
                    </div>
                )}
            </div>

            <div className="h-[220px] w-full relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="rgba(255,255,255,0.05)"
                        />
                        <XAxis
                            dataKey="time"
                            tick={{ fill: 'rgba(148,163,184,0.5)', fontSize: 9, fontWeight: 700, fontFamily: 'monospace', textAnchor: 'middle' }}
                            tickLine={false}
                            axisLine={false}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            domain={isHR ? [40, 180] : [85, 100]}
                            tick={{ fill: 'rgba(148,163,184,0.5)', fontSize: 9, fontWeight: 700, fontFamily: 'monospace' }}
                            tickLine={false}
                            axisLine={false}
                            width={32}
                            tickFormatter={(v) => isHR ? `${v}` : `${v}%`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#0A1628',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                            }}
                            itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                            labelStyle={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 'bold' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="val"
                            stroke={color}
                            strokeWidth={4}
                            fillOpacity={1}
                            fill={`url(#${gradientId})`}
                            animationDuration={1000}
                            isAnimationActive={true}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
