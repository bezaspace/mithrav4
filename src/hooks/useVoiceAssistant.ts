"use client";

import { useState, useCallback } from "react";

interface Message {
  role: "user" | "model";
  text: string;
  timestamp: number;
}

interface UseVoiceAssistantReturn {
  isProcessing: boolean;
  error: string | null;
  conversation: Message[];
  clearConversation: () => void;
  sendAudioToAI: (audioBlob: Blob) => Promise<string | null>;
  playAudioResponse: (base64Audio: string) => Promise<void>;
}

export function useVoiceAssistant(): UseVoiceAssistantReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversation, setConversation] = useState<Message[]>([]);

  const clearConversation = useCallback(() => {
    setConversation([]);
  }, []);

  const sendAudioToAI = useCallback(
    async (audioBlob: Blob): Promise<string | null> => {
      try {
        setError(null);
        setIsProcessing(true);

        // Create form data with audio and conversation history
        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.webm");
        formData.append("conversation", JSON.stringify(conversation));

        // Send to chat API
        const chatResponse = await fetch("/api/chat", {
          method: "POST",
          body: formData,
        });

        if (!chatResponse.ok) {
          const errorData = await chatResponse
            .json()
            .catch(() => ({ error: "Failed to process audio" }));
          throw new Error(errorData.error || "Failed to process audio");
        }

        const chatData = await chatResponse.json();
        const aiText = chatData.text;

        if (!aiText) {
          throw new Error("No response from AI");
        }

        // Update conversation history
        setConversation((prev) => [
          ...prev,
          {
            role: "user",
            text: "[Voice input]",
            timestamp: Date.now(),
          },
          {
            role: "model",
            text: aiText,
            timestamp: Date.now(),
          },
        ]);

        return aiText;
      } catch (err) {
        console.error("Error sending audio to AI:", err);
        setError(
          err instanceof Error ? err.message : "Failed to process audio"
        );
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    [conversation]
  );

  const playAudioResponse = useCallback(
    async (text: string): Promise<void> => {
      try {
        setError(null);
        setIsProcessing(true);

        // Send text to TTS API
        const ttsResponse = await fetch("/api/tts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text }),
        });

        if (!ttsResponse.ok) {
          const errorData = await ttsResponse
            .json()
            .catch(() => ({ error: "Failed to generate speech" }));
          throw new Error(errorData.error || "Failed to generate speech");
        }

        const ttsData = await ttsResponse.json();
        const audioBase64 = ttsData.audio;

        if (!audioBase64) {
          throw new Error("No audio generated");
        }

        // Play audio
        const audio = new Audio(`data:audio/wav;base64,${audioBase64}`);

        return new Promise((resolve, reject) => {
          audio.onended = () => {
            setIsProcessing(false);
            resolve();
          };
          audio.onerror = () => {
            setIsProcessing(false);
            reject(new Error("Failed to play audio"));
          };
          audio.play().catch(reject);
        });
      } catch (err) {
        console.error("Error playing audio response:", err);
        setError(
          err instanceof Error ? err.message : "Failed to play audio response"
        );
        setIsProcessing(false);
        throw err;
      }
    },
    []
  );

  return {
    isProcessing,
    error,
    conversation,
    clearConversation,
    sendAudioToAI,
    playAudioResponse,
  };
}
