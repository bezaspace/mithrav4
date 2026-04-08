"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface PhysioDataPoint {
  date: string;
  mobility_score: number;
  pain_level: number;
  duration_minutes: number;
  exercises_completed: number;
  exercises_total: number;
  session_type: string;
  notes: string;
}

interface PhysiotherapyChartProps {
  data: {
    data: PhysioDataPoint[];
    summary?: {
      avgMobilityScore: number;
      avgPainLevel: number;
      totalSessions: number;
      totalHours: number;
      trend: string;
    };
  };
  highlightMetric?: string;
  compact?: boolean;
}

const COLORS = {
  primary: "#0891B2",
  secondary: "#10B981",
  accent: "#F59E0B",
  danger: "#EF4444",
  purple: "#8B5CF6",
  pink: "#EC4899",
};

export function PhysiotherapyChart({
  data,
  highlightMetric = "all",
  compact = false,
}: PhysiotherapyChartProps) {
  const chartData = data.data || [];

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-zinc-500">
        No physiotherapy data available
      </div>
    );
  }

  // Format data for chart
  const formattedData = chartData.map((item) => ({
    ...item,
    dateShort: item.date.slice(5), // MM-DD format
    mobilityScore: item.mobility_score,
    painLevel: item.pain_level,
    exerciseRate: Math.round(
      (item.exercises_completed / Math.max(item.exercises_total, 1)) * 100
    ),
  }));

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      {data.summary && !compact && (
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-zinc-800/50 rounded-lg p-3">
            <p className="text-zinc-400 text-xs">Avg Mobility</p>
            <p className="text-lg font-semibold" style={{ color: COLORS.purple }}>
              {data.summary.avgMobilityScore}/100
            </p>
          </div>
          <div className="bg-zinc-800/50 rounded-lg p-3">
            <p className="text-zinc-400 text-xs">Avg Pain Level</p>
            <p className="text-lg font-semibold" style={{ color: COLORS.danger }}>
              {data.summary.avgPainLevel}/10
            </p>
          </div>
          <div className="bg-zinc-800/50 rounded-lg p-3">
            <p className="text-zinc-400 text-xs">Total Sessions</p>
            <p className="text-lg font-semibold text-zinc-200">
              {data.summary.totalSessions}
            </p>
          </div>
          <div className="bg-zinc-800/50 rounded-lg p-3">
            <p className="text-zinc-400 text-xs">Trend</p>
            <p className={`text-lg font-semibold ${
              data.summary.trend === "improving"
                ? "text-green-400"
                : data.summary.trend === "stable"
                ? "text-yellow-400"
                : "text-red-400"
            }`}>
              {data.summary.trend === "improving"
                ? "↗ Improving"
                : data.summary.trend === "stable"
                ? "→ Stable"
                : "↘ Declining"}
            </p>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className={compact ? "h-64 w-full min-w-0" : "h-64 w-full min-w-0"}>
        <ResponsiveContainer
          width="100%"
          height="100%"
          minWidth={0}
          minHeight={compact ? 256 : 256}
        >
          <LineChart data={formattedData}>
            <defs>
              <linearGradient id="mobilityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.purple} stopOpacity={0.3} />
                <stop offset="95%" stopColor={COLORS.purple} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis
              dataKey="dateShort"
              tick={{ fill: "#71717a", fontSize: 11 }}
              stroke="#3f3f46"
            />
            <YAxis
              yAxisId="left"
              domain={[0, 100]}
              tick={{ fill: "#71717a", fontSize: 11 }}
              stroke="#3f3f46"
              label={{
                value: "Mobility",
                angle: -90,
                position: "insideLeft",
                fill: COLORS.purple,
                fontSize: 10,
              }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 10]}
              tick={{ fill: "#71717a", fontSize: 11 }}
              stroke="#3f3f46"
              label={{
                value: "Pain",
                angle: 90,
                position: "insideRight",
                fill: COLORS.danger,
                fontSize: 10,
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                border: "1px solid #27272a",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "#ededed" }}
              itemStyle={{ fontSize: "12px" }}
            />
            
            {/* Show all metrics or just highlighted one */}
            {(highlightMetric === "all" || highlightMetric === "mobility_score") && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="mobilityScore"
                stroke={COLORS.purple}
                strokeWidth={3}
                dot={{ fill: COLORS.purple, r: 4 }}
                activeDot={{ r: 6, stroke: COLORS.purple, strokeWidth: 2 }}
                name="Mobility Score"
              />
            )}
            
            {(highlightMetric === "all" || highlightMetric === "pain_level") && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="painLevel"
                stroke={COLORS.danger}
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: COLORS.danger, r: 3 }}
                name="Pain Level"
              />
            )}

            {/* Target line for mobility */}
            <ReferenceLine
              yAxisId="left"
              y={80}
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
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: COLORS.purple }}
          />
          <span className="text-zinc-400">Mobility Score</span>
        </div>
        <div className="flex items-center gap-1">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: COLORS.danger }}
          />
          <span className="text-zinc-400">Pain Level</span>
        </div>
      </div>
    </div>
  );
}
