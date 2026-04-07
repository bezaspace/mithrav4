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
    <main className="min-h-screen bg-[#0a0a0a] flex">
      {/* Left sidebar - Conversation History */}
      <aside className="w-80 border-r border-zinc-800 hidden md:flex flex-col">
        <ConversationHistory
          messages={conversation}
          onClear={clearConversation}
        />
      </aside>

      {/* Main interaction area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-zinc-800 px-6 py-4">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            <div>
              <h1 className="text-lg font-semibold text-zinc-100">
                Voice Assistant
              </h1>
              <p className="text-xs text-zinc-500">
                తెలుగు • Streaming mode • Low latency
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

        {/* Center content */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 relative">
          {/* Waveform visualization */}
          <AudioWaveform state={displayState} />

          {/* Push to talk button */}
          <div className="mt-4">
            <PushToTalkButton
              state={recordingState}
              onPressStart={handlePressStart}
              onPressEnd={handlePressEnd}
              disabled={isProcessing || isStreaming}
            />
          </div>

          {/* Streaming status */}
          <div className="mt-6 max-w-lg w-full">
            <StreamingStatus
              isStreaming={isStreaming}
              currentText={currentStreamingText}
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="mt-4 max-w-md text-center">
              <p className="text-sm text-red-400 bg-red-950/30 px-4 py-2 rounded-lg">
                {error}
              </p>
            </div>
          )}

          {/* Mobile conversation toggle */}
          <div className="md:hidden absolute bottom-4 left-4 right-4">
            <button
              onClick={() => {
                const sidebar = document.getElementById("mobile-conversation");
                sidebar?.classList.toggle("hidden");
              }}
              className="w-full py-3 bg-zinc-800 rounded-lg text-sm text-zinc-300 flex items-center justify-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              View Conversation ({Math.floor(conversation.length / 2)})
            </button>
          </div>

          {/* Mobile conversation panel */}
          <div
            id="mobile-conversation"
            className="hidden md:hidden absolute inset-x-0 bottom-0 top-20 bg-[#0a0a0a] border-t border-zinc-800 z-50"
          >
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                <h2 className="text-sm font-medium text-zinc-300">
                  Conversation
                </h2>
                <button
                  onClick={() => {
                    const sidebar =
                      document.getElementById("mobile-conversation");
                    sidebar?.classList.add("hidden");
                  }}
                  className="text-zinc-500 hover:text-zinc-300"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <ConversationHistory
                  messages={conversation}
                  onClear={() => {
                    clearConversation();
                    const sidebar =
                      document.getElementById("mobile-conversation");
                    sidebar?.classList.add("hidden");
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-zinc-800 px-6 py-3">
          <p className="text-xs text-zinc-600 text-center">
            పట్టుకోండి మాట్లాడండి • Press and hold to speak • AI responds in real-time
          </p>
        </footer>
      </div>
    </main>
  );
}
