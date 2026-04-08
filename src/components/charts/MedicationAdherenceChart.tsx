"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface MedicationDataPoint {
  date: string;
  taken: number;
  total: number;
  adherence: number;
}

interface MedicationAdherenceChartProps {
  data: {
    adherencePercent: number;
    totalDoses: number;
    takenDoses: number;
    missedDoses: number;
    data: MedicationDataPoint[];
  };
  compact?: boolean;
}

const COLORS = {
  primary: "#0891B2",
  secondary: "#10B981",
  accent: "#F59E0B",
  danger: "#EF4444",
};

export function MedicationAdherenceChart({
  data,
  compact = false,
}: MedicationAdherenceChartProps) {
  const chartData = data.data || [];

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-zinc-500">
        No medication data available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      {!compact && (
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="bg-zinc-800/50 rounded-lg p-3">
            <p className="text-zinc-400 text-xs">Adherence</p>
            <p
              className="text-lg font-semibold"
              style={{
                color:
                  data.adherencePercent >= 90
                    ? COLORS.secondary
                    : data.adherencePercent >= 70
                    ? COLORS.accent
                    : COLORS.danger,
              }}
            >
              {data.adherencePercent}%
            </p>
          </div>
          <div className="bg-zinc-800/50 rounded-lg p-3">
            <p className="text-zinc-400 text-xs">Taken</p>
            <p className="text-lg font-semibold text-zinc-200">
              {data.takenDoses}/{data.totalDoses}
            </p>
          </div>
          <div className="bg-zinc-800/50 rounded-lg p-3">
            <p className="text-zinc-400 text-xs">Missed</p>
            <p className="text-lg font-semibold" style={{ color: COLORS.danger }}>
              {data.missedDoses}
            </p>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className={compact ? "h-56 w-full min-w-0" : "h-56 w-full min-w-0"}>
        <ResponsiveContainer
          width="100%"
          height="100%"
          minWidth={0}
          minHeight={compact ? 224 : 224}
        >
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis
              dataKey="date"
              tick={{ fill: "#71717a", fontSize: 10 }}
              tickFormatter={(value) => value.slice(5)}
              stroke="#3f3f46"
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: "#71717a", fontSize: 11 }}
              stroke="#3f3f46"
              unit="%"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                border: "1px solid #27272a",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "#ededed" }}
              formatter={(value) => [`${value}%`, "Adherence"]}
            />
            <Bar
              dataKey="adherence"
              fill={COLORS.primary}
              radius={[4, 4, 0, 0]}
              name="Adherence %"
            />
            <ReferenceLine
              y={90}
              stroke={COLORS.secondary}
              strokeDasharray="3 3"
              strokeOpacity={0.5}
              label={{
                value: "Target",
                fill: COLORS.secondary,
                fontSize: 10,
                position: "insideBottomRight",
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div
            className="w-3 h-3 rounded"
            style={{ backgroundColor: COLORS.primary }}
          />
          <span className="text-zinc-400">Daily Adherence</span>
        </div>
        <div className="flex items-center gap-1">
          <div
            className="w-3 h-3 rounded"
            style={{ backgroundColor: COLORS.secondary }}
          />
          <span className="text-zinc-400">Target (90%)</span>
        </div>
      </div>
    </div>
  );
}
