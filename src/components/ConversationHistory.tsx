"use client";

import { MarkdownRenderer } from "./MarkdownRenderer";
import { DynamicComponentRenderer, type ToolResult } from "./DynamicComponentRenderer";

interface Message {
  role: "user" | "model";
  text: string;
  timestamp: number;
  toolResults?: ToolResult[];
}

interface ConversationHistoryProps {
  messages: Message[];
  streamingToolResults?: ToolResult[];
  onClear: () => void;
}

export function ConversationHistory({
  messages,
  streamingToolResults,
  onClear,
}: ConversationHistoryProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-600">
        <svg
          className="w-16 h-16 mb-4 opacity-30"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
          />
        </svg>
        <p className="text-base font-medium">Press and hold to speak</p>
        <p className="text-sm mt-2 opacity-60">
          Your conversation will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Clear button at top */}
      <div className="flex justify-end">
        <button
          onClick={onClear}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-zinc-800"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          Clear conversation
        </button>
      </div>

      {/* Messages */}
      <div className="space-y-6">
        {messages.map((message, index) => (
          <div key={index} className="space-y-3">
            {/* Message bubble */}
            <div
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-2xl px-5 py-4 rounded-2xl ${
                  message.role === "user"
                    ? "bg-cyan-900/40 text-cyan-50 rounded-br-md"
                    : "bg-zinc-800 text-zinc-200 rounded-bl-md"
                }`}
              >
                {message.role === "user" && message.text === "[Voice input]" ? (
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-cyan-400"
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
                    <span className="text-sm italic opacity-80">Voice message</span>
                  </div>
                ) : (
                  <div className="text-sm leading-relaxed">
                    <MarkdownRenderer text={message.text} />
                  </div>
                )}
                <span className="text-[10px] opacity-40 mt-2 block">
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
            
            {/* Dynamic components for this message (only for model messages) */}
            {message.role === "model" && message.toolResults && message.toolResults.length > 0 && (
              <div className="flex justify-start mt-3">
                <div className="w-full max-w-3xl">
                  <DynamicComponentRenderer toolResults={message.toolResults} />
                </div>
              </div>
            )}
          </div>
        ))}
        
        {/* Streaming tool results (for current streaming message) */}
        {streamingToolResults && streamingToolResults.length > 0 && (
          <div className="flex justify-start mt-3">
            <div className="w-full max-w-3xl">
              <DynamicComponentRenderer toolResults={streamingToolResults} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
