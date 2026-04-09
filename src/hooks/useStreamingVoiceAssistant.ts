"use client";

import { useState, useCallback, useRef } from "react";
import type { ToolResult } from "@/components/DynamicComponentRenderer";

export type TtsProvider = "sarvam" | "piper";

interface Message {
  role: "user" | "model";
  text: string;
  timestamp: number;
  toolResults?: ToolResult[];
}

interface PendingAudio {
  audio: string;
  format: "mp3" | "wav";
  text: string;
}

interface UseStreamingVoiceAssistantReturn {
  isStreaming: boolean;
  isProcessing: boolean;
  error: string | null;
  conversation: Message[];
  currentStreamingText: string;
  currentToolResults: ToolResult[];
  ttsProvider: TtsProvider;
  setTtsProvider: (provider: TtsProvider) => void;
  toggleTtsProvider: () => void;
  clearConversation: () => void;
  stopSpeaking: () => void;
  sendAudioToAI: (audioBlob: Blob) => Promise<void>;
}

export function useStreamingVoiceAssistant(): UseStreamingVoiceAssistantReturn {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversation, setConversation] = useState<Message[]>([]);
  const [currentStreamingText, setCurrentStreamingText] = useState("");
  const [currentToolResults, setCurrentToolResults] = useState<ToolResult[]>([]);
  const [ttsProvider, setTtsProvider] = useState<TtsProvider>("sarvam");

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<PendingAudio[]>([]);
  const isPlayingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const currentGainNodeRef = useRef<GainNode | null>(null);
  const isInterruptedRef = useRef(false); // Track if user has interrupted

  // Initialize AudioContext on user interaction
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }
  }, []);

  // Toggle between Sarvam and Piper
  const toggleTtsProvider = useCallback(() => {
    setTtsProvider((prev) => (prev === "sarvam" ? "piper" : "sarvam"));
  }, []);

  // Play audio from base64 MP3 or WAV
  const playAudioChunk = useCallback(async (audioData: PendingAudio): Promise<void> => {
    if (!audioContextRef.current) {
      initAudioContext();
    }

    const audioContext = audioContextRef.current;
    if (!audioContext) return;

    const { audio: base64Audio, format } = audioData;

    try {
      // Convert base64 to ArrayBuffer
      const byteCharacters = atob(base64Audio);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);

      // Decode audio (WAV or MP3)
      const audioBuffer = await audioContext.decodeAudioData(byteArray.buffer);

      // Create source and gain node for volume control
      const source = audioContext.createBufferSource();
      const gainNode = audioContext.createGain();
      
      source.buffer = audioBuffer;
      source.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Set initial volume to 1
      gainNode.gain.setValueAtTime(1, audioContext.currentTime);
      
      // Store references so we can control them
      currentAudioSourceRef.current = source;
      currentGainNodeRef.current = gainNode;

      return new Promise((resolve) => {
        source.onended = () => {
          currentAudioSourceRef.current = null;
          currentGainNodeRef.current = null;
          resolve();
        };
        source.start(0);
      });
    } catch (err) {
      console.error("Error playing audio chunk:", err);
      // Fallback: use HTML5 Audio
      return new Promise((resolve, reject) => {
        const mimeType = format === "wav" ? "audio/wav" : "audio/mp3";
        const audio = new Audio(`data:${mimeType};base64,${base64Audio}`);
        audio.onended = () => resolve();
        audio.onerror = () => reject();
        audio.play().catch(reject);
      });
    }
  }, [initAudioContext]);

  // Process audio queue - plays sequentially
  const processAudioQueue = useCallback(async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return;

    isPlayingRef.current = true;

    while (audioQueueRef.current.length > 0) {
      const audioData = audioQueueRef.current.shift();
      if (audioData) {
        try {
          await playAudioChunk(audioData);
        } catch (err) {
          console.error("Error playing audio:", err);
        }
      }
    }

    isPlayingRef.current = false;
  }, [playAudioChunk]);

  // Queue audio for playback
  const queueAudio = useCallback(
    (audioData: PendingAudio) => {
      // If interrupted, don't queue any new audio from old stream
      if (isInterruptedRef.current) {
        console.log("[Interruption] Blocking audio from old stream");
        return;
      }
      audioQueueRef.current.push(audioData);
      processAudioQueue();
    },
    [processAudioQueue]
  );

  // Stop speaking - interrupt current AI response with moderate fade-out
  const stopSpeaking = useCallback(() => {
    // Set interruption flag to block any audio from old stream
    isInterruptedRef.current = true;
    console.log("[Interruption] User interrupted AI");

    // Abort any ongoing fetch request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Moderate fade-out duration (500ms)
    const FADE_OUT_DURATION = 0.5;

    // Apply fade-out to currently playing audio before stopping
    if (currentGainNodeRef.current && audioContextRef.current) {
      const gainNode = currentGainNodeRef.current;
      const audioContext = audioContextRef.current;
      
      try {
        // Smoothly ramp volume to 0 over the fade-out duration
        const currentTime = audioContext.currentTime;
        gainNode.gain.setValueAtTime(gainNode.gain.value, currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + FADE_OUT_DURATION);
        
        // Stop the audio source after fade-out completes
        if (currentAudioSourceRef.current) {
          const source = currentAudioSourceRef.current;
          source.stop(currentTime + FADE_OUT_DURATION + 0.01);
        }
      } catch (e) {
        // If fade-out fails, stop immediately
        if (currentAudioSourceRef.current) {
          try {
            currentAudioSourceRef.current.stop();
          } catch (err) {
            // Ignore errors if already stopped
          }
        }
      }
    } else if (currentAudioSourceRef.current) {
      // Fallback: stop immediately if no gain node
      try {
        currentAudioSourceRef.current.stop();
      } catch (e) {
        // Ignore errors if already stopped
      }
    }

    // Clear references after a short delay to let fade-out complete
    setTimeout(() => {
      currentAudioSourceRef.current = null;
      currentGainNodeRef.current = null;
    }, FADE_OUT_DURATION * 1000);

    // Clear audio queue
    audioQueueRef.current = [];
    isPlayingRef.current = false;

    // Reset state
    setIsStreaming(false);
    setIsProcessing(false);
    setCurrentStreamingText("");
    setCurrentToolResults([]); // Clear old charts when interrupting
    setError(null);
  }, []);

  const clearConversation = useCallback(() => {
    setConversation([]);
    setCurrentToolResults([]);
    audioQueueRef.current = [];
  }, []);

  const sendAudioToAI = useCallback(
    async (audioBlob: Blob): Promise<void> => {
      try {
        // Clear interruption flag so new audio can be queued and played
        isInterruptedRef.current = false;
        console.log("[Interruption] Starting new request, flag cleared");

        setError(null);
        setIsProcessing(true);
        setIsStreaming(true);
        setCurrentStreamingText("");
        setCurrentToolResults([]);

        initAudioContext();

        // Create abort controller for this request
        abortControllerRef.current = new AbortController();

        // Create form data with audio, conversation history, and TTS provider
        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.webm");
        formData.append("conversation", JSON.stringify(conversation));
        formData.append("ttsProvider", ttsProvider);

        // Send to streaming API
        const response = await fetch("/api/chat-stream", {
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

                  case "sentence":
                    // Sentence ready for display
                    break;

                  case "tts-start":
                    // Server started processing TTS
                    break;

                  case "audio":
                    // Audio received from server - queue and play
                    if (data.data && data.text) {
                      const format: "mp3" | "wav" = ttsProvider === "sarvam" ? "mp3" : "wav";
                      queueAudio({
                        audio: data.data,
                        format,
                        text: data.text,
                      });
                    }
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
                    setCurrentStreamingText("");
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
    [conversation, initAudioContext, queueAudio, ttsProvider]
  );

  return {
    isStreaming,
    isProcessing,
    error,
    conversation,
    currentStreamingText,
    currentToolResults,
    ttsProvider,
    setTtsProvider,
    toggleTtsProvider,
    clearConversation,
    stopSpeaking,
    sendAudioToAI,
  };
}
