// testChat.js – simple request using gemini-flash-latest
const key = process.env.VITE_GEMINI_API_KEY;
if (!key) {
  console.error('No API key');
  process.exit(1);
}
(async () => {
  const body = {
    system_instruction: { parts: [{ text: 'You are a helpful assistant.' }] },
    contents: [{ role: 'user', parts: [{ text: 'Hello, how can I improve soil fertility?' }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
  };
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    console.log('status', res.status);
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Fetch error', e);
  }
})();
