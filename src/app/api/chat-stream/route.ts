import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { NextRequest } from "next/server";
import { SentenceBuffer } from "@/lib/sentenceBuffer";
import { cleanTeluguTextForTTS } from "@/lib/textCleaner";
import { neuroRehabTools } from "@/lib/tools/definitions";
import { executeTool, ToolResult } from "@/lib/tools";
import { getDatabase } from "@/lib/db";

interface Message {
  role: "user" | "model";
  text: string;
}

// SSE Data types
interface SSEData {
  type: "text" | "audio" | "sentence" | "error" | "done" | "tts-start" | "tool_result";
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
        const ttsProvider = (formData.get("ttsProvider") as string) || "sarvam";
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

        // Fetch patient-specific context
        const db = getDatabase();
        const patient = db.prepare(
          'SELECT name, age, surgery_type, recovery_stage, target_recovery_days FROM patient WHERE id = ?'
        ).get(Number(patientId) || 1) as {
          name: string;
          age: number;
          surgery_type: string;
          recovery_stage: number;
          target_recovery_days: number;
        } | undefined;

        // Fetch patient medications
        const medications = db.prepare(
          'SELECT medication_name, dosage, frequency FROM medication_schedule WHERE patient_id = ? AND active = 1'
        ).all(Number(patientId) || 1) as {
          medication_name: string;
          dosage: string;
          frequency: string;
        }[];

        const medicationList = medications.map(m => `${m.medication_name} (${m.dosage}, ${m.frequency})`).join(', ');

        // Build dynamic system prompt with patient context
        const patientContext = patient 
          ? `You are currently talking to ${patient.name}, a ${patient.age}-year-old patient recovering from ${patient.surgery_type}. 
             They are currently in recovery stage ${patient.recovery_stage} of ${patient.target_recovery_days} days.
             Current medications: ${medicationList || 'None recorded'}.
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
        
        // Sentence queue for TTS processing (skipped when ttsProvider === "none")
        const sentenceQueue: string[] = [];
        let isProcessingTts = false;
        let ttsIndex = 0;

        // Function to process next sentence in queue
        const processNextSentence = async () => {
          if (ttsProvider === "none") return; // Skip TTS entirely
          if (isProcessingTts || ttsIndex >= sentenceQueue.length) {
            return;
          }

          isProcessingTts = true;
          const originalSentence = sentenceQueue[ttsIndex];
          ttsIndex++;

          const cleanedSentence = cleanTeluguTextForTTS(originalSentence);

          try {
            controller.enqueue(
              encoder.encode(
                encodeSSE({
                  type: "tts-start",
                  text: originalSentence,
                })
              )
            );

            if (ttsProvider === "sarvam") {
              await fetchSarvamStream(cleanedSentence, (audioBase64) => {
                controller.enqueue(
                  encoder.encode(
                    encodeSSE({
                      type: "audio",
                      data: audioBase64,
                      text: originalSentence,
                    })
                  )
                );
              });
            } else {
              await fetchPiperStream(cleanedSentence, (audioBase64) => {
                controller.enqueue(
                  encoder.encode(
                    encodeSSE({
                      type: "audio",
                      data: audioBase64,
                      text: originalSentence,
                    })
                  )
                );
              });
            }
          } catch (error) {
            console.error("TTS error:", error);
          } finally {
            isProcessingTts = false;
            if (ttsIndex < sentenceQueue.length) {
              processNextSentence();
            }
          }
        };

        // Create sentence buffer
        const sentenceBuffer = new SentenceBuffer(async (sentence) => {
          sentenceQueue.push(sentence);
          
          controller.enqueue(
            encoder.encode(
              encodeSSE({
                type: "sentence",
                text: sentence,
              })
            )
          );

          processNextSentence();
        });

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

        // ============================================================
        // PATH 1: Text-only mode — use true streaming for real-time text
        // ============================================================
        if (ttsProvider === "none") {
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
          return;
        }

        // ============================================================
        // PATH 2: TTS mode (sarvam/piper) — non-streaming for sentence-based audio
        // ============================================================

        while (true) {
          const response = await ai.models.generateContent({
            model: "gemini-3.1-flash-lite-preview",
            contents,
            config: {
              systemInstruction: dynamicSystemPrompt,
              maxOutputTokens: 220,
              thinkingConfig: {
                thinkingLevel: ThinkingLevel.MINIMAL,
              },
              tools: toolConfig,
            },
          });

          const functionCalls = response.functionCalls ?? [];
          const modelContent = response.candidates?.[0]?.content;

          if (functionCalls.length === 0) {
            accumulatedText = finalizeAssistantReply(response.text || "");
            break;
          }

          if (modelContent) {
            contents.push(modelContent as unknown as Record<string, unknown>);
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

              controller.enqueue(
                encoder.encode(
                  encodeSSE({
                    type: "tool_result",
                    toolName: result.toolName,
                    result: result.result,
                  })
                )
              );

              functionResponseParts.push({
                functionResponse: {
                  name: callName,
                  response: { result: result.result },
                },
              });
            } catch (error) {
              console.error(`Tool execution error for ${callName}:`, error);

              const errorResult = { error: "Failed to execute tool" };
              controller.enqueue(
                encoder.encode(
                  encodeSSE({
                    type: "tool_result",
                    toolName: callName,
                    result: errorResult,
                  })
                )
              );

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
        }

        // For TTS-enabled mode: queue sentences for audio synthesis
        // For "none" mode: text was already sent immediately above
        if (ttsProvider !== "none" && accumulatedText.length > 0) {
          sentenceBuffer.add(accumulatedText);

          controller.enqueue(
            encoder.encode(
              encodeSSE({
                type: "text",
                text: accumulatedText,
              })
            )
          );
        }

        // Flush remaining buffer (only needed for TTS mode)
        if (ttsProvider !== "none") {
          sentenceBuffer.flush();
          // Wait for all sentences to be processed
          while (ttsIndex < sentenceQueue.length || isProcessingTts) {
            await new Promise((resolve) => setTimeout(resolve, 50));
          }
        }

        accumulatedText = finalizeAssistantReply(accumulatedText);

        // Send done signal with final text and all tool results
        controller.enqueue(
          encoder.encode(
            encodeSSE({
              type: "done",
              text: accumulatedText,
            })
          )
        );

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

// Helper function to call Sarvam streaming API
async function fetchSarvamStream(
  text: string,
  onAudioChunk: (audioBase64: string) => void
): Promise<void> {
  const response = await fetch("https://api.sarvam.ai/text-to-speech/stream", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-subscription-key": process.env.SARVAM_API_KEY || "",
    },
    body: JSON.stringify({
      text: text.slice(0, 3500),
      target_language_code: "te-IN",
      speaker: "shubh",
      model: "bulbul:v3",
      pace: 1.0,
      output_audio_codec: "mp3",
      output_audio_bitrate: "128k",
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("Sarvam TTS error:", errorData);
    throw new Error("Failed to generate speech");
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No response body");
  }

  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.length;
  }

  const base64 = Buffer.from(combined).toString("base64");
  onAudioChunk(base64);
}

// Helper function to call local Piper API
async function fetchPiperStream(
  text: string,
  onAudioChunk: (audioBase64: string) => void
): Promise<void> {
  const response = await fetch("http://localhost:3145/api/tts-piper", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error("Piper TTS failed");
  }

  const audioBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(audioBuffer).toString("base64");
  onAudioChunk(base64);
}
