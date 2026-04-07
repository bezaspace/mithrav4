"use client";

import { RecordingState } from "@/hooks/useAudioRecorder";

interface AudioWaveformProps {
  state: RecordingState;
}

export function AudioWaveform({ state }: AudioWaveformProps) {
  const isActive = state === "recording" || state === "speaking";

  return (
    <div className="flex items-center justify-center gap-1 h-12">
      {isActive ? (
        <>
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`w-1 rounded-full animate-pulse ${
                state === "recording"
                  ? "bg-red-500"
                  : state === "speaking"
                  ? "bg-emerald-500"
                  : "bg-cyan-500"
              }`}
              style={{
                height: `${Math.max(20, Math.random() * 40 + 20)}px`,
                animationDelay: `${i * 100}ms`,
                animationDuration: `${400 + i * 100}ms`,
              }}
            />
          ))}
        </>
      ) : (
        <div className="w-32 h-px bg-zinc-800" />
      )}
    </div>
  );
}
