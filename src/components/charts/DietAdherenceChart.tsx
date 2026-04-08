"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DietDataPoint {
  date: string;
  calories: number;
  hydration: number;
  adherence: number;
}

interface DietAdherenceChartProps {
  data: {
    avgCalories: number;
    avgHydration: number;
    avgAdherence: number;
    data: DietDataPoint[];
  };
  compact?: boolean;
}

const COLORS = {
  primary: "#0891B2",
  secondary: "#10B981",
  accent: "#F59E0B",
};

export function DietAdherenceChart({
  data,
  compact = false,
}: DietAdherenceChartProps) {
  const chartData = data.data || [];

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-zinc-500">
        No diet data available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      {!compact && (
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="bg-zinc-800/50 rounded-lg p-3">
            <p className="text-zinc-400 text-xs">Avg Calories</p>
            <p className="text-lg font-semibold" style={{ color: COLORS.accent }}>
              {data.avgCalories}
            </p>
          </div>
          <div className="bg-zinc-800/50 rounded-lg p-3">
            <p className="text-zinc-400 text-xs">Hydration</p>
            <p
              className="text-lg font-semibold"
              style={{ color: COLORS.secondary }}
            >
              {data.avgHydration}ml
            </p>
          </div>
          <div className="bg-zinc-800/50 rounded-lg p-3">
            <p className="text-zinc-400 text-xs">Adherence</p>
            <p className="text-lg font-semibold text-zinc-200">
              {data.avgAdherence}%
            </p>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className={compact ? "h-40" : "h-56"}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="caloriesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.accent} stopOpacity={0.3} />
                <stop offset="95%" stopColor={COLORS.accent} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="hydrationGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.secondary} stopOpacity={0.3} />
                <stop offset="95%" stopColor={COLORS.secondary} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis
              dataKey="date"
              tick={{ fill: "#71717a", fontSize: 10 }}
              tickFormatter={(value) => value.slice(5)}
              stroke="#3f3f46"
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: "#71717a", fontSize: 11 }}
              stroke="#3f3f46"
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: "#71717a", fontSize: 11 }}
              stroke="#3f3f46"
              tickFormatter={(value) => `${value / 10}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                border: "1px solid #27272a",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "#ededed" }}
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="calories"
              stroke={COLORS.accent}
              fillOpacity={1}
              fill="url(#caloriesGradient)"
              name="Calories"
            />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="hydration"
              stroke={COLORS.secondary}
              fillOpacity={1}
              fill="url(#hydrationGradient)"
              name="Hydration (ml/10)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs justify-center">
        <div className="flex items-center gap-1">
          <div
            className="w-3 h-3 rounded"
            style={{ backgroundColor: COLORS.accent }}
          />
          <span className="text-zinc-400">Calories</span>
        </div>
        <div className="flex items-center gap-1">
          <div
            className="w-3 h-3 rounded"
            style={{ backgroundColor: COLORS.secondary }}
          />
          <span className="text-zinc-400">Hydration (ml/10)</span>
        </div>
      </div>
    </div>
  );
}
