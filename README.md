# Love Over War

**AI-Powered Global Conflict Intelligence Platform**
*YHack Spring 2026 · Societal Impact Track*

An interactive 3D globe tracking 46+ armed conflicts worldwide with AI-generated analysis, real-time news aggregation, severity heat-mapping, and temporal timelapse visualization.

---

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment variables (see below)
cp .env.local.example .env.local

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

Create a `.env.local` file in the project root:

```
# Mapbox (get a free token at mapbox.com)
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_token_here

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# ACLED API credentials (for backfilling conflict data)
ACLED_EMAIL=your_acled_email
ACLED_PASSWORD=your_acled_password

# Google Gemini (for AI briefings & chat)
GEMINI_API_KEY=your_gemini_api_key

# Resend (for email digests — optional)
RESEND_API_KEY=your_resend_api_key
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5.4 (strict mode) |
| Styling | Tailwind CSS + custom dark theme + glassmorphism |
| 3D Map | Mapbox GL JS 3.3 (globe projection + 3D terrain) |
| UI | Radix UI primitives + Lucide React icons |
| Database | Supabase (Postgres + Auth) |
| AI | Google Gemini 2.5 Flash |
| Conflict Data | ACLED API (OAuth) |
| News | Google News RSS |
| Email | Resend |
| Fonts | Sora (display) · Instrument Sans (body) · JetBrains Mono (data) |

---

## Features

- **Interactive 3D Globe** — Mapbox GL JS with globe projection, fog, stars, and 3D terrain
- **Conflict Markers** — Severity color-coded with pulse animations and native clustering
- **Severity Heatmap** — Gradient overlay showing conflict density
- **AI Intelligence Briefings** — Structured analysis per conflict (Background, Current Situation, Key Actors, Humanitarian Impact, Outlook)
- **AI Chat** — Ask follow-up questions about any conflict with full context
- **News Aggregation** — Google News RSS cards per country
- **Conflict List** — Sortable by severity with region tags and trend indicators
- **Filters & Layers** — Event type toggles, region filter, severity range slider, overlay controls
- **Timeline Playback** — Date scrubber with play/pause, speed controls (1×–8×), and timelapse modes
- **Severity Scoring** — Algorithmic 1–10 scoring based on fatalities, event type, and lethality rate
- **Watchlist** — Track specific countries of interest
- **Email Digests** — Subscribe to conflict update emails via Resend
- **Caching** — Supabase-backed caching of ACLED events and AI blurbs to reduce API calls
- **Fly-to Animations** — Smooth camera transitions when selecting conflict zones

---

## API Routes

All API routes are Next.js App Router route handlers under `src/app/api/`.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/backfill` | POST | Fetch ACLED events and upsert into Supabase |
| `/api/events` | GET | Query conflict events with filters (country, date range, type, fatalities) |
| `/api/events-light` | GET | Paginated lightweight event list for map rendering |
| `/api/briefing` | GET | AI-generated conflict briefing for a country (cached 24h) |
| `/api/news` | GET | Google News RSS articles for a country |
| `/api/chat` | POST | Conversational AI follow-ups on conflict context |
| `/api/summarize` | POST | Generate a conflict summary and optionally email subscribers |
| `/api/auth/*` | Various | Supabase auth callbacks |
| `/api/watchlist` | GET/POST/DELETE | Manage per-user country watchlist |
| `/api/subscribe` | POST | Email digest subscription |
| `/api/send-digest` | POST | Send digest emails to subscribers |

---

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── api/                    # Next.js API route handlers
│   │   │   ├── backfill/           # ACLED data ingestion
│   │   │   ├── briefing/           # AI conflict briefings (Gemini)
│   │   │   ├── chat/               # AI chat follow-ups
│   │   │   ├── events/             # Full event query endpoint
│   │   │   ├── events-light/       # Lightweight event list for map
│   │   │   ├── news/               # Google News RSS aggregation
│   │   │   ├── summarize/          # AI summary + email dispatch
│   │   │   ├── auth/               # Supabase auth callbacks
│   │   │   ├── watchlist/          # User watchlist CRUD
│   │   │   ├── subscribe/          # Email subscription
│   │   │   └── send-digest/        # Digest email dispatch
│   │   ├── app/                    # Main application page
│   │   ├── conflict/[country]/     # Country detail page
│   │   ├── globals.css             # Global styles, Mapbox overrides
│   │   ├── layout.tsx              # Root layout with fonts + metadata
│   │   └── page.tsx                # Landing page
│   ├── components/
│   │   ├── Navbar.tsx              # Top bar with branding, live status, search
│   │   ├── MapGlobe.tsx            # Mapbox GL 3D globe with conflict markers
│   │   ├── LeftPanel.tsx           # Conflict list + watchlist
│   │   ├── RightPanel.tsx          # Layers, filters, event type toggles
│   │   ├── ConflictDetail.tsx      # Deep-dive panel for selected conflict
│   │   ├── ChatPanel.tsx           # AI chat interface
│   │   └── TimelineBar.tsx         # Playback controls + date scrubber
│   ├── data/
│   │   ├── conflicts.ts            # Conflict zone types + static fallback data
│   │   ├── filters.ts              # Filter type definitions
│   │   └── timeline.ts             # Timeline simulation utilities
│   └── lib/
│       ├── supabase.ts             # Supabase client (anon key, client-side)
│       ├── supabase-server.ts      # Supabase client (service key, server-side)
│       ├── useConflictEvents.ts    # React hook for streaming event data
│       ├── useAuth.ts              # Auth hook
│       ├── useWatchlist.ts         # Watchlist hook
│       ├── buildZonesFromEvents.ts # Aggregate events into country-level zones
│       └── utils.ts                # cn() utility
├── .env.local                      # Environment variables (not committed)
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## Data Flow

1. **Backfill** — `POST /api/backfill` fetches events from the ACLED API and upserts them into the Supabase `conflict_events` table
2. **Serve** — `/api/events-light` reads from Supabase and streams paginated results to the frontend
3. **Aggregate** — `buildZonesFromEvents()` groups events by country into conflict zones client-side
4. **Render** — `MapGlobe` plots events on a 3D globe; `LeftPanel` shows the ranked conflict list
5. **Analyze** — `/api/briefing` generates an AI briefing using recent ACLED events as context via Gemini
6. **Discuss** — `/api/chat` enables follow-up questions with full conflict context

---

**Built for YHack Spring 2026 · March 28–29 · Yale University**