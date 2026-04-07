import { GoogleGenAI } from "@google/genai";
import { NextRequest } from "next/server";
import { SentenceBuffer } from "@/lib/sentenceBuffer";

interface Message {
  role: "user" | "model";
  text: string;
}

// SSE Data types
interface SSEData {
  type: "text" | "audio" | "sentence" | "error" | "done" | "tts-start";
  data?: string;
  text?: string;
  error?: string;
}

function encodeSSE(data: SSEData): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

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

        // Build conversation history
        const contents: Array<{
          role: "user" | "model";
          parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>;
        }> = [];

        // Add system prompt for first interaction (Telugu)
        if (conversation.length === 0) {
          contents.push({
            role: "user",
            parts: [
              {
                text: "You are a friendly, conversational AI assistant. The user will speak in Telugu language. Listen to the audio and respond naturally in Telugu as if talking to a friend. Keep your response very brief and engaging - maximum 500 characters. Speak in a conversational tone in Telugu.",
              },
            ],
          });
          contents.push({
            role: "model",
            parts: [{ text: "అర్థమైంది! నేను సిద్ధంగా ఉన్నాను. మీరు తెలుగులో మాట్లాడండి." }],
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

        // Track accumulated text
        let accumulatedText = "";
        
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
          const sentence = sentenceQueue[ttsIndex];
          ttsIndex++;

          try {
            // Send TTS start signal (triggers client to start processing next)
            controller.enqueue(
              encoder.encode(
                encodeSSE({
                  type: "tts-start",
                  text: sentence,
                })
              )
            );

            // Process TTS based on provider
            if (ttsProvider === "sarvam") {
              await fetchSarvamStream(sentence, (audioBase64) => {
                controller.enqueue(
                  encoder.encode(
                    encodeSSE({
                      type: "audio",
                      data: audioBase64,
                      text: sentence,
                    })
                  )
                );
              });
            } else {
              await fetchPiperStream(sentence, (audioBase64) => {
                controller.enqueue(
                  encoder.encode(
                    encodeSSE({
                      type: "audio",
                      data: audioBase64,
                      text: sentence,
                    })
                  )
                );
              });
            }
          } catch (error) {
            console.error("TTS error:", error);
          } finally {
            isProcessingTts = false;
            // Process next sentence if available
            if (ttsIndex < sentenceQueue.length) {
              processNextSentence();
            }
          }
        };

        // Create sentence buffer - emits sentences as they complete
        const sentenceBuffer = new SentenceBuffer(async (sentence) => {
          // Add to queue
          sentenceQueue.push(sentence);
          
          // Send sentence to client for display
          controller.enqueue(
            encoder.encode(
              encodeSSE({
                type: "sentence",
                text: sentence,
              })
            )
          );

          // Start processing if not already
          processNextSentence();
        });

        // Stream from Gemini with max output tokens limit
        const geminiStream = await ai.models.generateContentStream({
          model: "gemini-3.1-flash-lite-preview",
          contents: contents,
          config: {
            maxOutputTokens: 150, // Approximately 500-600 characters for Telugu
          },
        });

        // Process Gemini stream
        for await (const chunk of geminiStream) {
          const text = chunk.text;
          if (text) {
            accumulatedText += text;
            sentenceBuffer.add(text);

            // Send text chunk for live display
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

        // Flush remaining buffer
        sentenceBuffer.flush();

        // Wait for all sentences to be processed
        while (ttsIndex < sentenceQueue.length || isProcessingTts) {
          await new Promise((resolve) => setTimeout(resolve, 50));
        }

        // Send done signal
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

  // Read the binary stream and convert to base64
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

  // Combine all chunks
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.length;
  }

  // Convert to base64
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
