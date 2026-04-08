"use client";

import { RecordingState } from "@/hooks/useAudioRecorder";

type ButtonSize = "large" | "compact";

interface PushToTalkButtonProps {
  state: RecordingState;
  onPressStart: () => void;
  onPressEnd: () => void;
  disabled?: boolean;
  size?: ButtonSize;
}

export function PushToTalkButton({
  state,
  onPressStart,
  onPressEnd,
  disabled = false,
  size = "large",
}: PushToTalkButtonProps) {
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    if (!disabled && state === "idle") {
      onPressStart();
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.preventDefault();
    if (state === "recording") {
      onPressEnd();
    }
  };

  const handlePointerLeave = (e: React.PointerEvent) => {
    e.preventDefault();
    if (state === "recording") {
      onPressEnd();
    }
  };

  const getButtonStyles = () => {
    const sizeStyles = size === "compact"
      ? "w-20 h-20"
      : "w-36 h-36";

    const baseStyles = `
      relative ${sizeStyles} rounded-full cursor-pointer
      transition-all duration-200 ease-out
      flex items-center justify-center
      select-none touch-none
    `;

    if (disabled) {
      return `${baseStyles} bg-zinc-800 cursor-not-allowed opacity-50`;
    }

    switch (state) {
      case "recording":
        return `${baseStyles} bg-red-500 scale-95 shadow-[0_0_40px_rgba(239,68,68,0.5)]`;
      case "processing":
        return `${baseStyles} bg-amber-500 cursor-wait animate-pulse shadow-[0_0_40px_rgba(245,158,11,0.5)]`;
      case "speaking":
        return `${baseStyles} bg-emerald-500 cursor-wait shadow-[0_0_40px_rgba(16,185,129,0.5)]`;
      case "idle":
      default:
        return `${baseStyles} bg-cyan-600 hover:bg-cyan-500 hover:scale-105 shadow-[0_0_30px_rgba(8,145,178,0.4)] active:scale-95`;
    }
  };

  return (
    <button
      className={getButtonStyles()}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onPointerCancel={handlePointerUp}
      disabled={disabled || state === "processing" || state === "speaking"}
      aria-label={
        state === "recording" ? "Recording... Release to send" : "Push to talk"
      }
    >
      {/* Inner circle with icon */}
      <div
        className={`
          ${size === "compact" ? "w-14 h-14" : "w-28 h-28"} rounded-full flex items-center justify-center
          transition-all duration-200
          ${state === "recording" ? "bg-red-600" : "bg-zinc-900"}
        `}
      >
        {state === "recording" ? (
          // Recording icon (square)
          <div className={`${size === "compact" ? "w-5 h-5" : "w-8 h-8"} bg-white rounded-md`} />
        ) : state === "processing" ? (
          // Processing icon (dots)
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`${size === "compact" ? "w-1.5 h-1.5" : "w-2 h-2"} bg-amber-200 rounded-full animate-bounce`}
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        ) : state === "speaking" ? (
          // Speaking icon (sound waves)
          <svg
            className={`${size === "compact" ? "w-5 h-5" : "w-8 h-8"} text-emerald-200`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
            />
          </svg>
        ) : (
          // Idle icon (microphone)
          <svg
            className={`${size === "compact" ? "w-5 h-5" : "w-8 h-8"} text-cyan-200`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
        )}
      </div>

      {/* Ripple effect when recording */}
      {state === "recording" && (
        <>
          <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-20" />
          <div
            className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping"
            style={{ animationDelay: "0.2s", animationDuration: "1.5s" }}
          />
        </>
      )}
    </button>
  );
}
