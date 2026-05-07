# 🤖 Rony.ai — Personal AI Assistant

A fast, modern AI chatbot powered by **Groq API** and **LLaMA 3.3 70B**, built with a secure Node.js backend and Supabase authentication.

![Rony.ai](https://img.shields.io/badge/Rony.ai-Live-brightgreen) ![Node.js](https://img.shields.io/badge/Node.js-v18+-green) ![Groq](https://img.shields.io/badge/Powered%20by-Groq-orange) ![License](https://img.shields.io/badge/License-MIT-blue)

---

## ✨ Features

- 🔐 **User Authentication** — Sign up & sign in with email/password via Supabase
- 🤖 **AI Chat** — Powered by Groq API with LLaMA 3.3 70B model
- ⚡ **Fast Responses** — Groq delivers near-instant AI replies
- 🔒 **Secure Backend** — API key hidden on server, never exposed to browser
- 🎨 **Beautiful UI** — Dark theme with smooth animations
- 📱 **Model Selector** — Switch between LLaMA, Mixtral, and Gemma models
- 🌍 **Live on the Web** — Deployed on Render.com

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, JavaScript |
| Backend | Node.js, Express.js |
| AI Model | LLaMA 3.3 70B via Groq API |
| Authentication | Supabase |
| Hosting | Render.com |
| Version Control | GitHub |

---

## 📁 Project Structure

```
rony-ai/
├── server.js           # Node.js backend server
├── package.json        # Project dependencies
├── .env                # Environment variables (never commit this!)
├── .gitignore          # Ignores node_modules and .env
└── public/
    └── index.html      # Frontend UI with auth + chat
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) v18 or higher
- A free [Groq API key](https://console.groq.com)
- A free [Supabase](https://supabase.com) account

### 1. Clone the repository

```bash
git clone https://github.com/ronnnyyyyy/rony-ai.git
cd rony-ai
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root folder:

```env
GROQ_API_KEY=gsk_your_groq_api_key_here
PORT=3000
```

### 4. Set up Supabase Auth

1. Go to [supabase.com](https://supabase.com) and create a free project
2. Go to **Authentication → Providers → Email** and enable it
3. Go to **Settings → API Keys** and copy:
   - Project URL
   - Anon public key
4. Paste both values into `public/index.html` in the Supabase config section

### 5. Run locally

```bash
npm start
```

Open your browser and go to:
```
http://localhost:3000
```

---

## 🌍 Deployment (Render.com)

1. Push your code to GitHub (make sure `.env` is in `.gitignore`)
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repository
4. Set the following:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Add environment variable in Render dashboard:
   - `GROQ_API_KEY` = your Groq API key
6. Click **Deploy** — your site will be live at `https://rony-ai.onrender.com`

---

## 🔑 Environment Variables

| Variable | Description | Required |
|---|---|---|
| `GROQ_API_KEY` | Your Groq API key from console.groq.com | ✅ Yes |
| `PORT` | Server port (default: 3000) | ❌ Optional |

---

## 🤖 Available AI Models

| Model | Best For |
|---|---|
| LLaMA 3.3 70B | Best quality, general use |
| LLaMA 3.1 8B | Fastest responses |
| Mixtral 8x7B | Balanced performance |
| Gemma 2 9B | Lightweight tasks |

---

## ⚠️ Important Security Notes

- **Never** commit your `.env` file to GitHub
- **Never** paste your API key in chat or share it publicly
- Always revoke and regenerate API keys if accidentally exposed
- The `.gitignore` file ensures `.env` is never uploaded

---

## 📌 Live Demo

🌐 **[https://rony-ai.onrender.com](https://rony-ai.onrender.com)**

> Note: The free Render tier sleeps after 15 minutes of inactivity. First load may take ~50 seconds to wake up.

---

## 👤 Author

**Rony** — Built with ❤️ using Claude AI assistance

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
