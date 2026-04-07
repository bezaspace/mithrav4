"use client";

import { useState, useRef, useCallback } from "react";

export type RecordingState = "idle" | "recording" | "processing" | "speaking";

interface UseAudioRecorderReturn {
  recordingState: RecordingState;
  audioBlob: Blob | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  setRecordingState: (state: RecordingState) => void;
  error: string | null;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      audioChunksRef.current = [];

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4",
      });

      mediaRecorderRef.current = mediaRecorder;

      // Collect audio chunks
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // When recording stops, create blob
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType,
        });
        setAudioBlob(audioBlob);

        // Stop all tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());
      };

      // Start recording
      mediaRecorder.start();
      setRecordingState("recording");
    } catch (err) {
      console.error("Error starting recording:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to access microphone. Please allow microphone permissions."
      );
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current;

      if (!mediaRecorder || mediaRecorder.state === "inactive") {
        resolve(null);
        return;
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType,
        });
        setAudioBlob(audioBlob);

        // Stop all tracks
        const stream = mediaRecorder.stream;
        stream.getTracks().forEach((track) => track.stop());

        resolve(audioBlob);
      };

      mediaRecorder.stop();
    });
  }, []);

  return {
    recordingState,
    audioBlob,
    startRecording,
    stopRecording,
    setRecordingState,
    error,
  };
}
