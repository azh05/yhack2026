# ConflictLens

**AI-Powered Global Conflict Intelligence Platform**
*YHack Spring 2026 · Societal Impact Track*

An interactive 3D globe tracking 46+ armed conflicts worldwide with AI-generated analysis, real-time news aggregation, severity heat-mapping, and temporal timelapse visualization.

---

## Quick Start

### Frontend

```bash
# Install dependencies
npm install

# Add your Mapbox token (get one free at mapbox.com)
echo "NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_token_here" > .env.local

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Backend

```bash
cd backend

# Install dependencies (using uv)
uv sync

# Configure environment variables (see below)
cp .env.example .env

# Start the API server
uvicorn app.main:app --reload
```

API available at [http://localhost:8000](http://localhost:8000)

### Environment Variables

**Frontend** (`.env.local` in project root):
```
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_token_here
```

**Backend** (`.env` in `backend/`):
```
ACLED_EMAIL=your_acled_email
ACLED_PASSWORD=your_acled_password
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
FRONTEND_URL=http://localhost:3000
```

---

## Tech Stack

### Frontend

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5.4 (strict mode) |
| Styling | Tailwind CSS + custom dark theme + glassmorphism |
| 3D Map | Mapbox GL JS 3.3 (globe projection + 3D terrain) |
| UI | Radix UI primitives + Lucide React icons |
| Fonts | Sora (display) · Instrument Sans (body) · JetBrains Mono (data) |

### Backend

| Layer | Technology |
|-------|-----------|
| Framework | FastAPI |
| Language | Python 3.11+ |
| Server | Uvicorn (ASGI) |
| HTTP Client | httpx (async) |
| Database | Supabase |
| Data Processing | pandas |
| Validation | Pydantic 2 |

---

## Features

- **Interactive 3D Globe** — Mapbox GL JS with globe projection, fog, stars, and 3D terrain
- **Conflict Markers** — Severity color-coded with pulse animations and native clustering
- **Severity Heatmap** — Gradient overlay showing conflict density
- **AI Intelligence Briefings** — Structured analysis per conflict (Background, Current Situation, Key Actors, Humanitarian Impact, Outlook)
- **News Aggregation** — GDELT-powered news cards with sentiment analysis
- **Conflict List** — Sortable by severity with region tags and trend indicators
- **Filters & Layers** — Event type toggles, region filter, severity range slider, overlay controls
- **Timeline Playback** — Date scrubber with play/pause, speed controls (1×–8×), and timelapse modes
- **Severity Scoring** — Algorithmic 1–10 scoring based on deadliness, civilian danger, frequency, geographic spread, and trend
- **Caching** — Supabase-backed caching of ACLED events to reduce API calls
- **Fly-to Animations** — Smooth camera transitions when selecting conflict zones

---

## Project Structure

```
├── src/                          # Frontend (Next.js)
│   ├── app/
│   │   ├── globals.css           # Global styles, Mapbox overrides
│   │   ├── layout.tsx            # Root layout with fonts + metadata
│   │   └── page.tsx              # Main page orchestrating all components
│   ├── components/
│   │   ├── Navbar.tsx            # Top bar with branding, live status, search
│   │   ├── MapGlobe.tsx          # Mapbox GL 3D globe with conflict markers
│   │   ├── LeftPanel.tsx         # Conflict list + AI chatbot input
│   │   ├── RightPanel.tsx        # Layers, filters, event type toggles
│   │   ├── ConflictDetail.tsx    # Deep-dive panel for selected conflict
│   │   └── TimelineBar.tsx       # Playback controls + date scrubber
│   ├── data/
│   │   └── conflicts.ts          # Conflict zone data + types
│   └── lib/
│       └── utils.ts              # cn() utility
│
├── backend/                      # Backend (FastAPI)
│   ├── app/
│   │   ├── main.py               # App setup, CORS, lifespan
│   │   ├── config.py             # Settings / environment config
│   │   ├── routers/
│   │   │   ├── conflicts.py      # GET /api/conflicts — ACLED data + severity
│   │   │   └── news.py           # GET /api/news — GDELT articles + sentiment
│   │   ├── services/
│   │   │   ├── acled.py          # ACLED API client with OAuth
│   │   │   ├── gdelt.py          # GDELT API client
│   │   │   ├── severity.py       # Severity scoring algorithm
│   │   │   └── supabase.py       # Database operations + caching
│   │   └── models/
│   │       ├── acled.py          # Conflict event models
│   │       └── gdelt.py          # News article models
│   ├── tests/                    # pytest test suite
│   └── pyproject.toml            # Python dependencies
```

## API Endpoints

| Endpoint | Method | Parameters | Description |
|----------|--------|-----------|-------------|
| `/` | GET | — | Health check |
| `/api/conflicts` | GET | `country`, `start_date`, `end_date` | Fetch conflict events from ACLED with severity scoring (returns GeoJSON) |
| `/api/news` | GET | `country`, `keyword` | Fetch conflict-related news from GDELT with sentiment analysis |

---

**Built for YHack Spring 2026 · March 28–29 · Yale University**
