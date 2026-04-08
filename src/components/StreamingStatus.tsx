"use client";

import { MarkdownRenderer } from "./MarkdownRenderer";

interface StreamingStatusProps {
  isStreaming: boolean;
  currentText: string;
}

export function StreamingStatus({ isStreaming, currentText }: StreamingStatusProps) {
  if (!isStreaming && !currentText) {
    return (
      <div className="flex flex-col items-center gap-2">
        <span className="text-sm font-medium tracking-wide uppercase text-zinc-400">
          Press and hold to talk
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 max-w-md">
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${
            isStreaming ? "bg-emerald-500 animate-pulse" : "bg-zinc-500"
          }`}
        />
        <span
          className={`text-sm font-medium tracking-wide uppercase ${
            isStreaming ? "text-emerald-400" : "text-zinc-400"
          }`}
        >
          {isStreaming ? "AI is speaking..." : "Done"}
        </span>
      </div>

      {currentText && (
        <div className="text-center px-4">
          <div className="text-base text-zinc-200 leading-relaxed inline">
            <MarkdownRenderer text={currentText} />
            {isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-cyan-500 animate-pulse align-middle" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
