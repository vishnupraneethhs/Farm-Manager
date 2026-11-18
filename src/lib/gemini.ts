const GEMINI_MODELS = ['gemini-3-flash-preview', 'gemini-flash-latest'];
const ENDPOINT = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

export const geminiConfigured = Boolean(API_KEY);

const SYSTEM_INSTRUCTION = `You are an expert agricultural scientist in Chikkaballapura, Karnataka, India. Identify the crop disease, pest, or nutrient deficiency from the image. Provide clear, practical, low-cost treatment steps in simple Kannada first, followed by English.`;

interface GeminiPart {
  text?: string;
  inline_data?: { mime_type: string; data: string };
}

export async function diagnoseLeaf(
  imageDataUrl: string,
  question?: string
): Promise<string> {
  if (!API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  const base64 = imageDataUrl.split(',')[1] || '';
  const mimeType = imageDataUrl.match(/data:(.*?);/)?.[1] || 'image/jpeg';

  const parts: GeminiPart[] = [
    { text: SYSTEM_INSTRUCTION },
    { inline_data: { mime_type: mimeType, data: base64 } },
  ];
  if (question?.trim()) {
    parts.push({ text: `Farmer's question: ${question}` });
  }

  const body = {
    contents: [{ role: 'user', parts }],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 1024,
    },
  };

  let lastError = '';
  for (const model of GEMINI_MODELS) {
    try {
      const res = await fetch(`${ENDPOINT(model)}?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        lastError = `Gemini API error (${res.status}): ${errText}`;
        // Try next model on 404/deprecation; throw on auth errors
        if (res.status === 400 || res.status === 403) throw new Error(lastError);
        continue;
      }

      const data = await res.json();
      const text: string | undefined =
        data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error('No response text from Gemini');
      }
      return text.trim();
    } catch (err) {
      // Network errors — don't try next model, rethrow
      if (err instanceof TypeError) throw err;
      lastError = err instanceof Error ? err.message : String(err);
      // For non-network errors, try next model
      if (err instanceof Error && err.message.includes('API key')) throw err;
    }
  }
  throw new Error(lastError || 'All Gemini models failed');
}
