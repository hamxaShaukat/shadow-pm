import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GEMINI_API_KEY!,
});

export type ThinkingLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface GeminiResponse {
  text: string;
  thoughtSignature?: string;
  reasoning?: string;
}

export interface GeminiConfig {
  model?: string;
  thinkingLevel?: ThinkingLevel;
  thoughtSignature?: string;
}

/**
 * HELPER: Retry with Backoff 
 * Handles 503 (Overloaded) and 429 (Rate Limit) errors automatically.
 */
async function retryRequest<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      const isTransient = err.status === 503 || err.status === 429 || err.message?.includes("overloaded");
      if (isTransient && i < retries - 1) {
        const wait = Math.pow(2, i) * 2000;
        console.warn(`Gemini Busy. Retrying in ${wait}ms...`);
        await new Promise(r => setTimeout(r, wait));
        continue;
      }
      throw err;
    }
  }
  throw new Error("Max retries reached");
}

function extractText(response: any): string {
  try {
    return typeof response.text === 'function' ? response.text() : 
           (response.candidates?.[0]?.content?.parts?.[0]?.text || "");
  } catch (e) {
    return "";
  }
}

export async function generateWithGemini(
  prompt: string,
  config: GeminiConfig = {}
): Promise<GeminiResponse> {
  const modelId = config.model || 'gemini-3-flash-preview';

  return await retryRequest(async () => {
    const result = await ai.models.generateContent({
      model: modelId,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      // 2026 Standardized Config Structure
      config: {
        thoughtSignature: config.thoughtSignature,
        thinkingConfig: {
          includeThoughts: true,
          thinkingLevel: config.thinkingLevel || 'MEDIUM',
        }
      } as any,
    });

    const response = await result;
    const text = extractText(response);
    const lastPart = (response as any).candidates?.[0]?.content?.parts?.at(-1);

    return {
      text,
      thoughtSignature: lastPart?.thoughtSignature,
      reasoning: lastPart?.thoughtSummary || "",
    };
  });
}

export async function generateWithMedia(
  prompt: string,
  videoFile: File,
  config: GeminiConfig = {}
): Promise<GeminiResponse> {
  return await retryRequest(async () => {
    // 1. Upload
    const upload = await ai.files.upload({
      file: videoFile,
      config: { mimeType: videoFile.type || 'video/mp4' },
    });

    // 2. Poll
    let file = await ai.files.get({ name: upload.name! });
    while (file.state === "PROCESSING") {
      await new Promise((r) => setTimeout(r, 3000)); // 3s for video stability
      file = await ai.files.get({ name: upload.name! });
    }

    // 3. Generate
    const result = await ai.models.generateContent({
      model: config.model || 'gemini-3-flash-preview',
      contents: [
        { fileData: { fileUri: file.uri, mimeType: file.mimeType } },
        { text: prompt }
      ],
      config: { 
        thinkingConfig: { includeThoughts: true, thinkingLevel: 'MEDIUM' },
        thoughtSignature: config.thoughtSignature
      } as any,
    });

    const response = await result;
    const text = extractText(response);
    const lastPart = (response as any).candidates?.[0]?.content?.parts?.at(-1);

    return {
      text,
      thoughtSignature: lastPart?.thoughtSignature,
      reasoning: lastPart?.thoughtSummary || ""
    };
  });
}