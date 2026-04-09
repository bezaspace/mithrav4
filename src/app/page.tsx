"use client";

import { useCallback, useEffect, useRef } from "react";
import { PushToTalkButton } from "@/components/PushToTalkButton";
import { StreamingStatus } from "@/components/StreamingStatus";
import { AudioWaveform } from "@/components/AudioWaveform";
import { TtsToggle } from "@/components/TtsToggle";
import { DynamicComponentRenderer } from "@/components/DynamicComponentRenderer";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useStreamingVoiceAssistant } from "@/hooks/useStreamingVoiceAssistant";

export default function VoiceAssistantPage() {
  const {
    recordingState,
    startRecording,
    stopRecording,
    setRecordingState,
    error: recorderError,
  } = useAudioRecorder();

  const {
    isStreaming,
    isProcessing,
    error: assistantError,
    currentStreamingText,
    currentToolResults,
    ttsProvider,
    toggleTtsProvider,
    stopSpeaking,
    sendAudioToAI,
  } = useStreamingVoiceAssistant();

  const handlePressStart = useCallback(async () => {
    // If AI is currently speaking, interrupt and stop
    if (isStreaming || isProcessing) {
      stopSpeaking();
    }
    // Start recording immediately
    await startRecording();
  }, [isStreaming, isProcessing, stopSpeaking, startRecording]);

  const handlePressEnd = useCallback(async () => {
    const audioBlob = await stopRecording();

    if (audioBlob) {
      setRecordingState("processing");
      await sendAudioToAI(audioBlob);
      setRecordingState("idle");
    }
  }, [stopRecording, setRecordingState, sendAudioToAI]);

  const error = recorderError || assistantError;

  // Track if spacebar is currently pressed to prevent repeat events
  const spacePressedRef = useRef(false);

  // Handle spacebar keydown - start recording/interrupt
  const handleKeyDown = useCallback(
    async (e: KeyboardEvent) => {
      // Only respond to Space key, and ignore if already pressed or if typing in an input
      if (
        e.code === "Space" &&
        !spacePressedRef.current &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(
          (e.target as HTMLElement).tagName
        )
      ) {
        e.preventDefault(); // Prevent scrolling
        spacePressedRef.current = true;
        await handlePressStart();
      }
    },
    [handlePressStart]
  );

  // Handle spacebar keyup - stop recording/send
  const handleKeyUp = useCallback(
    async (e: KeyboardEvent) => {
      if (e.code === "Space" && spacePressedRef.current) {
        e.preventDefault();
        spacePressedRef.current = false;
        await handlePressEnd();
      }
    },
    [handlePressEnd]
  );

  // Add keyboard event listeners
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // Determine display state
  // Priority: recording > speaking/processing > idle
  // When user is actively pressing the button (recording), that takes priority
  const displayState =
    recordingState === "recording"
      ? "recording"
      : isStreaming
      ? "speaking"
      : isProcessing
      ? "processing"
      : recordingState;

  return (
    <main className="flex-1 bg-[#0a0a0a] flex flex-col min-h-[calc(100vh-4rem)] relative">
      {/* Simplified Header */}
      <header className="border-b border-zinc-800 px-6 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-zinc-100">
              Voice Assistant
            </h1>
            <p className="text-xs text-zinc-500">
              తెలుగు • Streaming mode
            </p>
          </div>
          <div className="flex items-center gap-3">
            <TtsToggle provider={ttsProvider} onToggle={toggleTtsProvider} />
          </div>
        </div>
      </header>

      {/* Main viewport with streaming content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
        {/* Waveform visualization */}
        <div className="mb-8">
          <AudioWaveform state={displayState} />
        </div>

        {/* Streaming status - always show, handles empty state */}
        <div className="max-w-2xl w-full">
          <StreamingStatus
            isStreaming={isStreaming}
            currentText={currentStreamingText}
          />
        </div>

        {/* Dynamic tool results (charts) */}
        {currentToolResults.length > 0 && (
          <div className="mt-6 w-full max-w-3xl">
            <DynamicComponentRenderer toolResults={currentToolResults} />
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mt-4 max-w-md mx-auto">
            <p className="text-sm text-red-400 bg-red-950/30 px-4 py-2 rounded-lg">
              {error}
            </p>
          </div>
        )}
      </div>

      {/* Floating push-to-talk button at bottom right */}
      <div className="absolute bottom-6 right-6">
        <PushToTalkButton
          state={displayState}
          onPressStart={handlePressStart}
          onPressEnd={handlePressEnd}
          size="compact"
        />
      </div>
    </main>
  );
}
