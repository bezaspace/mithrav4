import { Type, type FunctionDeclaration } from "@google/genai";

export const neuroRehabTools: FunctionDeclaration[] = [
  {
    name: "get_patient_profile",
    description: "Get patient's clinical profile including name, diagnosis, surgeon, rehab plan, and next assessment date",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: "get_recovery_trajectory",
    description: "Fetch recovery trajectory data showing cognitive, physical, and speech scores over the past week",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: "get_therapy_allocation",
    description: "Get therapy time allocation showing percentage breakdown of physiotherapy, speech therapy, cognitive games, and rest",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: "get_recovery_scores",
    description: "Get current recovery scores across cognitive, physical, diet, medication, and sleep categories",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: "get_daily_schedule",
    description: "Get today's schedule with all activities, times, experts, and detailed instructions",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: "render_progress_chart",
    description: "Request to render a specific interactive chart component in the chat UI to visualize patient progress. Use this when the user asks about their progress, wants to see their scores, or when you want to show them a chart alongside your explanation.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        chartType: {
          type: Type.STRING,
          enum: ["recovery_trajectory", "therapy_allocation", "recovery_scores", "daily_schedule", "clinical_profile"],
          description: "Type of chart to display",
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
