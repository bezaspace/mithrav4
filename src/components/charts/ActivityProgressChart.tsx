"use client";

import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ActivityDataPoint {
  date: string;
  steps: number;
  active_minutes: number;
  rest_hours: number;
  sleep_quality: number;
  mood_rating: number;
}

interface ActivityProgressChartProps {
  data: {
    avgSteps: number;
    avgActiveMinutes: number;
    avgSleepQuality: number;
    data: ActivityDataPoint[];
  };
  compact?: boolean;
}

const COLORS = {
  primary: "#0891B2",
  secondary: "#10B981",
  pink: "#EC4899",
  purple: "#8B5CF6",
};

export function ActivityProgressChart({
  data,
  compact = false,
}: ActivityProgressChartProps) {
  const chartData = data.data || [];

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-zinc-500">
        No activity data available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      {!compact && (
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="bg-zinc-800/50 rounded-lg p-3">
            <p className="text-zinc-400 text-xs">Avg Steps</p>
            <p className="text-lg font-semibold" style={{ color: COLORS.pink }}>
              {data.avgSteps.toLocaleString()}
            </p>
          </div>
          <div className="bg-zinc-800/50 rounded-lg p-3">
            <p className="text-zinc-400 text-xs">Active Minutes</p>
            <p
              className="text-lg font-semibold"
              style={{ color: COLORS.secondary }}
            >
              {data.avgActiveMinutes}
            </p>
          </div>
          <div className="bg-zinc-800/50 rounded-lg p-3">
            <p className="text-zinc-400 text-xs">Sleep Quality</p>
            <p className="text-lg font-semibold" style={{ color: COLORS.purple }}>
              {data.avgSleepQuality}/5
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
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="stepsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.pink} stopOpacity={0.3} />
                <stop offset="95%" stopColor={COLORS.pink} stopOpacity={0} />
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
              domain={[0, 5]}
              tick={{ fill: "#71717a", fontSize: 11 }}
              stroke="#3f3f46"
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
              dataKey="steps"
              stroke={COLORS.pink}
              fillOpacity={1}
              fill="url(#stepsGradient)"
              name="Steps"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="sleep_quality"
              stroke={COLORS.secondary}
              strokeWidth={2}
              dot={false}
              name="Sleep Quality"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="mood_rating"
              stroke={COLORS.purple}
              strokeWidth={2}
              dot={false}
              name="Mood"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex gap-3 text-xs justify-center flex-wrap">
        <div className="flex items-center gap-1">
          <div
            className="w-3 h-3 rounded"
            style={{ backgroundColor: COLORS.pink }}
          />
          <span className="text-zinc-400">Steps</span>
        </div>
        <div className="flex items-center gap-1">
          <div
            className="w-3 h-3 rounded"
            style={{ backgroundColor: COLORS.secondary }}
          />
          <span className="text-zinc-400">Sleep</span>
        </div>
        <div className="flex items-center gap-1">
          <div
            className="w-3 h-3 rounded"
            style={{ backgroundColor: COLORS.purple }}
          />
          <span className="text-zinc-400">Mood</span>
        </div>
      </div>
    </div>
  );
}
