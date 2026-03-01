"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = [
  "#10b981", "#3b82f6", "#f59e0b", "#ef4444",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316",
];

interface CategoryPieChartProps {
  data: Record<string, number>;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { fill: string } }> }) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div className="bg-surface-900 text-white rounded-xl px-4 py-3 shadow-elevated text-sm">
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.payload.fill }} />
        <span className="font-semibold">{entry.name}</span>
      </div>
      <p className="text-surface-300 text-xs mt-1">${entry.value.toFixed(2)}</p>
    </div>
  );
}

export function CategoryPieChart({ data }: CategoryPieChartProps) {
  const chartData = Object.entries(data)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="card p-6">
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-surface-900">Spending by Category</h3>
        <p className="text-xs text-surface-400 mt-0.5">Distribution of expenses</p>
      </div>

      <div className="flex items-center gap-6">
        <div className="w-[180px] h-[180px] flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {chartData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-2 min-w-0">
          {chartData.slice(0, 5).map((item, index) => {
            const pct = total > 0 ? ((item.value / total) * 100).toFixed(0) : "0";
            return (
              <div key={item.name} className="flex items-center gap-2.5">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-xs text-surface-600 truncate flex-1">{item.name}</span>
                <span className="text-xs font-semibold text-surface-800 tabular-nums">{pct}%</span>
              </div>
            );
          })}
          {chartData.length > 5 && (
            <p className="text-[11px] text-surface-400 pl-4">+{chartData.length - 5} more</p>
          )}
        </div>
      </div>
    </div>
  );
}
