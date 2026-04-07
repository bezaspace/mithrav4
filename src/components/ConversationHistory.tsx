"use client";

interface Message {
  role: "user" | "model";
  text: string;
  timestamp: number;
}

interface ConversationHistoryProps {
  messages: Message[];
  onClear: () => void;
}

export function ConversationHistory({
  messages,
  onClear,
}: ConversationHistoryProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-600">
        <svg
          className="w-12 h-12 mb-3 opacity-30"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <p className="text-sm">No conversation yet</p>
        <p className="text-xs mt-1 opacity-60">
          Press and hold the button to start
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <h2 className="text-sm font-medium text-zinc-300">Conversation</h2>
        <button
          onClick={onClear}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1"
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
          Clear
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] px-4 py-3 rounded-2xl ${
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
                <p className="text-sm leading-relaxed">{message.text}</p>
              )}
              <span className="text-[10px] opacity-40 mt-2 block">
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
