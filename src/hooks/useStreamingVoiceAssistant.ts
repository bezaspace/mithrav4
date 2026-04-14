"use client";

import { useState, useCallback, useRef } from "react";
import type { ToolResult } from "@/components/DynamicComponentRenderer";

interface Message {
  role: "user" | "model";
  text: string;
  timestamp: number;
  toolResults?: ToolResult[];
}

interface UseStreamingVoiceAssistantReturn {
  isStreaming: boolean;
  isProcessing: boolean;
  error: string | null;
  conversation: Message[];
  currentStreamingText: string;
  currentToolResults: ToolResult[];
  clearConversation: () => void;
  stopSpeaking: () => void;
  sendAudioToAI: (audioBlob: Blob) => Promise<void>;
}

export function useStreamingVoiceAssistant(patientId?: number): UseStreamingVoiceAssistantReturn {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversation, setConversation] = useState<Message[]>([]);
  const [currentStreamingText, setCurrentStreamingText] = useState("");
  const [currentToolResults, setCurrentToolResults] = useState<ToolResult[]>([]);

  const abortControllerRef = useRef<AbortController | null>(null);
  const isInterruptedRef = useRef(false);

  // Stop speaking - interrupt current AI response
  const stopSpeaking = useCallback(() => {
    // Set interruption flag to block any old stream
    isInterruptedRef.current = true;
    console.log("[Interruption] User interrupted AI");

    // Abort any ongoing fetch request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Reset state
    setIsStreaming(false);
    setIsProcessing(false);
    setCurrentStreamingText("");
    setCurrentToolResults([]);
    setError(null);
  }, []);

  const clearConversation = useCallback(() => {
    setConversation([]);
    setCurrentToolResults([]);
  }, []);

  const sendAudioToAI = useCallback(
    async (audioBlob: Blob): Promise<void> => {
      try {
        // Clear interruption flag so new request can start
        isInterruptedRef.current = false;
        console.log("[Interruption] Starting new request, flag cleared");

        // Get API key from localStorage
        const apiKey = localStorage.getItem('gemini_api_key');
        if (!apiKey) {
          setError("Please set your Gemini API key in the navbar");
          setIsProcessing(false);
          setIsStreaming(false);
          return;
        }

        setError(null);
        setIsProcessing(true);
        setIsStreaming(true);
        setCurrentStreamingText("");
        setCurrentToolResults([]);

        // Create abort controller for this request
        abortControllerRef.current = new AbortController();

        // Create form data with audio, conversation history, patient ID, and API key
        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.webm");
        formData.append("conversation", JSON.stringify(conversation));
        if (patientId) {
          formData.append("patientId", patientId.toString());
        }
        formData.append("apiKey", apiKey);

        // Send to streaming API
        const response = await fetch("/api/chat", {
          method: "POST",
          body: formData,
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to start stream");
        }

        if (!response.body) {
          throw new Error("No response body");
        }

        // Read SSE stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let fullText = "";
        const accumulatedToolResults: ToolResult[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));

                switch (data.type) {
                  case "text":
                    fullText += data.text;
                    setCurrentStreamingText(fullText);
                    break;


                  case "tool_result":
                    // Tool result received - add to accumulated results
                    const toolResult: ToolResult = {
                      toolName: data.toolName,
                      result: data.result,
                    };
                    accumulatedToolResults.push(toolResult);
                    setCurrentToolResults([...accumulatedToolResults]);
                    break;

                  case "error":
                    throw new Error(data.error || "Stream error");

                  case "done":
                    // Stream complete
                    setIsStreaming(false);
                    setIsProcessing(false);

                    // Only add to conversation history if NOT interrupted
                    // (if interrupted, we don't want incomplete responses in history)
                    if (!isInterruptedRef.current) {
                      // Add to conversation history with tool results
                      setConversation((prev) => [
                        ...prev,
                        {
                          role: "user",
                          text: "[Voice input]",
                          timestamp: Date.now(),
                        },
                        {
                          role: "model",
                          text: data.text || fullText,
                          timestamp: Date.now(),
                          toolResults: accumulatedToolResults.length > 0 
                            ? [...accumulatedToolResults] 
                            : undefined,
                        },
                      ]);
                    } else {
                      console.log("[Interruption] Skipping incomplete response in history");
                    }
                    
                    // Note: currentToolResults are NOT cleared here - they persist
                    // until the user asks a new question or interrupts
                    // They get cleared in sendAudioToAI and stopSpeaking instead
                    break;
                }
              } catch (err) {
                console.error("Error parsing SSE data:", err);
              }
            }
          }
        }
      } catch (err) {
        // Don't show error if it was aborted intentionally
        if (err instanceof Error && err.name === "AbortError") {
          console.log("Stream aborted");
          return;
        }
        
        console.error("Error in streaming:", err);
        setError(err instanceof Error ? err.message : "Streaming failed");
        setIsStreaming(false);
        setIsProcessing(false);
        setCurrentStreamingText("");
        setCurrentToolResults([]);
      } finally {
        abortControllerRef.current = null;
      }
    },
    [conversation]
  );

  return {
    isStreaming,
    isProcessing,
    error,
    conversation,
    currentStreamingText,
    currentToolResults,
    clearConversation,
    stopSpeaking,
    sendAudioToAI,
  };
}
