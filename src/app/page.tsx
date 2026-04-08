"use client";

import { useCallback } from "react";
import { PushToTalkButton } from "@/components/PushToTalkButton";
import { StreamingStatus } from "@/components/StreamingStatus";
import { AudioWaveform } from "@/components/AudioWaveform";
import { ConversationHistory } from "@/components/ConversationHistory";
import { TtsToggle } from "@/components/TtsToggle";
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
    conversation,
    currentStreamingText,
    currentToolResults,
    ttsProvider,
    toggleTtsProvider,
    clearConversation,
    sendAudioToAI,
  } = useStreamingVoiceAssistant();

  const handlePressStart = useCallback(async () => {
    await startRecording();
  }, [startRecording]);

  const handlePressEnd = useCallback(async () => {
    const audioBlob = await stopRecording();

    if (audioBlob) {
      setRecordingState("processing");
      await sendAudioToAI(audioBlob);
      setRecordingState("idle");
    }
  }, [stopRecording, setRecordingState, sendAudioToAI]);

  const error = recorderError || assistantError;

  // Determine display state
  const displayState = isStreaming
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
            <div className="text-xs text-zinc-600">
              {conversation.length > 0 && (
                <span>{Math.floor(conversation.length / 2)} exchanges</span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main viewport with conversation history */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Waveform visualization at top */}
          <div className="flex justify-center mb-6">
            <AudioWaveform state={displayState} />
          </div>

          {/* Conversation history */}
          <ConversationHistory
            messages={conversation}
            streamingToolResults={currentToolResults}
            onClear={clearConversation}
          />

          {/* Streaming status for current response */}
          {currentStreamingText && (
            <div className="mt-4">
              <StreamingStatus
                isStreaming={isStreaming}
                currentText={currentStreamingText}
              />
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
      </div>

      {/* Floating push-to-talk button at bottom right */}
      <div className="absolute bottom-6 right-6">
        <PushToTalkButton
          state={recordingState}
          onPressStart={handlePressStart}
          onPressEnd={handlePressEnd}
          disabled={isProcessing || isStreaming}
          size="compact"
        />
      </div>
    </main>
  );
}
