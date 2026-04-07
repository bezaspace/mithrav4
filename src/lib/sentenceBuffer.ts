// SentenceBuffer: Accumulates text chunks and emits complete sentences
export class SentenceBuffer {
  private buffer: string = "";
  private sentenceDelimiters = /[.!?]+\s+/;
  private minChunkLength = 30; // Minimum characters before forcing a flush
  private maxChunkLength = 150; // Maximum characters before forcing a flush
  private pendingCallbacks: ((sentence: string) => void)[] = [];

  constructor(
    private onSentence: (sentence: string) => void,
    private onFlush?: () => void
  ) {}

  // Add text chunk to buffer and process
  add(chunk: string): void {
    this.buffer += chunk;
    this.process();
  }

  // Process buffer and extract complete sentences
  private process(): void {
    // Check for sentence delimiters
    const matches = this.buffer.match(this.sentenceDelimiters);

    if (matches) {
      // Find the position after the first delimiter
      const delimiterIndex = this.buffer.search(this.sentenceDelimiters);
      if (delimiterIndex !== -1) {
        const endPos =
          delimiterIndex + matches[0].length - (matches[0].includes(" ") ? 1 : 0);
        const sentence = this.buffer.slice(0, endPos).trim();
        this.buffer = this.buffer.slice(endPos).trim();

        if (sentence.length > 0) {
          this.onSentence(sentence);
        }

        // Recursively process remaining buffer
        if (this.buffer.length > 0) {
          this.process();
        }
      }
    }

    // Force flush if buffer is too long (emergency break)
    if (this.buffer.length >= this.maxChunkLength) {
      const lastSpace = this.buffer.lastIndexOf(" ", this.maxChunkLength);
      const breakPoint = lastSpace > this.minChunkLength ? lastSpace : this.maxChunkLength;
      const sentence = this.buffer.slice(0, breakPoint).trim();
      this.buffer = this.buffer.slice(breakPoint).trim();

      if (sentence.length > 0) {
        this.onSentence(sentence);
      }
    }
  }

  // Force flush remaining buffer
  flush(): void {
    if (this.buffer.trim().length > 0) {
      this.onSentence(this.buffer.trim());
      this.buffer = "";
    }
    this.onFlush?.();
  }

  // Check if buffer is empty
  isEmpty(): boolean {
    return this.buffer.length === 0;
  }

  // Get current buffer content
  getBuffer(): string {
    return this.buffer;
  }

  // Clear buffer
  clear(): void {
    this.buffer = "";
  }
}

// Utility to detect if text ends with a complete sentence
export function isCompleteSentence(text: string): boolean {
  return /[.!?]+\s*$/.test(text.trim());
}

// Utility to split text into chunks at word boundaries
export function splitIntoChunks(text: string, maxLength: number): string[] {
  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      chunks.push(remaining);
      break;
    }

    // Find last space before maxLength
    const lastSpace = remaining.lastIndexOf(" ", maxLength);
    const breakPoint = lastSpace > 0 ? lastSpace : maxLength;

    chunks.push(remaining.slice(0, breakPoint));
    remaining = remaining.slice(breakPoint).trim();
  }

  return chunks;
}
