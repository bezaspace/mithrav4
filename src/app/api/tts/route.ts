import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "No text provided" },
        { status: 400 }
      );
    }

    // Truncate text if too long (Bulbul v3 max is 2500 chars)
    const truncatedText = text.slice(0, 2500);

    // Call Sarvam AI TTS API
    const response = await fetch("https://api.sarvam.ai/text-to-speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": process.env.SARVAM_API_KEY || "",
      },
      body: JSON.stringify({
        text: truncatedText,
        target_language_code: "te-IN", // Telugu language
        speaker: "shubh",
        model: "bulbul:v3",
        pace: 1.0,
        speech_sample_rate: "24000",
        output_audio_codec: "wav",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Sarvam API error:", errorData);
      return NextResponse.json(
        { error: "Failed to generate speech" },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (!data.audios || data.audios.length === 0) {
      return NextResponse.json(
        { error: "No audio generated" },
        { status: 500 }
      );
    }

    // Return base64 audio string
    return NextResponse.json({
      audio: data.audios[0],
      format: "wav",
    });
  } catch (error) {
    console.error("Error generating speech:", error);
    return NextResponse.json(
      { error: "Failed to generate speech" },
      { status: 500 }
    );
  }
}
