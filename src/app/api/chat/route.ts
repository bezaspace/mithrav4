import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

interface Message {
  role: "user" | "model";
  text: string;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;
    const conversationData = formData.get("conversation") as string;
    const conversation: Message[] = conversationData
      ? JSON.parse(conversationData)
      : [];

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    // Convert audio file to base64
    const bytes = await audioFile.arrayBuffer();
    const base64Audio = Buffer.from(bytes).toString("base64");

    // Initialize Gemini client
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Build conversation history
    const contents: Array<
      { role: "user" | "model"; parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> }
    > = [];

    // Add system prompt as first user message if no history (Telugu)
    if (conversation.length === 0) {
      contents.push({
        role: "user",
        parts: [
          {
            text: "You are a friendly, conversational AI assistant. The user will speak in Telugu language. Listen to the audio and respond naturally in Telugu as if talking to a friend. Keep your response very brief and engaging - maximum 500 characters. Speak in a conversational tone in Telugu.",
          },
        ],
      });
      contents.push({
        role: "model",
        parts: [{ text: "అర్థమైంది! నేను సిద్ధంగా ఉన్నాను. మీరు తెలుగులో మాట్లాడండి." }],
      });
    }

    // Add conversation history
    for (const message of conversation) {
      contents.push({
        role: message.role,
        parts: [{ text: message.text }],
      });
    }

    // Add current audio input
    contents.push({
      role: "user",
      parts: [
        {
          inlineData: {
            mimeType: audioFile.type || "audio/webm",
            data: base64Audio,
          },
        },
      ],
    });

    // Generate response using Gemini 3.1 Flash Lite with max output limit
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: contents,
      config: {
        maxOutputTokens: 150, // Approximately 500-600 characters for Telugu
      },
    });

    const text = response.text;

    if (!text) {
      return NextResponse.json(
        { error: "No response generated" },
        { status: 500 }
      );
    }

    return NextResponse.json({ text });
  } catch (error) {
    console.error("Error processing audio:", error);
    return NextResponse.json(
      { error: "Failed to process audio" },
      { status: 500 }
    );
  }
}
