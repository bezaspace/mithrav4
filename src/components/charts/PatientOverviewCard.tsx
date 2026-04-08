"use client";

interface PatientOverviewProps {
  data: {
    name: string;
    age: number;
    surgery_type: string;
    surgery_date: string;
    discharge_date: string;
    recovery_stage: number;
    target_recovery_days: number;
    days_since_surgery: number;
    days_since_discharge: number;
    daysRemaining: number;
    progressPercent: number;
  };
}

const COLORS = {
  primary: "#0891B2",
  secondary: "#10B981",
  accent: "#F59E0B",
  danger: "#EF4444",
  purple: "#8B5CF6",
  pink: "#EC4899",
};

export function PatientOverviewCard({ data }: PatientOverviewProps) {
  return (
    <div className="space-y-4">
      {/* Main Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-800/50 rounded-lg p-4">
          <p className="text-zinc-400 text-xs mb-1">Patient</p>
          <p className="text-lg font-semibold text-zinc-100">{data.name}</p>
          <p className="text-sm text-zinc-500">{data.age} years old</p>
        </div>
        <div className="bg-zinc-800/50 rounded-lg p-4">
          <p className="text-zinc-400 text-xs mb-1">Surgery</p>
          <p className="text-base font-semibold text-zinc-100">
            {data.surgery_type}
          </p>
          <p className="text-sm text-zinc-500">{data.surgery_date}</p>
        </div>
      </div>

      {/* Recovery Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div
          className="rounded-lg p-3 text-center"
          style={{ backgroundColor: `${COLORS.primary}15` }}
        >
          <p className="text-zinc-400 text-xs mb-1">Recovery Stage</p>
          <p
            className="text-2xl font-bold"
            style={{ color: COLORS.primary }}
          >
            {data.recovery_stage}
          </p>
        </div>
        <div
          className="rounded-lg p-3 text-center"
          style={{ backgroundColor: `${COLORS.secondary}15` }}
        >
          <p className="text-zinc-400 text-xs mb-1">Days Since Surgery</p>
          <p
            className="text-2xl font-bold"
            style={{ color: COLORS.secondary }}
          >
            {data.days_since_surgery}
          </p>
        </div>
        <div
          className="rounded-lg p-3 text-center"
          style={{ backgroundColor: `${COLORS.accent}15` }}
        >
          <p className="text-zinc-400 text-xs mb-1">Days Remaining</p>
          <p
            className="text-2xl font-bold"
            style={{ color: COLORS.accent }}
          >
            {data.daysRemaining}
          </p>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="bg-zinc-800/50 rounded-lg p-4">
        <div className="flex justify-between items-center mb-2">
          <p className="text-zinc-300 text-sm font-medium">Overall Recovery Progress</p>
          <p
            className="text-2xl font-bold"
            style={{
              color:
                data.progressPercent >= 75
                  ? COLORS.secondary
                  : data.progressPercent >= 50
                  ? COLORS.accent
                  : COLORS.primary,
            }}
          >
            {data.progressPercent}%
          </p>
        </div>
        <div className="h-3 bg-zinc-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-green-500 rounded-full transition-all duration-1000"
            style={{ width: `${data.progressPercent}%` }}
          />
        </div>
        <p className="text-xs text-zinc-500 mt-2">
          Recovery from {data.surgery_type} • Discharged{" "}
          {data.days_since_discharge} days ago
        </p>
      </div>
    </div>
  );
}
