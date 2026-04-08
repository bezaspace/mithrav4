import {
  executeGetPatientOverview,
  executeGetPhysiotherapyProgress,
  executeGetMedicationAdherence,
  executeGetDietAdherence,
  executeGetActivityProgress,
  executeGetRecoveryMilestones,
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

export async function executeTool(call: ToolCall): Promise<ToolResult> {
  const { name, args } = call;

  switch (name) {
    case "get_patient_overview": {
      const result = await executeGetPatientOverview();
      return { toolName: name, result, isChart: false };
    }

    case "get_physiotherapy_progress": {
      const days = (args.days as number) || 30;
      const result = await executeGetPhysiotherapyProgress(days);
      return { toolName: name, result, isChart: false };
    }

    case "get_medication_adherence": {
      const days = (args.days as number) || 30;
      const result = await executeGetMedicationAdherence(days);
      return { toolName: name, result, isChart: false };
    }

    case "get_diet_adherence": {
      const days = (args.days as number) || 30;
      const result = await executeGetDietAdherence(days);
      return { toolName: name, result, isChart: false };
    }

    case "get_activity_progress": {
      const days = (args.days as number) || 30;
      const result = await executeGetActivityProgress(days);
      return { toolName: name, result, isChart: false };
    }

    case "get_recovery_milestones": {
      const category = (args.category as string) || "All";
      const result = await executeGetRecoveryMilestones(category);
      return { toolName: name, result, isChart: false };
    }

    case "render_progress_chart": {
      // For render_progress_chart, we need to first fetch the data
      // and then return a structured result that tells the UI what to render
      const chartType = args.chartType as string;
      const metric = (args.metric as string) || "all";
      const timeRange = (args.timeRange as string) || "30days";
      const title = (args.title as string) || getDefaultChartTitle(chartType);

      // Parse time range
      const days = parseTimeRange(timeRange);

      // Fetch appropriate data based on chart type
      let chartData: unknown;
      switch (chartType) {
        case "physiotherapy":
          chartData = await executeGetPhysiotherapyProgress(days);
          break;
        case "medication":
          chartData = await executeGetMedicationAdherence(days);
          break;
        case "diet":
          chartData = await executeGetDietAdherence(days);
          break;
        case "activity":
          chartData = await executeGetActivityProgress(days);
          break;
        case "milestones":
          chartData = await executeGetRecoveryMilestones("All");
          break;
        case "overview":
          chartData = await executeGetPatientOverview();
          break;
        default:
          chartData = {};
      }

      return {
        toolName: name,
        result: {
          chartType,
          metric,
          timeRange,
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

function parseTimeRange(timeRange: string): number {
  switch (timeRange) {
    case "7days":
      return 7;
    case "30days":
      return 30;
    case "90days":
      return 90;
    case "all":
      return 365; // Maximum range
    default:
      return 30;
  }
}

function getDefaultChartTitle(chartType: string): string {
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
