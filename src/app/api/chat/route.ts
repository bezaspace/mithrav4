import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { NextRequest } from "next/server";
import { neuroRehabTools } from "@/lib/tools/definitions";
import { executeTool, ToolResult } from "@/lib/tools";

interface Message {
  role: "user" | "model";
  text: string;
}

// SSE Data types
interface SSEData {
  type: "text" | "error" | "done" | "tool_result";
  data?: string;
  text?: string;
  error?: string;
  toolName?: string;
  result?: unknown;
}

function encodeSSE(data: SSEData): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

// Clean text by removing function call patterns that the model might output
// Removes patterns like {function_name(arg="value")} or {tool_name(...)}
function cleanTextFromFunctionCalls(text: string): string {
  if (!text || typeof text !== "string") {
    return "";
  }

  return text
    .replace(/\{\w+\([^)]*\)\}/g, " ")
    .replace(/\b(?:get_[a-z_]+|render_[a-z_]+)\([^)]*\)/gi, " ")
    .replace(/\[(?:tool_name|function_name|tool_code)[^\]]*\]/gi, " ")
    .trim();
}

const MAX_VISIBLE_RESPONSE_CHARS = 500;

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function dedupeRepeatedSegments(text: string): string {
  const segments = text
    .split(/(?<=[.!?।])/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  const seen = new Set<string>();
  const uniqueSegments: string[] = [];

  for (const segment of segments) {
    const key = segment.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    uniqueSegments.push(segment);
  }

  return uniqueSegments.join(" ").trim();
}

function clipToCompleteThought(text: string, limit = MAX_VISIBLE_RESPONSE_CHARS): string {
  if (text.length <= limit) {
    return text;
  }

  const withinLimit = text.slice(0, limit);
  const punctuationMatches = [...withinLimit.matchAll(/[.!?।](?=\s|$)/g)];
  const lastPunctuationIndex = punctuationMatches.at(-1)?.index;

  if (typeof lastPunctuationIndex === "number" && lastPunctuationIndex > limit * 0.6) {
    return withinLimit.slice(0, lastPunctuationIndex + 1).trim();
  }

  const lastSpaceIndex = withinLimit.lastIndexOf(" ");
  if (lastSpaceIndex > limit * 0.7) {
    return `${withinLimit.slice(0, lastSpaceIndex).trim()}...`;
  }

  return `${withinLimit.trim()}...`;
}

function finalizeAssistantReply(text: string): string {
  const cleaned = normalizeWhitespace(cleanTextFromFunctionCalls(text));
  const deduped = dedupeRepeatedSegments(cleaned);
  return clipToCompleteThought(deduped);
}

// System prompt for neuro rehabilitation companion
const SYSTEM_PROMPT = `You are Mithra (మిత్ర), a compassionate AI Neuro Rehabilitation Companion.

Your role is to support patients recovering from neurological surgery by:
1. Answering questions about their recovery progress in Telugu
2. Providing encouragement and rehabilitation guidance
3. Showing visual progress charts when discussing specific metrics - ALWAYS call render_progress_chart when the user asks about their progress
4. Speaking in Telugu as the patient's primary language

Key Guidelines:
- Always be warm, encouraging, and professional
- When patients ask about their recovery trajectory, therapy allocation, recovery scores, daily schedule, clinical profile, or pain levels, use the appropriate tools to fetch data and render charts
- When displaying charts, explain what the data means in simple terms
- Celebrate improvements in cognitive, physical, and speech scores
- Offer gentle reminders about scheduled activities, exercises, or appointments
- Keep responses conversational, supportive, and in Telugu
- Use tools silently. Never reveal tool names, instructions, JSON, schema text, or planning steps
- For progress questions, first gather the relevant data, then request the chart, then answer naturally in Telugu
- Keep every final response complete, concise, and naturally under 500 characters

Available Tools:
- get_patient_profile: Get clinical profile (diagnosis, surgeon, rehab plan)
- get_recovery_trajectory: Get cognitive, physical, speech scores over time
- get_therapy_allocation: Get therapy time distribution
- get_recovery_scores: Get current recovery scores across all categories
- get_daily_schedule: Get today's schedule with instructions
- get_pain_index: Get pain levels over the past days
- render_progress_chart: Display charts for recovery_trajectory, therapy_allocation, recovery_scores, daily_schedule, clinical_profile, or pain_index`;

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const formData = await request.formData();
        const audioFile = formData.get("audio") as File;
        const conversationData = formData.get("conversation") as string;
        const conversation: Message[] = conversationData
          ? JSON.parse(conversationData)
          : [];

        if (!audioFile) {
          controller.enqueue(
            encoder.encode(
              encodeSSE({
                type: "error",
                error: "No audio file provided",
              })
            )
          );
          controller.close();
          return;
        }

        const patientId = formData.get("patientId") as string | null;

        // Mock patient data for Vercel deployment
        const mockPatients: Record<number, { name: string; age: number; surgery_type: string; recovery_stage: number; target_recovery_days: number; medications: string[] }> = {
          1: { name: 'Ravi Kumar', age: 52, surgery_type: 'Post Lumbar Spine Fixation', recovery_stage: 3, target_recovery_days: 90, medications: ['Gabapentin (300mg, Three times daily)', 'Muscle Relaxant (10mg, Twice daily)'] },
          2: { name: 'Priya Sharma', age: 58, surgery_type: 'Post Lumbar Spine Fixation', recovery_stage: 2, target_recovery_days: 90, medications: ['Gabapentin (300mg, Three times daily)', 'Muscle Relaxant (10mg, Twice daily)'] },
          3: { name: 'Venkat Reddy', age: 62, surgery_type: 'Post Cervical Fixation', recovery_stage: 4, target_recovery_days: 120, medications: ['Gabapentin (300mg, Three times daily)', 'Pain Medication (50mg, Twice daily)'] },
          4: { name: 'Lakshmi Devi', age: 55, surgery_type: 'Post Cervical Fixation', recovery_stage: 1, target_recovery_days: 120, medications: ['Gabapentin (300mg, Three times daily)', 'Pain Medication (50mg, Twice daily)'] },
          5: { name: 'Suresh Babu', age: 48, surgery_type: 'Post Tumor Resection', recovery_stage: 2, target_recovery_days: 150, medications: ['Levetiracetam (500mg, Twice daily)', 'Dexamethasone (4mg, Once daily)'] },
          6: { name: 'Anjali Mehta', age: 65, surgery_type: 'Post Tumor Resection', recovery_stage: 3, target_recovery_days: 180, medications: ['Levetiracetam (500mg, Twice daily)', 'Dexamethasone (4mg, Once daily)'] },
          7: { name: 'Rajesh Iyer', age: 35, surgery_type: 'Post Accident Trauma', recovery_stage: 1, target_recovery_days: 180, medications: ['Levetiracetam (500mg, Twice daily)', 'Gabapentin (300mg, Three times daily)'] },
          8: { name: 'Kavita Nair', age: 42, surgery_type: 'Post Accident Trauma', recovery_stage: 2, target_recovery_days: 150, medications: ['Levetiracetam (500mg, Twice daily)', 'Gabapentin (300mg, Three times daily)'] },
          9: { name: 'Arjun Singh', age: 45, surgery_type: 'Head Surgery - Craniotomy', recovery_stage: 1, target_recovery_days: 120, medications: ['Levetiracetam (500mg, Twice daily)', 'Dexamethasone (4mg, Once daily)'] },
          10: { name: 'Meera Krishnan', age: 58, surgery_type: 'Head Surgery - Craniotomy', recovery_stage: 3, target_recovery_days: 90, medications: ['Levetiracetam (500mg, Twice daily)', 'Dexamethasone (4mg, Once daily)'] },
        };

        const patient = mockPatients[Number(patientId) || 1];
        const medicationList = patient?.medications.join(', ') || 'None recorded';

        // Build dynamic system prompt with patient context
        const patientContext = patient
          ? `You are currently talking to ${patient.name}, a ${patient.age}-year-old patient recovering from ${patient.surgery_type}.
             They are currently in recovery stage ${patient.recovery_stage} of ${patient.target_recovery_days} days.
             Current medications: ${medicationList}.
             When responding, address them by name and tailor your advice to their specific condition and recovery stage.`
          : '';

        const dynamicSystemPrompt = `${SYSTEM_PROMPT}\n\n${patientContext}`;

        // Convert audio file to base64
        const bytes = await audioFile.arrayBuffer();
        const base64Audio = Buffer.from(bytes).toString("base64");

        // Initialize Gemini client
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        // Track accumulated text and tool results
        let accumulatedText = "";
        const toolResults: ToolResult[] = [];

        // Build Gemini contents for manual tool-calling loop
        const contents: Array<Record<string, unknown>> = [];

        // Add conversation history
        for (const message of conversation) {
          contents.push({
            role: message.role,
            parts: [{ text: message.text }],
          });
        }

        // Add current audio input
        contents.push({
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: audioFile.type || "audio/webm",
                data: base64Audio,
              },
            },
          ],
        });

        const toolConfig = neuroRehabTools.map((tool) => ({
          functionDeclarations: [tool],
        }));

        // Text-only streaming mode
        let finalText = "";

        // Helper to safely enqueue — returns false if controller is closed
        const tryEnqueue = (data: SSEData): boolean => {
          try {
            controller.enqueue(encoder.encode(encodeSSE(data)));
            return true;
          } catch {
            console.log("[Stream] Controller closed — client likely disconnected");
            return false;
          }
        };

        while (true) {
          const streamResponse = await ai.models.generateContentStream({
            model: "gemini-3.1-flash-lite-preview",
            contents,
            config: {
              systemInstruction: dynamicSystemPrompt,
              maxOutputTokens: 220,
              thinkingConfig: {
                thinkingLevel: ThinkingLevel.MINIMAL,
              },
              tools: toolConfig,
              automaticFunctionCalling: { disable: true },
            },
          });

          let accumulatedText = "";
          const functionCalls: Array<{ name: string; args?: Record<string, unknown> }> = [];
          const responseContents: Array<Record<string, unknown>> = [];

          for await (const chunk of streamResponse) {
            // Emit text as it arrives — real-time streaming
            if (chunk.text) {
              accumulatedText += chunk.text;
              if (!tryEnqueue({ type: "text", text: chunk.text })) {
                return; // client disconnected
              }
            }

            // Collect function calls from chunks
            const chunkFunctionCalls = chunk.functionCalls ?? [];
            if (chunkFunctionCalls.length > 0) {
              for (const fc of chunkFunctionCalls) {
                functionCalls.push({ name: fc.name ?? "unknown", args: (fc.args ?? {}) as Record<string, unknown> });
              }
            }

            // Accumulate model content for conversation history
            if (chunk.candidates?.[0]?.content) {
              responseContents.push(chunk.candidates[0].content as unknown as Record<string, unknown>);
            }
          }

          // If no function calls — we have the final response
          if (functionCalls.length === 0) {
            finalText = accumulatedText;
            break;
          }

          // Execute tools and loop
          if (responseContents.length > 0) {
            for (const rc of responseContents) {
              contents.push(rc);
            }
          }

          const functionResponseParts: Array<Record<string, unknown>> = [];

          for (const functionCall of functionCalls) {
            const callName = functionCall.name || "unknown";
            console.log(`Function call: ${callName}`, functionCall.args);

            try {
              const result = await executeTool({
                name: callName,
                args: functionCall.args || {},
              }, Number(patientId) || undefined);

              toolResults.push(result);

              if (!tryEnqueue({ type: "tool_result", toolName: result.toolName, result: result.result })) {
                return;
              }

              functionResponseParts.push({
                functionResponse: {
                  name: callName,
                  response: { result: result.result },
                },
              });
            } catch (error) {
              console.error(`Tool execution error for ${callName}:`, error);

              const errorResult = { error: "Failed to execute tool" };
              if (!tryEnqueue({ type: "tool_result", toolName: callName, result: errorResult })) {
                return;
              }

              functionResponseParts.push({
                functionResponse: {
                  name: callName,
                  response: errorResult,
                },
              });
            }
          }

          contents.push({
            role: "user",
            parts: functionResponseParts,
          });
          // Loop continues — model gets tool results and generates next response
        }

        // Send done signal
        tryEnqueue({
          type: "done",
          text: finalizeAssistantReply(finalText),
        });

        controller.close();
      } catch (error) {
        console.error("Streaming error:", error);
        controller.enqueue(
          encoder.encode(
            encodeSSE({
              type: "error",
              error: error instanceof Error ? error.message : "Unknown error",
            })
          )
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

