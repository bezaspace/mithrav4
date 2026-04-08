import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest } from "next/server";
import { SentenceBuffer } from "@/lib/sentenceBuffer";
import { cleanTeluguTextForTTS } from "@/lib/textCleaner";
import { neuroRehabTools } from "@/lib/tools/definitions";
import { executeTool, ToolResult } from "@/lib/tools";

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

// System prompt for neuro rehabilitation companion
const SYSTEM_PROMPT = `You are Mithra (మిత్ర), a compassionate AI Neuro Rehabilitation Companion.

Your role is to support patients recovering from neurological surgery by:
1. Answering questions about their recovery progress in Telugu
2. Providing encouragement and rehabilitation guidance
3. Showing visual progress charts when discussing specific metrics - ALWAYS call render_progress_chart when the user asks about their progress
4. Speaking in Telugu as the patient's primary language

Key Guidelines:
- Always be warm, encouraging, and professional
- When patients ask about their physiotherapy, medication, diet, or overall progress, use the appropriate tools to fetch data and render charts
- When displaying charts, explain what the data means in simple terms
- Celebrate milestones and improvements
- Offer gentle reminders about exercises, medication, or appointments
- Keep responses conversational, supportive, and in Telugu

IMPORTANT: When a user asks about their progress (e.g., "How is my physiotherapy going?", "Show me my recovery progress", "What about my medication?"):
1. First call the appropriate get_* tool to fetch the data
2. Then call render_progress_chart to display the visual chart
3. Explain the results in an encouraging way in Telugu

Example responses:
- If they ask about physiotherapy: "Call get_physiotherapy_progress, then render_progress_chart with chartType='physiotherapy'"
- If they ask about medication: "Call get_medication_adherence, then render_progress_chart with chartType='medication'"
- If they ask about overall progress: "Call get_patient_overview, then render_progress_chart with chartType='overview'"`;

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

        // Convert audio file to base64
        const bytes = await audioFile.arrayBuffer();
        const base64Audio = Buffer.from(bytes).toString("base64");

        // Initialize Gemini client
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        // Track accumulated text and tool results
        let accumulatedText = "";
        const toolResults: ToolResult[] = [];
        
        // Sentence queue for TTS processing
        const sentenceQueue: string[] = [];
        let isProcessingTts = false;
        let ttsIndex = 0;

        // Function to process next sentence in queue
        const processNextSentence = async () => {
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

        // Build contents for Gemini - using any for flexibility with function calling
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const contents: any[] = [];

        // Add system instruction as first user message if no history
        if (conversation.length === 0) {
          contents.push({
            role: "user",
            parts: [{ text: SYSTEM_PROMPT }],
          });
          contents.push({
            role: "model",
            parts: [{ text: "నేను మీ న్యూరో రిహాబిలిటేషన్ సహాయకుడిని మిత్ర. మీరు తెలుగులో మాట్లాడండి, నేను మీ రికవరీ ప్రోగ్రెస్‌ను చూపించగలను." }],
          });
        }

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

        // Stream from Gemini with tools
        const geminiStream = await ai.models.generateContentStream({
          model: "gemini-3.1-flash-lite-preview",
          contents: contents,
          config: {
            maxOutputTokens: 300,
            tools: neuroRehabTools.map((tool) => ({
              functionDeclarations: [tool],
            })),
          },
        });

        // Track function calls that need to be executed
        const pendingFunctionCalls: Array<{
          name: string;
          args: Record<string, unknown>;
        }> = [];

        // Track if any function calls were made
        let hasFunctionCalls = false;

        // Process Gemini stream (Turn 1: Get function calls)
        for await (const chunk of geminiStream) {
          // Handle text output (rare in first turn, but possible)
          const text = chunk.text;
          if (text) {
            accumulatedText += text;
            sentenceBuffer.add(text);

            controller.enqueue(
              encoder.encode(
                encodeSSE({
                  type: "text",
                  text: text,
                })
              )
            );
          }

          // Handle function calls
          const functionCalls = chunk.functionCalls;
          if (functionCalls && functionCalls.length > 0) {
            hasFunctionCalls = true;
            
            for (const call of functionCalls) {
              console.log(`Function call: ${call.name}`, call.args);
              
              try {
                // Execute the tool
                const callName = call.name || "unknown";
                const result = await executeTool({
                  name: callName,
                  args: call.args || {},
                });

                toolResults.push(result);

                // Send tool result to client immediately (renders chart)
                controller.enqueue(
                  encoder.encode(
                    encodeSSE({
                      type: "tool_result",
                      toolName: result.toolName,
                      result: result.result,
                    })
                  )
                );

                // Add function call to conversation context
                // Note: We're NOT including function calls in the conversation for Turn 2
                // to avoid thought signature issues. Instead, we'll use a fresh conversation.
                // Just track that we had function calls.
                console.log(`Executed: ${call.name}`);

              } catch (error) {
                console.error(`Tool execution error for ${call.name}:`, error);
                
                // Send error as tool result
                controller.enqueue(
                  encoder.encode(
                    encodeSSE({
                      type: "tool_result",
                      toolName: call.name,
                      result: { error: "Failed to execute tool" },
                    })
                  )
                );
              }
            }
          }
        }

        // If function calls were made, generate explanatory text using a fresh conversation
        // This avoids thought signature issues by not replaying function call parts
        if (hasFunctionCalls) {
          console.log("Function calls executed, generating explanatory text with fresh conversation...");
          
          // Build a simple conversation with just the data results (no function call parts)
          // This avoids the thought signature validation issue
          const explanationContents: any[] = [];
          
          // Add system instruction
          explanationContents.push({
            role: "user",
            parts: [{ text: SYSTEM_PROMPT }],
          });
          explanationContents.push({
            role: "model",
            parts: [{ text: "నేను మీ న్యూరో రిహాబిలిటేషన్ సహాయకుడిని మిత్ర." }],
          });
          
          // Add the user's original query as text (extract from audio context)
          explanationContents.push({
            role: "user",
            parts: [{ text: "Please review my recovery progress data and explain it to me in Telugu in a warm, encouraging way." }],
          });
          
          // Add the data results as context
          const toolResultsText = toolResults
            .filter(tr => tr.toolName.startsWith('get_') || tr.toolName.startsWith('render_'))
            .map(tr => {
              const resultStr = JSON.stringify(tr.result, null, 2);
              return `[${tr.toolName}]: ${resultStr.slice(0, 500)}`;
            })
            .join('\n\n');
          
          explanationContents.push({
            role: "model",
            parts: [{ text: `I've retrieved your progress data:\n\n${toolResultsText}\n\nPlease explain this data in Telugu.` }],
          });
          
          // Create a follow-up stream with a fresh conversation (no thought signatures needed)
          const followUpStream = await ai.models.generateContentStream({
            model: "gemini-3.1-flash-lite-preview",
            contents: explanationContents,
            config: {
              maxOutputTokens: 300,
            },
          });

          // Stream the explanatory text response
          for await (const chunk of followUpStream) {
            const text = chunk.text;
            if (text) {
              accumulatedText += text;
              sentenceBuffer.add(text);

              controller.enqueue(
                encoder.encode(
                  encodeSSE({
                    type: "text",
                    text: text,
                  })
                )
              );
            }
          }
        }

        // Flush remaining buffer
        sentenceBuffer.flush();

        // Wait for all sentences to be processed
        while (ttsIndex < sentenceQueue.length || isProcessingTts) {
          await new Promise((resolve) => setTimeout(resolve, 50));
        }

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
