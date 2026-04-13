"use client";

import { TtsProvider } from "@/types/tts";

interface TtsToggleProps {
  provider: TtsProvider;
  onToggle: () => void;
}

const PROVIDERS: { value: TtsProvider; label: string; color: string }[] = [
  { value: "sarvam", label: "Sarvam AI", color: "bg-cyan-500" },
  { value: "piper", label: "Piper (Local)", color: "bg-emerald-500" },
  { value: "none", label: "None (Text Only)", color: "bg-zinc-500" },
];

export function TtsToggle({ provider, onToggle }: TtsToggleProps) {
  const currentIndex = PROVIDERS.findIndex((p) => p.value === provider);
  const active = PROVIDERS[currentIndex];

  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 transition-colors text-xs"
    >
      <span className="text-zinc-400">TTS:</span>
      <div className="flex items-center gap-1.5">
        <div className={`w-2 h-2 rounded-full ${active.color}`} />
        <span className="text-zinc-200 font-medium">{active.label}</span>
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
