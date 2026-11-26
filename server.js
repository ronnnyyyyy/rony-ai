require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const GROQ = 'https://api.groq.com/openai/v1';
const USERS_FILE = path.join(__dirname, 'users.json');
const PREFERRED = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b'];
const SYSTEM = 'You are Rony, a helpful, friendly and smart AI assistant built by Rony.ai. Be concise but thorough. Put code in markdown code blocks. If the user wants an image, tell them to type /imagine followed by a description.';

let SECRET = process.env.AUTH_SECRET;
if (!SECRET) {
  SECRET = crypto.randomBytes(32).toString('hex');
  console.warn('⚠️  AUTH_SECRET is not set in .env. Users will be logged out every time the server restarts.');
}
if (!process.env.GROQ_API_KEY) console.warn('⚠️  GROQ_API_KEY is not set in .env. Chat will not work.');

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ─── Users and tokens (no extra packages needed) ─────────
const loadUsers = () => { try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')); } catch { return {}; } };
const saveUsers = (u) => fs.writeFileSync(USERS_FILE, JSON.stringify(u, null, 2));
const hashPw = (pw, salt) => crypto.scryptSync(pw, salt, 64).toString('hex');
const hmac = (data) => crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
const same = (a, b) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));

function makeToken(user) {
  const body = Buffer.from(JSON.stringify({ email: user.email, name: user.name, exp: Date.now() + 7 * 864e5 })).toString('base64url');
  return `${body}.${hmac(body)}`;
}

function auth(req, res, next) {
  const [body, sig] = (req.headers.authorization || '').replace('Bearer ', '').split('.');
  if (!body || !sig || !same(sig, hmac(body))) return res.status(401).json({ error: 'Please log in again.' });
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (p.exp < Date.now()) return res.status(401).json({ error: 'Session expired. Please log in again.' });
    req.user = p;
    next();
  } catch { res.status(401).json({ error: 'Please log in again.' }); }
}

app.post('/api/signup', (req, res) => {
  const name = String(req.body.name || '').trim().slice(0, 50);
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!name) return res.status(400).json({ error: 'Enter your name.' });
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  const users = loadUsers();
  if (users[email]) return res.status(409).json({ error: 'An account with this email already exists. Log in instead.' });
  const salt = crypto.randomBytes(16).toString('hex');
  users[email] = { name, salt, hash: hashPw(password, salt) };
  saveUsers(users);
  res.json({ token: makeToken({ email, name }), user: { email, name } });
});

app.post('/api/login', (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const u = loadUsers()[email];
  if (!u || !same(u.hash, hashPw(String(req.body.password || ''), u.salt))) {
    return res.status(401).json({ error: 'Wrong email or password.' });
  }
  res.json({ token: makeToken({ email, name: u.name }), user: { email, name: u.name } });
});

// ─── Models: read the live list from Groq so retired models never break the app ───
let modelCache = { at: 0, list: PREFERRED };
async function chatModels() {
  if (Date.now() - modelCache.at < 10 * 60 * 1000) return modelCache.list;
  try {
    const r = await fetch(`${GROQ}/models`, { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` } });
    const d = await r.json();
    const ids = (d.data || []).map((m) => m.id).filter((id) => !/whisper|guard|tts|orpheus|playai|safeguard/i.test(id));
    if (ids.length) modelCache.list = ids.sort();
  } catch (e) { console.error('Model list error:', e.message); }
  modelCache.at = Date.now();
  return modelCache.list;
}
const pickDefault = (list) => PREFERRED.find((m) => list.includes(m)) || list[0];

app.get('/api/models', async (req, res) => {
  const models = await chatModels();
  res.json({ models, default: pickDefault(models) });
});

// ─── Chat ────────────────────────────────────────────────
app.post('/api/chat', auth, async (req, res) => {
  const { messages, model } = req.body;
  if (!Array.isArray(messages) || !messages.length) return res.status(400).json({ error: 'messages array is required' });
  if (!process.env.GROQ_API_KEY) return res.status(500).json({ error: 'Server has no GROQ_API_KEY. Add it to the .env file and restart.' });

  const list = await chatModels();
  const selected = list.includes(model) ? model : pickDefault(list);
  const body = {
    model: selected,
    messages: [
      { role: 'system', content: SYSTEM },
      ...messages.slice(-30).map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content).slice(0, 8000) })),
    ],
    max_completion_tokens: 2048,
    temperature: 0.7,
  };
  if (selected.startsWith('openai/gpt-oss')) body.reasoning_effort = 'low';

  try {
    const r = await fetch(`${GROQ}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify(body),
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data.error?.message || 'Groq API error' });
    const reply = (data.choices?.[0]?.message?.content || '').replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    res.json({ reply: reply || 'I could not produce an answer. Try rephrasing.', model: selected });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Could not reach Groq. Check the server internet connection.' });
  }
});

// ─── Image generation (optional, Cloudflare Workers AI) ──
app.post('/api/imagine', auth, async (req, res) => {
  const prompt = String(req.body.prompt || '').trim().slice(0, 1000);
  if (!prompt) return res.status(400).json({ error: 'Describe the image after /imagine.' });
  const { CF_ACCOUNT_ID, CF_API_TOKEN } = process.env;
  if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
    return res.status(500).json({ error: 'Image generation is not set up. Add CF_ACCOUNT_ID and CF_API_TOKEN to .env.' });
  }
  try {
    const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/@cf/stabilityai/stable-diffusion-xl-base-1.0`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${CF_API_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    const type = r.headers.get('content-type') || '';
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      return res.status(r.status).json({ error: err.errors?.[0]?.message || 'Image generation failed' });
    }
    if (type.includes('json')) {
      const d = await r.json();
      return res.json({ image: `data:image/png;base64,${d.result?.image}` });
    }
    const buf = Buffer.from(await r.arrayBuffer());
    res.json({ image: `data:${type || 'image/png'};base64,${buf.toString('base64')}` });
  } catch (err) {
    console.error('Image error:', err);
    res.status(500).json({ error: 'Image generation failed. Please try again.' });
  }
});

app.get('/api/health', (req, res) => res.json({ status: 'ok', groqKey: !!process.env.GROQ_API_KEY }));

app.listen(PORT, () => console.log(`✅ Rony.ai running at http://localhost:${PORT}`));
