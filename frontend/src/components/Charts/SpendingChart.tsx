"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { MonthlyTrend } from "@/types";

interface SpendingChartProps {
  data: MonthlyTrend[];
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload) return null;
  return (
    <div className="bg-surface-900 text-white rounded-xl px-4 py-3 shadow-elevated text-sm">
      <p className="font-semibold mb-1.5">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-surface-300">{entry.name}:</span>
          <span className="font-semibold">${entry.value.toFixed(0)}</span>
        </div>
      ))}
    </div>
  );
}

export function SpendingChart({ data }: SpendingChartProps) {
  const hasData = data.length > 0;

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold text-surface-900">Income vs Expenses</h3>
          <p className="text-xs text-surface-400 mt-0.5">Monthly comparison</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-brand-500" />
            <span className="text-surface-500 font-medium">Income</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-red-400" />
            <span className="text-surface-500 font-medium">Expenses</span>
          </div>
        </div>
      </div>

      {hasData ? (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 0, right: 0, left: -10, bottom: 0 }} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${v}`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.02)", radius: 8 }} />
            <Bar dataKey="income" fill="#10b981" name="Income" radius={[6, 6, 0, 0]} maxBarSize={32} />
            <Bar dataKey="expenses" fill="#f87171" name="Expenses" radius={[6, 6, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[280px] flex flex-col items-center justify-center text-surface-400">
          <BarChart3Icon />
          <p className="text-sm font-medium mt-3">No data yet</p>
          <p className="text-xs mt-1">Add transactions to see your trends</p>
        </div>
      )}
    </div>
  );
}

function BarChart3Icon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-surface-300">
      <path d="M3 3v18h18" />
      <path d="M7 16V8" />
      <path d="M11 16V4" />
      <path d="M15 16v-5" />
      <path d="M19 16v-2" />
    </svg>
  );
}
