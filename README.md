# ConflictLens

**AI-Powered Global Conflict Intelligence Platform**
*YHack Spring 2026 · Societal Impact Track*

An interactive 3D globe tracking 46+ armed conflicts worldwide with AI-generated analysis, real-time news aggregation, severity heat-mapping, and temporal timelapse visualization.

---

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Add your Mapbox token
Get a **free** token at [mapbox.com](https://account.mapbox.com/access-tokens/), then create `.env.local`:
```
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_token_here
```

### 3. Run the dev server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS + custom dark theme |
| 3D Map | Mapbox GL JS (globe projection + 3D terrain) |
| UI | shadcn/ui patterns + Radix primitives |
| Fonts | Sora (display) · Instrument Sans (body) · JetBrains Mono (data) |
| Icons | Lucide React |

## Project Structure

```
src/
├── app/
│   ├── globals.css      # Global styles, Mapbox overrides, glass utilities
│   ├── layout.tsx        # Root layout with fonts + metadata
│   └── page.tsx          # Main page orchestrating all components
├── components/
│   ├── Navbar.tsx         # Top bar with branding, live status, search
│   ├── MapGlobe.tsx       # Mapbox GL 3D globe with conflict markers
│   ├── LeftPanel.tsx      # Conflict list + AI chatbot input
│   ├── RightPanel.tsx     # Layers, filters, event type toggles
│   ├── ConflictDetail.tsx # Deep-dive panel for selected conflict
│   └── TimelineBar.tsx    # Playback controls + date scrubber
├── data/
│   └── conflicts.ts       # Mock ACLED-style conflict data + types
└── lib/
    └── utils.ts            # cn() utility
```

## Features

- Dark-themed app shell with glassmorphism UI
- Interactive 3D globe with Mapbox GL JS (globe projection, fog, stars, terrain)
- Conflict markers with severity color-coding and pulse animations
- Native Mapbox clustering at zoom-out levels with click-to-expand
- Severity heatmap layer behind markers
- Left panel: scrollable conflict list sorted by severity with regions and trends
- Conflict detail panel with structured AI Intelligence Briefing (Background, Current Situation, Key Actors, Humanitarian Impact, Outlook)
- News source cards (4 per conflict) for GDELT integration
- Right panel: event type layer toggles, region filter, severity range, overlays
- Timeline bar with play/pause, speed controls, date scrubbing, timelapse modes
- AI chatbot input wired into left panel
- Fly-to animation when selecting a conflict zone
- Brightened map labels for dark mode readability
- 17 real-world conflict zones with accurate coordinates and data

---

**Built for YHack Spring 2026 · March 28-29 · Yale University**
