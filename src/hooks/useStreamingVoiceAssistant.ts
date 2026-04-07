"use client";

import { useState, useCallback, useRef } from "react";

export type TtsProvider = "sarvam" | "piper";

interface Message {
  role: "user" | "model";
  text: string;
  timestamp: number;
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
  ttsProvider: TtsProvider;
  setTtsProvider: (provider: TtsProvider) => void;
  toggleTtsProvider: () => void;
  clearConversation: () => void;
  sendAudioToAI: (audioBlob: Blob) => Promise<void>;
}

export function useStreamingVoiceAssistant(): UseStreamingVoiceAssistantReturn {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversation, setConversation] = useState<Message[]>([]);
  const [currentStreamingText, setCurrentStreamingText] = useState("");
  const [ttsProvider, setTtsProvider] = useState<TtsProvider>("sarvam");

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<PendingAudio[]>([]);
  const isPlayingRef = useRef(false);

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

      // Create source and play
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);

      return new Promise((resolve) => {
        source.onended = () => resolve();
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
      audioQueueRef.current.push(audioData);
      processAudioQueue();
    },
    [processAudioQueue]
  );

  const clearConversation = useCallback(() => {
    setConversation([]);
    audioQueueRef.current = [];
  }, []);

  const sendAudioToAI = useCallback(
    async (audioBlob: Blob): Promise<void> => {
      try {
        setError(null);
        setIsProcessing(true);
        setIsStreaming(true);
        setCurrentStreamingText("");

        initAudioContext();

        // Create form data with audio, conversation history, and TTS provider
        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.webm");
        formData.append("conversation", JSON.stringify(conversation));
        formData.append("ttsProvider", ttsProvider);

        // Send to streaming API
        const response = await fetch("/api/chat-stream", {
          method: "POST",
          body: formData,
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
                    // Sentence ready for display (TTS processing started on server)
                    // Server handles all TTS processing, client just displays
                    break;

                  case "tts-start":
                    // Server started processing TTS for this sentence
                    // Just informational - server pipeline is working
                    break;

                  case "audio":
                    // Audio received from server - queue and play
                    if (data.data && data.text) {
                      // Determine format based on TTS provider
                      const format: "mp3" | "wav" = ttsProvider === "sarvam" ? "mp3" : "wav";
                      queueAudio({
                        audio: data.data,
                        format,
                        text: data.text,
                      });
                    }
                    break;

                  case "error":
                    throw new Error(data.error || "Stream error");

                  case "done":
                    // Stream complete
                    setIsStreaming(false);
                    setIsProcessing(false);

                    // Add to conversation history
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
                      },
                    ]);
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
        console.error("Error in streaming:", err);
        setError(err instanceof Error ? err.message : "Streaming failed");
        setIsStreaming(false);
        setIsProcessing(false);
        setCurrentStreamingText("");
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
    ttsProvider,
    setTtsProvider,
    toggleTtsProvider,
    clearConversation,
    sendAudioToAI,
  };
}
