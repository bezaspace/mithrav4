"use client";

import { RecoveryTrajectoryChart } from "./charts/RecoveryTrajectoryChart";
import { TherapyAllocationChart } from "./charts/TherapyAllocationChart";
import { RecoveryScoresChart } from "./charts/RecoveryScoresChart";
import { DailyScheduleChart } from "./charts/DailyScheduleChart";
import { ClinicalProfileCard } from "./charts/ClinicalProfileCard";

export interface ToolResult {
  toolName: string;
  result: unknown;
  isChart?: boolean;
}

interface DynamicComponentRendererProps {
  toolResults: ToolResult[];
}

export function DynamicComponentRenderer({
  toolResults,
}: DynamicComponentRendererProps) {
  if (!toolResults || toolResults.length === 0) {
    return null;
  }

  const visibleToolResults = toolResults.some(
    (tool) => tool.toolName === "render_progress_chart"
  )
    ? toolResults.filter((tool) => tool.toolName === "render_progress_chart")
    : toolResults;

  return (
    <div className="my-4 w-full space-y-4">
      {visibleToolResults.map((tool, index) => {
        if (!tool.result) return null;

        const result = tool.result as Record<string, unknown>;

        switch (tool.toolName) {
          case "render_progress_chart": {
            const chartType = result.chartType as string;
            const data = result.data as Record<string, unknown>;
            const title = (result.title as string) || getDefaultTitle(chartType);

            return (
              <div
                key={`${tool.toolName}-${index}`}
                className="w-full overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900/70 p-4 md:p-5"
              >
                <h4 className="text-sm font-semibold text-zinc-200 mb-3">
                  {title}
                </h4>
                {renderChart(chartType, data, true)}
              </div>
            );
          }

          case "get_recovery_trajectory": {
            return (
              <div
                key={`${tool.toolName}-${index}`}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900/70 p-4 md:p-5"
              >
                <h4 className="text-sm font-semibold text-zinc-200 mb-3">
                  Recovery Trajectory
                </h4>
                <RecoveryTrajectoryChart data={result as Parameters<typeof RecoveryTrajectoryChart>[0]['data']} compact />
              </div>
            );
          }

          case "get_therapy_allocation": {
            return (
              <div
                key={`${tool.toolName}-${index}`}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900/70 p-4 md:p-5"
              >
                <h4 className="text-sm font-semibold text-zinc-200 mb-3">
                  Therapy Allocation
                </h4>
                <TherapyAllocationChart data={result as Parameters<typeof TherapyAllocationChart>[0]['data']} compact />
              </div>
            );
          }

          case "get_recovery_scores": {
            return (
              <div
                key={`${tool.toolName}-${index}`}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900/70 p-4 md:p-5"
              >
                <h4 className="text-sm font-semibold text-zinc-200 mb-3">
                  Recovery Scores
                </h4>
                <RecoveryScoresChart data={result as Parameters<typeof RecoveryScoresChart>[0]['data']} compact />
              </div>
            );
          }

          case "get_daily_schedule": {
            return (
              <div
                key={`${tool.toolName}-${index}`}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900/70 p-4 md:p-5"
              >
                <h4 className="text-sm font-semibold text-zinc-200 mb-3">
                  Today's Schedule
                </h4>
                <DailyScheduleChart data={result as Parameters<typeof DailyScheduleChart>[0]['data']} compact />
              </div>
            );
          }

          case "get_patient_profile": {
            return (
              <div
                key={`${tool.toolName}-${index}`}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900/70 p-4 md:p-5"
              >
                <h4 className="text-sm font-semibold text-zinc-200 mb-3">
                  Clinical Profile
                </h4>
                <ClinicalProfileCard data={result as Parameters<typeof ClinicalProfileCard>[0]['data']} compact />
              </div>
            );
          }

          default:
            return null;
        }
      })}
    </div>
  );
}

function renderChart(
  chartType: string,
  data: Record<string, unknown>,
  compact: boolean
) {
  switch (chartType) {
    case "recovery_trajectory":
      return (
        <RecoveryTrajectoryChart
          data={data as Parameters<typeof RecoveryTrajectoryChart>[0]['data']}
          compact={compact}
        />
      );

    case "therapy_allocation":
      return (
        <TherapyAllocationChart
          data={data as Parameters<typeof TherapyAllocationChart>[0]['data']}
          compact={compact}
        />
      );

    case "recovery_scores":
      return (
        <RecoveryScoresChart
          data={data as Parameters<typeof RecoveryScoresChart>[0]['data']}
          compact={compact}
        />
      );

    case "daily_schedule":
      return (
        <DailyScheduleChart
          data={data as Parameters<typeof DailyScheduleChart>[0]['data']}
          compact={compact}
        />
      );

    case "clinical_profile":
      return (
        <ClinicalProfileCard
          data={data as Parameters<typeof ClinicalProfileCard>[0]['data']}
          compact={compact}
        />
      );

    default:
      return (
        <div className="text-zinc-500 text-sm">Unknown chart type: {chartType}</div>
      );
  }
}

function getDefaultTitle(chartType: string): string {
  const titles: Record<string, string> = {
    recovery_trajectory: "Recovery Trajectory",
    therapy_allocation: "Therapy Allocation",
    recovery_scores: "Recovery Scores",
    daily_schedule: "Today's Schedule",
    clinical_profile: "Clinical Profile",
  };
  return titles[chartType] || "Progress Chart";
}
