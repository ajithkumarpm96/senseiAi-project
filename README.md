# Sensei AI 🥋✨
> **An accessible, low-pressure AI study workspace engineered for neurodivergent minds (ADHD, dyslexia, and executive ease).**

Sensei AI decomposes complex technical, algorithmic, and systems engineering concepts into digestible 5-minute mental models. Built with **zero punitive streaks**, **forgiving autosave**, **open reading aids**, and **multi-agent real-time tutoring**, Sensei provides a supportive, calm environment to master engineering concepts without cognitive exhaustion.

---

## 🌟 Key Highlights & Accommodations

### 🧠 Neurodivergent-First Design
* **Default OpenDyslexic Typography**: Built-in weighted letterforms and wide character spacing prevent letter flipping and ocular drift.
* **Bionic Reading Mode**: Toggles visual fixation anchors by bolding initial letters of words to accelerate sentence tracking.
* **Paragraph Focus Dimmer**: Tap any paragraph in an AI response to spotlight it with a soft accent glow while dimming surrounding text to 25% opacity.
* **Gentle Pacing & Zero Guilt**: Rest days are celebrated as mental synthesis. No broken streak counters, no shaming notifications, and continuous progress preservation.

### 📚 Stitch-Designed UI & Ergonomics
* **Stitch Comic Page-Flip Loader**: Custom animated SVG featuring 3-layer 3D page flips, dynamic manga action panels, and whipping bookmark ribbons from Google Stitch.
* **Borderless Tonal Dashboard**: Clean midnight canvas (`#13151b`) with elevated warm slate cards (`#1b1e27`) and soft ambient shadows, eliminating rigid wireframe borders.
* **Zero Layout Shift Transitions**: Concurrent pre-loading of chapters, past progress, and active chat history prevents layout flashes and jumping titles.
* **Mobile-First Reading Ergonomics**:
  * **Collapsible Code Snippets**: Automatically collapses code blocks exceeding 10 lines with one-tap expansion.
  * **Floating Jump to Latest Badge**: Instant return pill (`↓ Latest`) when scrolled into older lessons.
  * **Touch-Dismiss Virtual Keyboard**: Automatically blurs inputs when dragging through the chat stream.
  * **Focused AI Toolbars**: Levers (`Simpler`, `Shorter`, `Different analogy`) and copy utilities appear strictly on the **latest** response.

### 💡 Persistent "Park a Thought" Hub
* **Capture Tangents Without Losing Flow**: Save side curiosities with automatic lesson topic tagging.
* **Double-Tap Quick Save**: Double-tap any AI message bubble on mobile or desktop to immediately park it into thoughts.
* **One-Tap "Ask Sensei ↗"**: Automatically routes any saved thought back to the tutor with full previous study context.

### 🤖 Multi-Agent Orchestration (LangGraph)
* **Sensei (Lead Tutor)**: Explains concepts using intuitive, real-world analogies and zero unnecessary jargon.
* **Challenger (Quiz Master)**: Triggers adaptive interview checkpoints and conceptual self-tests.
* **Hype (Encourager)**: Steps in to celebrate breakthroughs and mental effort.
* **DuckDuckGo Web Tools**: Dynamically retrieves live documentation and syntax facts in real time.

---

## 🏗 Architecture & Tech Stack

```
Agentic-App-project/
├── backend/                  # FastAPI + LangGraph Agentic Engine
│   ├── app/
│   │   ├── agents/           # LangGraph state graph, agent nodes, tools
│   │   ├── api/routes/       # SSE streaming chat, projects, chapters, auth
│   │   ├── core/             # Guardrails, database session, security, config
│   │   └── models/           # SQLAlchemy DB models & Pydantic schemas
│   └── requirements.txt
│
└── frontend/                 # React 19 + Vite Accessible Single-Page App
    ├── src/
    │   ├── api/              # Axios HTTP client & interceptors
    │   ├── components/       # Chat, dashboard, modals, Stitch loader
    │   ├── hooks/            # useChat SSE token stream reader
    │   ├── pages/            # HomePage, StudyPage, LoginPage
    │   └── store/            # Zustand global persistent state (appStore.js)
    ├── package.json
    └── vercel.json           # SPA rewrites configuration
```

### Frontend
* **Framework**: React 19 with Vite
* **Styling**: Tailwind CSS v4
* **State Management**: Zustand v5 (with `localStorage` persistence and automatic schema migrations)
* **Typography**: OpenDyslexic, Lexend, Atkinson Hyperlegible Next, JetBrains Mono
* **Markdown & Code**: `react-markdown` with syntax blocks

### Backend
* **Web Framework**: FastAPI (Python 3.10+)
* **Agent Framework**: LangGraph & LangChain Core
* **Real-Time Streaming**: Server-Sent Events (SSE) with `StreamingResponse`
* **Database**: SQLite (local development) / PostgreSQL (production) with SQLAlchemy ORM
* **Search Tools**: `duckduckgo-search`
* **Security & Auth**: JWT Tokens (`python-jose`), password hashing (`passlib`, `bcrypt`)
* **Cost Guardrails**: Per-user daily token caps, rate limiting, and emergency kill switches

---

## 🚀 Getting Started Locally

### Prerequisites
* **Node.js**: `v18+` or `v20+`
* **Python**: `3.10` or higher
* **LLM API Key**: OpenRouter, Groq, or Google Gemini API key

---

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create environment configuration file
cp .env.example .env   # Or create .env manually
```

#### Sample `.env` Configuration:
```env
APP_NAME=SenseiAI
DEBUG=true
SECRET_KEY=your-dev-secret-key-change-in-production

# LLM Provider: openrouter | groq | gemini
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=your_api_key_here
LLM_MODEL=qwen/qwen3.8-27b:free

# Database (defaults to local SQLite)
DATABASE_URL=sqlite:///./sensei.db

# Guardrails & Budgeting
KILL_SWITCH=false
DAILY_TOKEN_LIMIT=500000
RATE_LIMIT_PER_HOUR=20
```

Start the FastAPI development server:
```bash
uvicorn app.main:app --reload --port 8000
```
*API documentation available at: `http://localhost:8000/docs`*

---

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start Vite dev server
npm run dev
```
*App will be running locally at: `http://localhost:5173`*

To build for production:
```bash
npm run build
```

---

## 🚢 Deployment

### Frontend (Vercel)
The frontend includes a pre-configured [vercel.json](file:///e:/Agentic-App-project/frontend/vercel.json) with client-side SPA routing rewrites:
1. Connect your GitHub repository to Vercel.
2. Set the Root Directory to `frontend`.
3. Add the environment variable:
   * `VITE_API_URL`: `https://your-backend-api-url.com`
4. Deploy!

### Backend (Render, Railway, or Fly.io)
1. Set the Root Directory to `backend`.
2. Build command: `pip install -r requirements.txt`.
3. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
4. Add your `.env` variables (`SECRET_KEY`, `OPENROUTER_API_KEY`, etc.) in the host environment settings.

---

## 📜 License
This project is open-source and available under the [MIT License](LICENSE).
