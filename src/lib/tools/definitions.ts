import { Type, type FunctionDeclaration } from "@google/genai";

export const neuroRehabTools: FunctionDeclaration[] = [
  {
    name: "get_patient_overview",
    description: "Get patient's current status including name, age, surgery type, recovery stage, and overall progress percentage",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: "get_physiotherapy_progress",
    description: "Fetch physiotherapy session data including mobility scores (0-100), pain levels (0-10), exercise completion, and session duration",
    parameters: {
      type: Type.OBJECT,
      properties: {
        days: {
          type: Type.NUMBER,
          description: "Number of days of history to retrieve (default: 30)",
        },
      },
    },
  },
  {
    name: "get_medication_adherence",
    description: "Get medication adherence statistics showing percentage of medications taken on time",
    parameters: {
      type: Type.OBJECT,
      properties: {
        days: {
          type: Type.NUMBER,
          description: "Number of days of history",
        },
      },
    },
  },
  {
    name: "get_diet_adherence",
    description: "Fetch diet and nutrition adherence data including calories consumed and hydration levels",
    parameters: {
      type: Type.OBJECT,
      properties: {
        days: {
          type: Type.NUMBER,
          description: "Number of days of history",
        },
      },
    },
  },
  {
    name: "get_activity_progress",
    description: "Get daily activity data including steps, active minutes, and sleep quality",
    parameters: {
      type: Type.OBJECT,
      properties: {
        days: {
          type: Type.NUMBER,
          description: "Number of days of history",
        },
      },
    },
  },
  {
    name: "get_recovery_milestones",
    description: "Get list of recovery milestones and their achievement status (completed or pending)",
    parameters: {
      type: Type.OBJECT,
      properties: {
        category: {
          type: Type.STRING,
          enum: ["Mobility", "ADL", "Cognitive", "Recovery", "Independence", "All"],
          description: "Filter milestones by category",
        },
      },
    },
  },
  {
    name: "render_progress_chart",
    description: "Request to render a specific interactive chart component in the chat UI to visualize patient progress. Use this when the user asks to see their progress visually or when you want to show them a chart alongside your explanation.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        chartType: {
          type: Type.STRING,
          enum: ["physiotherapy", "medication", "diet", "activity", "milestones", "overview"],
          description: "Type of progress chart to display",
        },
        metric: {
          type: Type.STRING,
          enum: ["mobility_score", "pain_level", "exercise_completion", "adherence", "steps", "all"],
          description: "Specific metric to highlight in the chart",
        },
        timeRange: {
          type: Type.STRING,
          enum: ["7days", "30days", "90days", "all"],
          description: "Time period to show in the chart",
        },
        title: {
          type: Type.STRING,
          description: "Custom title for the chart",
        },
      },
      required: ["chartType"],
    },
  },
];
