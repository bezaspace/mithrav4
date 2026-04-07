"use client";

import { RecordingState } from "@/hooks/useAudioRecorder";

interface StatusIndicatorProps {
  state: RecordingState;
}

export function StatusIndicator({ state }: StatusIndicatorProps) {
  const getStatusText = () => {
    switch (state) {
      case "idle":
        return "Press and hold to talk";
      case "recording":
        return "Listening...";
      case "processing":
        return "Thinking...";
      case "speaking":
        return "Speaking...";
      default:
        return "";
    }
  };

  const getStatusColor = () => {
    switch (state) {
      case "idle":
        return "text-zinc-400";
      case "recording":
        return "text-red-400";
      case "processing":
        return "text-amber-400";
      case "speaking":
        return "text-emerald-400";
      default:
        return "text-zinc-400";
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <span
        className={`text-sm font-medium tracking-wide uppercase ${getStatusColor()}`}
      >
        {getStatusText()}
      </span>
    </div>
  );
}
