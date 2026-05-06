const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // serves your frontend HTML

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

  const selectedModel = allowedModels.includes(model)
    ? model
    : 'llama-3.3-70b-versatile';

  try {
    const groqResponse = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
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
              content:
                'You are Rony, a helpful, friendly, and smart AI assistant built by Rony.ai. Be concise but thorough. Format code in markdown code blocks.',
            },
            ...messages,
          ],
          max_tokens: 1024,
          temperature: 0.7,
        }),
      }
    );

    const data = await groqResponse.json();

    if (!groqResponse.ok) {
      console.error('Groq API error:', data);
      return res
        .status(groqResponse.status)
        .json({ error: data.error?.message || 'Groq API error' });
    }

    res.json({ reply: data.choices[0].message.content });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Health Check ────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Rony.ai backend is running 🚀' });
});

app.listen(PORT, () => {
  console.log(`✅ Rony.ai server running at http://localhost:${PORT}`);
});
