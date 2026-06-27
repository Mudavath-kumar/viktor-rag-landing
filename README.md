# Viktor RAG 🤖📄

> **AI-powered document Q&A platform** — Upload your PDFs, DOCX, and text files, then chat with them using semantic search and a free LLM.

Built by **Mudavath Kumar** for the Tutedude Web Dev Hackathon 1.0

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-teal.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev)

---

## ✨ Features

| Feature                 | Description                                                       |
| ----------------------- | ----------------------------------------------------------------- |
| 📤 **Document Upload**  | Drag & drop PDF, DOCX, TXT, MD, CSV files                         |
| 🔍 **Semantic Search**  | Local embeddings via `sentence-transformers` (`all-MiniLM-L6-v2`) |
| 💬 **Scoped AI Chat**   | Chat with a specific document or across all your documents        |
| 🧠 **Free LLM**         | Powered by Groq's `llama-3.1-8b-instant` — ultra-fast, free tier  |
| 📌 **Source Citations** | Every AI answer cites the source file it used                     |
| ✏️ **Rename Sessions**  | Inline rename chat sessions with a single click                   |
| 🔎 **History Search**   | Filter past conversations by keyword                              |
| 📥 **Export Chat**      | Download any conversation as a `.txt` file                        |
| 🗑️ **Delete Documents** | Remove uploaded files and their indexed chunks                    |
| 👤 **Profile Page**     | View account stats, manage documents, sign out                    |
| 🔐 **Auth**             | Email/password auth via Supabase (auto-confirmed signup)          |

---

## 🛠️ Tech Stack

### Frontend

- **React 19** + TypeScript + Vite
- **TanStack Router** (file-based routing)
- **TailwindCSS v4** + shadcn/ui components
- **Supabase JS** (auth client)
- **Sonner** (toast notifications)
- **Lucide React** (icons)

### Backend

- **FastAPI** + Uvicorn (Python)
- **sentence-transformers** — local CPU embeddings (`all-MiniLM-L6-v2`)
- **Groq API** — free LLM (`llama-3.1-8b-instant`)
- **Supabase Storage** — stores JSON data files (documents, sessions, messages, chunks)
- **Supabase Auth** — user management
- **PyPDF2 + python-docx** — document text extraction

### Infrastructure

- **Frontend:** Vercel (free Hobby tier)
- **Backend:** Render.com (free web service)
- **Database/Storage:** Supabase (free tier)
- **LLM:** Groq Cloud (free rate limits)
- **Total cost: $0/month**

---

## 🚀 Quick Start (Local Development)

### Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- A [Supabase](https://supabase.com) project
- A [Groq](https://console.groq.com) API key (free)

### 1. Clone the repo

```bash
git clone https://github.com/Mudavath-kumar/Viktor-RAG.git
cd Viktor-RAG
```

### 2. Set up the Backend

```bash
cd backend-py
pip install -r requirements.txt
```

Create `backend-py/.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GROQ_API_KEY=your_groq_api_key
```

Start the backend:

```bash
python main.py
# Runs on http://localhost:8000
```

### 3. Set up the Frontend

```bash
# Back to root
cd ..
npm install
```

Create `.env` in project root:

```env
VITE_API_URL=http://localhost:8000/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

Start the frontend:

```bash
npm run dev
# Runs on http://localhost:8080
```

---

## 📁 Project Structure

```
Viktor-RAG/
├── backend-py/                # Python FastAPI backend
│   ├── main.py               # All API endpoints
│   ├── rag.py                # RAG pipeline: embed, search, generate
│   ├── data_store.py         # Supabase Storage JSON persistence layer
│   ├── models.py             # Pydantic request/response models
│   ├── config.py             # Environment variable loader
│   └── requirements.txt      # Python dependencies
│
├── src/                       # React frontend
│   ├── routes/
│   │   ├── index.tsx         # Landing page
│   │   ├── upload.tsx        # Document upload
│   │   ├── chat.tsx          # AI chat workspace
│   │   ├── dashboard.tsx     # User dashboard
│   │   ├── profile.tsx       # Account profile
│   │   ├── login.tsx         # Login page
│   │   └── signup.tsx        # Signup page
│   ├── components/
│   │   ├── site-chrome.tsx   # Navbar, footer, shared UI
│   │   └── ui/               # shadcn/ui base components
│   ├── hooks/
│   │   └── useAuth.tsx       # Auth context + Supabase hooks
│   └── lib/
│       ├── api.ts            # Backend REST API client
│       └── supabase.ts       # Supabase JS client
│
├── .gitignore
├── package.json
├── vite.config.ts
└── README.md
```

---

## 🌐 Deployment

### Backend → Render.com

1. Go to [render.com](https://render.com) → New Web Service
2. Connect this GitHub repo
3. Settings:
   - **Root Directory:** `backend-py`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `python main.py`
4. Add Environment Variables: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GROQ_API_KEY`

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → New Project → Import this repo
2. Framework: **Vite**
3. Add Environment Variables: `VITE_API_URL=https://your-render-url.onrender.com/api`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
4. Deploy!

---

## ⚠️ Important Notes

- **Supabase Free Tier** pauses after 7 days of inactivity. Use [UptimeRobot](https://uptimerobot.com) to ping your backend every 10 minutes.
- **Render Free Tier** spins down after 15 minutes idle — first request after sleep takes ~30s.
- **Never commit `.env` files.** All secrets should be set as environment variables in Render/Vercel dashboards.

---

## 📄 License

MIT © 2024 [Mudavath Kumar](https://github.com/Mudavath-kumar)
