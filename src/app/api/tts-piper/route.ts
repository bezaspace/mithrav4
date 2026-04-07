import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import { promises as fs } from "fs";
import { tmpdir } from "os";
import { join } from "path";

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "No text provided" },
        { status: 400 }
      );
    }

    // Get Piper configuration from environment
    const piperPath = process.env.PIPER_PATH || "/home/harsha/pocket_tts_app/venv/bin/piper";
    const piperModel = process.env.PIPER_MODEL || 
      "/home/harsha/pocket_tts_app/te_IN-maya-medium.onnx";

    // Generate unique temp file names
    const tempId = `piper_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const inputFile = join(tmpdir(), `${tempId}.txt`);
    const outputFile = join(tmpdir(), `${tempId}.wav`);

    try {
      // Write text to temp file
      await fs.writeFile(inputFile, text, "utf-8");

      // Spawn Piper process
      await new Promise<void>((resolve, reject) => {
        const piper = spawn(piperPath, [
          "-m", piperModel,
          "-i", inputFile,
          "-f", outputFile,
          "--sentence-silence", "0.2"
        ]);

        let stderr = "";

        piper.stderr?.on("data", (data) => {
          stderr += data.toString();
        });

        piper.on("close", (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Piper exited with code ${code}: ${stderr}`));
          }
        });

        piper.on("error", (err) => {
          reject(new Error(`Failed to start Piper: ${err.message}`));
        });
      });

      // Read the generated WAV file
      const audioBuffer = await fs.readFile(outputFile);

      // Return audio as response
      return new NextResponse(audioBuffer, {
        headers: {
          "Content-Type": "audio/wav",
          "Cache-Control": "no-cache",
        },
      });

    } finally {
      // Cleanup temp files
      try {
        await fs.unlink(inputFile).catch(() => {});
        await fs.unlink(outputFile).catch(() => {});
      } catch {
        // Ignore cleanup errors
      }
    }

  } catch (error) {
    console.error("Piper TTS error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate speech" },
      { status: 500 }
    );
  }
}
