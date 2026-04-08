"use client";

import ReactMarkdown from "react-markdown";

interface MarkdownRendererProps {
  text: string;
  className?: string;
}

/**
 * Safely renders markdown text with custom styling.
 * Converts markdown syntax (**bold**, *italic*, etc.) to formatted HTML.
 */
export function MarkdownRenderer({ text, className = "" }: MarkdownRendererProps) {
  if (!text) return null;

  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        components={{
          // Override default elements with custom styling
          p: ({ children }) => (
            <span className="inline">{children}</span>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-zinc-100">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-zinc-300">{children}</em>
          ),
          code: ({ children }) => (
            <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-xs font-mono text-zinc-300">
              {children}
            </code>
          ),
          h1: ({ children }) => (
            <h1 className="text-lg font-bold text-zinc-100 my-2">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-bold text-zinc-100 my-2">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-bold text-zinc-100 my-1">{children}</h3>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside my-2 space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside my-2 space-y-1">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-sm leading-relaxed">{children}</li>
          ),
          br: () => <br />,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
