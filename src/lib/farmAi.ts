/**
 * farmAi.ts — Multi-turn Gemini chat for the Farm Assistant chatbot.
 * Uses the same VITE_GEMINI_API_KEY as the existing Crop Doctor feature.
 * Gemini is FREE via Google AI Studio: https://aistudio.google.com/apikey
 */

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

const GEMINI_MODELS = ['gemini-flash-latest', 'gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-4-argon'];

// Simple sleep helper for retries
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
const ENDPOINT = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
const STREAM_ENDPOINT = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`;

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
export const farmAiConfigured = Boolean(API_KEY);

const SYSTEM_PROMPT = `You are FarmBot, an expert agricultural AI assistant serving farmers in Karnataka, India — specifically in and around Chikkaballapura and the surrounding districts.

Your expertise covers:
- Crop diseases, pests, and nutrient deficiencies (identification and treatment)
- Crop management: sowing times, irrigation, pruning, harvesting
- Fertilizer and pesticide recommendations (organic and chemical)
- Soil health, pH management, and composting
- Weather-related crop protection tips
- Market prices and best selling practices for Karnataka
- Government schemes for farmers (PM-KISAN, soil health card, crop insurance)
- Local crops: tomato, grapes, mulberry, pomegranate, paddy, groundnut, ragi, maize

Language: Always respond in BOTH Kannada first, then English below. Format nicely.
If the user writes in English only, respond in English only.
If the user writes in Kannada (or mixed), respond in Kannada first then English.

Style:
- Be warm, practical, and concise.
- Use bullet points for steps or lists.
- If you're unsure, say so and suggest they consult a local KVK (Krishi Vigyan Kendra).
- Never give harmful advice. For severe issues, recommend professional help.
- Keep responses focused and under 400 words unless more detail is requested.`;

/**
 * Send a chat message and get a streamed response back as an async generator.
 * Caller should collect chunks and update state incrementally.
 */
export async function* sendFarmChat(
  history: ChatMessage[],
  userMessage: string
): AsyncGenerator<string> {
  if (!API_KEY) {
    throw new Error('NO_API_KEY');
  }

  // Build Gemini-format contents from history + new message
  const contents = [
    ...history.map((m) => ({
      role: m.role,
      parts: [{ text: m.text }],
    })),
    {
      role: 'user' as const,
      parts: [{ text: userMessage }],
    },
  ];

  const body = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
      topP: 0.9,
    },
  };  // Try each model in order with retries
  let lastError = '';
  for (const model of GEMINI_MODELS) {
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const res = await fetch(`${STREAM_ENDPOINT(model)}&key=${API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          lastError = `Gemini API error (${res.status}): ${errText}`;
          if (res.status === 503 && attempt < maxRetries) {
            await sleep(1000 * attempt);
            continue; // retry same model
          }
          if (res.status === 400 || res.status === 403) throw new Error(lastError);
          break; // move to next model
        }
        const reader = res.body?.getReader();
        if (!reader) throw new Error('No response body');
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr || jsonStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const chunk: string | undefined = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (chunk) yield chunk;
            } catch {}
          }
        }
        return; // success
      } catch (err) {
        if (err instanceof TypeError) throw err;
        lastError = err instanceof Error ? err.message : String(err);
        if (attempt >= maxRetries) break; // give up on this model
      }
    }
    // after retries for this model, continue to next model
  }
  throw new Error(lastError || 'All Gemini models failed');
}

/** Non-streaming fallback for simpler integrations */
export async function sendFarmChatSimple(
  history: ChatMessage[],
  userMessage: string
): Promise<string> {
  if (!API_KEY) throw new Error('NO_API_KEY');

  const contents = [
    ...history.map((m) => ({
      role: m.role,
      parts: [{ text: m.text }],
    })),
    { role: 'user' as const, parts: [{ text: userMessage }] },
  ];

  const body = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents,
    generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
  };

  for (const model of GEMINI_MODELS) {
    try {
      const res = await fetch(`${ENDPOINT(model)}?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) continue;
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text.trim();
    } catch {
      continue;
    }
  }
  throw new Error('Could not get response from AI');
}

/** Persist chat history in localStorage (last 60 messages) */
const CHAT_STORAGE_KEY = 'farm_chat_history';

export function loadChatHistory(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ChatMessage[];
  } catch {
    return [];
  }
}

export function saveChatHistory(messages: ChatMessage[]): void {
  try {
    // Keep only last 60 messages to avoid storage bloat
    const trimmed = messages.slice(-60);
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Ignore storage errors
  }
}

export function clearChatHistory(): void {
  localStorage.removeItem(CHAT_STORAGE_KEY);
}
