"use client";

import { PhysiotherapyChart } from "./charts/PhysiotherapyChart";
import { MedicationAdherenceChart } from "./charts/MedicationAdherenceChart";
import { DietAdherenceChart } from "./charts/DietAdherenceChart";
import { ActivityProgressChart } from "./charts/ActivityProgressChart";
import { MilestonesChart } from "./charts/MilestonesChart";
import { PatientOverviewCard } from "./charts/PatientOverviewCard";

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

  return (
    <div className="space-y-4 my-4">
      {toolResults.map((tool, index) => {
        // Skip if no result
        if (!tool.result) return null;

        const result = tool.result as Record<string, unknown>;

        switch (tool.toolName) {
          case "render_progress_chart": {
            const chartType = result.chartType as string;
            const data = result.data as Record<string, unknown>;
            const title = (result.title as string) || getDefaultTitle(chartType);
            const metric = (result.metric as string) || "all";

            return (
              <div
                key={`${tool.toolName}-${index}`}
                className="bg-zinc-900/70 border border-zinc-700 rounded-xl p-4 overflow-hidden"
              >
                <h4 className="text-sm font-semibold text-zinc-200 mb-3">
                  {title}
                </h4>
                {renderChart(chartType, data, metric, true)}
              </div>
            );
          }

          case "get_physiotherapy_progress": {
            const physioData = result as {
              data: unknown[];
              summary?: Record<string, unknown>;
            };
            return (
              <div
                key={`${tool.toolName}-${index}`}
                className="bg-zinc-900/70 border border-zinc-700 rounded-xl p-4"
              >
                <h4 className="text-sm font-semibold text-zinc-200 mb-3">
                  Physiotherapy Summary
                </h4>
                <PhysiotherapyChart data={physioData as Parameters<typeof PhysiotherapyChart>[0]['data']} compact />
              </div>
            );
          }

          case "get_medication_adherence": {
            const medData = result as {
              adherencePercent: number;
              totalDoses: number;
              takenDoses: number;
              missedDoses: number;
              data: unknown[];
            };
            return (
              <div
                key={`${tool.toolName}-${index}`}
                className="bg-zinc-900/70 border border-zinc-700 rounded-xl p-4"
              >
                <h4 className="text-sm font-semibold text-zinc-200 mb-3">
                  Medication Adherence
                </h4>
                <MedicationAdherenceChart data={medData as Parameters<typeof MedicationAdherenceChart>[0]['data']} compact />
              </div>
            );
          }

          case "get_diet_adherence": {
            const dietData = result as {
              avgCalories: number;
              avgHydration: number;
              avgAdherence: number;
              data: unknown[];
            };
            return (
              <div
                key={`${tool.toolName}-${index}`}
                className="bg-zinc-900/70 border border-zinc-700 rounded-xl p-4"
              >
                <h4 className="text-sm font-semibold text-zinc-200 mb-3">
                  Diet & Nutrition
                </h4>
                <DietAdherenceChart data={dietData as Parameters<typeof DietAdherenceChart>[0]['data']} compact />
              </div>
            );
          }

          case "get_activity_progress": {
            const activityData = result as {
              avgSteps: number;
              avgActiveMinutes: number;
              avgSleepQuality: number;
              data: unknown[];
            };
            return (
              <div
                key={`${tool.toolName}-${index}`}
                className="bg-zinc-900/70 border border-zinc-700 rounded-xl p-4"
              >
                <h4 className="text-sm font-semibold text-zinc-200 mb-3">
                  Activity & Sleep
                </h4>
                <ActivityProgressChart data={activityData as Parameters<typeof ActivityProgressChart>[0]['data']} compact />
              </div>
            );
          }

          case "get_recovery_milestones": {
            const milestonesData = result as {
              milestones: unknown[];
              summary: {
                completed: number;
                pending: number;
                completionPercent: number;
              };
            };
            return (
              <div
                key={`${tool.toolName}-${index}`}
                className="bg-zinc-900/70 border border-zinc-700 rounded-xl p-4"
              >
                <h4 className="text-sm font-semibold text-zinc-200 mb-3">
                  Recovery Milestones
                </h4>
                <MilestonesChart data={milestonesData as Parameters<typeof MilestonesChart>[0]['data']} compact />
              </div>
            );
          }

          case "get_patient_overview": {
            const patientData = result as {
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
            return (
              <div
                key={`${tool.toolName}-${index}`}
                className="bg-zinc-900/70 border border-zinc-700 rounded-xl p-4"
              >
                <h4 className="text-sm font-semibold text-zinc-200 mb-3">
                  Patient Overview
                </h4>
                <PatientOverviewCard data={patientData} />
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
  metric: string,
  compact: boolean
) {
  switch (chartType) {
    case "physiotherapy":
      return (
        <PhysiotherapyChart
          data={data as Parameters<typeof PhysiotherapyChart>[0]['data']}
          highlightMetric={metric}
          compact={compact}
        />
      );

    case "medication":
      return (
        <MedicationAdherenceChart
          data={data as Parameters<typeof MedicationAdherenceChart>[0]['data']}
          compact={compact}
        />
      );

    case "diet":
      return (
        <DietAdherenceChart
          data={data as Parameters<typeof DietAdherenceChart>[0]['data']}
          compact={compact}
        />
      );

    case "activity":
      return (
        <ActivityProgressChart
          data={data as Parameters<typeof ActivityProgressChart>[0]['data']}
          compact={compact}
        />
      );

    case "milestones":
      return (
        <MilestonesChart
          data={data as Parameters<typeof MilestonesChart>[0]['data']}
          compact={compact}
        />
      );

    case "overview":
      return (
        <PatientOverviewCard
          data={data as Parameters<typeof PatientOverviewCard>[0]['data']}
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
    physiotherapy: "Physiotherapy Progress",
    medication: "Medication Adherence",
    diet: "Diet & Hydration",
    activity: "Daily Activity & Sleep",
    milestones: "Recovery Milestones",
    overview: "Recovery Overview",
  };
  return titles[chartType] || "Progress Chart";
}
