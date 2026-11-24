// testGemini.js (uses global fetch)
const key = process.env.VITE_GEMINI_API_KEY;
if (!key) {
  console.error('No API key');
  process.exit(1);
}
(async () => {
  const body = {
    system_instruction: { parts: [{ text: 'You are a helpful assistant.' }] },
    contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 200 }
  };
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  console.log('status', res.status);
  console.log('response', JSON.stringify(data, null, 2));
})();
