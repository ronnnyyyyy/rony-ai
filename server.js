const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.static('public'));

// ─── Chat Route ──────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  const { messages, model } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  const allowedModels = [
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'mixtral-8x7b-32768',
    'gemma2-9b-it',
  ];
  const selectedModel = allowedModels.includes(model) ? model : 'llama-3.3-70b-versatile';

  try {
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          {
            role: 'system',
            content: 'You are Rony, a helpful, friendly, and smart AI assistant built by Rony.ai. Be concise but thorough. Format code in markdown code blocks. When a user wants to generate an image, tell them to use /imagine followed by their description.',
          },
          ...messages,
        ],
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    const data = await groqResponse.json();
    if (!groqResponse.ok) {
      return res.status(groqResponse.status).json({ error: data.error?.message || 'Groq API error' });
    }
    res.json({ reply: data.choices[0].message.content });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Image Generation Route ──────────────────────────────
app.post('/api/imagine', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'prompt is required' });

  const CF_ACCOUNT = process.env.CF_ACCOUNT_ID;
  const CF_TOKEN   = process.env.CF_API_TOKEN;

  if (!CF_ACCOUNT || !CF_TOKEN) {
    return res.status(500).json({ error: 'Image generation not configured. Add CF_ACCOUNT_ID and CF_API_TOKEN to your .env file.' });
  }

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT}/ai/run/@cf/stabilityai/stable-diffusion-xl-base-1.0`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${CF_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      }
    );

    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({ error: err.errors?.[0]?.message || 'Image generation failed' });
    }

    // Cloudflare returns raw image bytes
    const buffer = await response.buffer();
    const base64 = buffer.toString('base64');
    res.json({ image: `data:image/png;base64,${base64}` });

  } catch (err) {
    console.error('Image generation error:', err);
    res.status(500).json({ error: 'Image generation failed. Please try again.' });
  }
});

// ─── Health Check ────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Rony.ai backend is running 🚀' });
});

app.listen(PORT, () => {
  console.log(`✅ Rony.ai server running at http://localhost:${PORT}`);
});
