import {
  executeGetPatientProfile,
  executeGetRecoveryTrajectory,
  executeGetTherapyAllocation,
  executeGetRecoveryScores,
  executeGetDailySchedule,
  executeGetPainIndex,
} from "./executors";

export interface ToolCall {
  name: string;
  args: Record<string, unknown>;
}

export interface ToolResult {
  toolName: string;
  result: unknown;
  isChart: boolean;
}

export async function executeTool(call: ToolCall, patientId?: number): Promise<ToolResult> {
  const { name, args } = call;

  switch (name) {
    case "get_patient_profile": {
      const result = await executeGetPatientProfile(patientId);
      return { toolName: name, result, isChart: false };
    }

    case "get_recovery_trajectory": {
      const result = await executeGetRecoveryTrajectory(patientId);
      return { toolName: name, result, isChart: false };
    }

    case "get_therapy_allocation": {
      const result = await executeGetTherapyAllocation(patientId);
      return { toolName: name, result, isChart: false };
    }

    case "get_recovery_scores": {
      const result = await executeGetRecoveryScores(patientId);
      return { toolName: name, result, isChart: false };
    }

    case "get_daily_schedule": {
      const result = await executeGetDailySchedule(patientId);
      return { toolName: name, result, isChart: false };
    }

    case "get_pain_index": {
      const result = await executeGetPainIndex(patientId);
      return { toolName: name, result, isChart: false };
    }

    case "render_progress_chart": {
      const chartType = args.chartType as string;
      const title = (args.title as string) || getDefaultChartTitle(chartType);

      let chartData: unknown;
      switch (chartType) {
        case "recovery_trajectory":
          chartData = await executeGetRecoveryTrajectory(patientId);
          break;
        case "therapy_allocation":
          chartData = await executeGetTherapyAllocation(patientId);
          break;
        case "recovery_scores":
          chartData = await executeGetRecoveryScores(patientId);
          break;
        case "daily_schedule":
          chartData = await executeGetDailySchedule(patientId);
          break;
        case "clinical_profile":
          chartData = await executeGetPatientProfile(patientId);
          break;
        case "pain_index":
          chartData = await executeGetPainIndex(patientId);
          break;
        default:
          chartData = {};
      }

      return {
        toolName: name,
        result: {
          chartType,
          title,
          data: chartData,
        },
        isChart: true,
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function getDefaultChartTitle(chartType: string): string {
  const titles: Record<string, string> = {
    recovery_trajectory: "Recovery Trajectory",
    therapy_allocation: "Therapy Allocation",
    recovery_scores: "Recovery Scores",
    daily_schedule: "Today's Schedule",
    clinical_profile: "Clinical Profile",
    pain_index: "Pain Index",
  };
  return titles[chartType] || "Progress Chart";
}
