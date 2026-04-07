"use client";

export type TtsProvider = "sarvam" | "piper";

interface TtsToggleProps {
  provider: TtsProvider;
  onToggle: () => void;
}

export function TtsToggle({ provider, onToggle }: TtsToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 transition-colors text-xs"
    >
      <span className="text-zinc-400">TTS:</span>
      <div className="flex items-center gap-1.5">
        <div
          className={`w-2 h-2 rounded-full ${
            provider === "sarvam" ? "bg-cyan-500" : "bg-emerald-500"
          }`}
        />
        <span className="text-zinc-200 font-medium">
          {provider === "sarvam" ? "Sarvam AI" : "Piper (Local)"}
        </span>
      </div>
      <svg
        className="w-3 h-3 text-zinc-500 ml-1"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
        />
      </svg>
    </button>
  );
}
