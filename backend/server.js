const express = require('express');
const cors = require('cors');

const app = express();

// Images arrive as base64 which can be a few MB — raise the body size limit.
app.use(cors());
app.use(express.json({ limit: '15mb' }));

const PORT = process.env.PORT || 3000;
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const MODEL = process.env.OLLAMA_MODEL || 'llava';

const SYSTEM_PROMPT = `You are assisting a visually impaired person by describing their surroundings.
Describe this scene in 1-3 short, natural spoken sentences.
Prioritize: obstacles, people, doorways/stairs, and objects close by that they'd want to know about.
Mention rough position (left, right, ahead) when it's clear from the image.
Speak calmly and plainly, like a guide walking beside them. Do not mention that it's an image or photo.`;

app.get('/health', (req, res) => {
  res.json({ status: 'ok', model: MODEL, ollama: OLLAMA_URL });
});

app.post('/describe', async (req, res) => {
  const { image } = req.body;

  if (!image) {
    return res.status(400).json({ error: 'No image provided. Expected { image: "<base64>" }' });
  }

  try {
    const ollamaResponse = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        prompt: SYSTEM_PROMPT,
        images: [image],
        stream: false,
      }),
    });

    if (!ollamaResponse.ok) {
      const errText = await ollamaResponse.text();
      console.error('Ollama error:', errText);
      return res.status(502).json({
        error: `Ollama returned an error (${ollamaResponse.status}). Is the model pulled and Ollama running?`,
        detail: errText,
      });
    }

    const data = await ollamaResponse.json();
    const description = (data.response || '').trim();

    console.log('Description:', description);
    res.json({ description });
  } catch (err) {
    console.error('Error contacting Ollama:', err.message);
    res.status(500).json({
      error: 'Could not reach Ollama. Make sure "ollama serve" is running and the model is pulled.',
      detail: err.message,
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\nScene Narrator backend running on http://0.0.0.0:${PORT}`);
  console.log(`Forwarding image descriptions to Ollama at ${OLLAMA_URL} using model "${MODEL}"`);
  console.log(`\nFind your Mac's local IP with: ipconfig getifaddr en0`);
  console.log(`Then set that as the server URL in the Expo app (e.g. http://192.168.1.42:${PORT})\n`);
});
