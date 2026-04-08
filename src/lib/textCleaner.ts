// Utility to clean text for TTS (Text-to-Speech) by removing markdown formatting
// while keeping the original formatted text for UI display

import removeMd from "remove-markdown";

/**
 * Removes markdown formatting from text to make it suitable for TTS engines.
 * This prevents TTS from reading asterisks, hashes, and other markdown syntax literally.
 *
 * @param text - The markdown-formatted text
 * @returns Clean plain text suitable for TTS
 *
 * Examples:
 * - `**bold text**` → `bold text`
 * - `*italic*` → `italic`
 * - `**1. Item**` → `1. Item`
 * - `# Heading` → `Heading`
 */
export function cleanTextForTTS(text: string): string {
  if (!text || typeof text !== "string") {
    return "";
  }

  return removeMd(text, {
    stripListLeaders: false, // Keep "1." "2." as they sound natural when spoken
    listUnicodeChar: "",
    gfm: true, // Support GitHub-flavored markdown (**bold**, __underline__, etc.)
    useImgAltText: false, // No images expected in Gemini output
    abbr: false,
    replaceLinksWithURL: false, // Keep link text, remove URL
  });
}

/**
 * Additional cleanup for Telugu text if needed
 * Handles any Telugu-specific formatting issues
 */
export function cleanTeluguTextForTTS(text: string): string {
  let cleaned = cleanTextForTTS(text);

  // Remove any remaining special characters that might confuse TTS
  // but preserve Telugu script and common punctuation
  cleaned = cleaned
    // Remove multiple consecutive spaces
    .replace(/\s+/g, " ")
    // Trim whitespace
    .trim();

  return cleaned;
}
