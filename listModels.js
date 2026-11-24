// listModels.js – fetches available Gemini models
const key = process.env.VITE_GEMINI_API_KEY;
if (!key) {
  console.error('No API key');
  process.exit(1);
}
(async () => {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const data = await res.json();
    console.log('status', res.status);
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error:', e);
  }
})();
