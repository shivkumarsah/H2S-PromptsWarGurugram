<div align="center">

# ✈️ TravelAI — AI-Powered Travel Planning & Experience Engine

**Hackathon Submission · H2S Prompts War Gurugram · May 2026**

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Cloud_Run-4285F4?style=for-the-badge&logo=googlecloud&logoColor=white)](https://travel-ai-578619311654.us-central1.run.app)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![Gemini](https://img.shields.io/badge/Gemini-1.5_Pro-8B5CF6?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev)
[![Cloud Run](https://img.shields.io/badge/Google_Cloud-Cloud_Run-4285F4?style=for-the-badge&logo=googlecloud)](https://cloud.google.com/run)

> Plan trips dynamically with AI-powered preferences, real-time adaptation, and intelligent personalization — powered entirely by Google Cloud.

**🌐 Deployed:** https://travel-ai-578619311654.us-central1.run.app

</div>

---

## 📋 Table of Contents

- [Challenge Statement](#-challenge-statement)
- [Solution Overview](#-solution-overview)
- [Live Demo](#-live-demo)
- [Features](#-features)
- [Architecture](#-architecture)
- [Google Cloud Services Used](#-google-cloud-services-used)
- [Project Structure](#-project-structure)
- [REST API Endpoints](#-rest-api-endpoints)
- [Setup & Local Development](#-setup--local-development)
- [Deployment to Cloud Run](#-deployment-to-cloud-run)
- [Demo Script for Judges](#-demo-script-for-judges)
- [AI / Hybrid Planning Logic](#-ai--hybrid-planning-logic)
- [Sample Data](#-sample-data)
- [Team](#-team)

---

## 🎯 Challenge Statement

**Travel Planning & Experience Engine**

> Create an AI-powered travel planning platform that generates personalized itineraries, adapts to changing conditions in real time, and optimizes for user preferences, budget, time, weather, live events, and travel constraints.

---

## 💡 Solution Overview

**TravelAI** is a production-grade, full-stack travel planning application that uses **Google Gemini 1.5 Pro** to generate hyper-personalized, day-by-day travel itineraries in seconds. The platform continuously re-plans based on real-world signals (weather, closures, budget drift) and lets users refine their trip via a natural language conversational interface.

### What makes it unique
- **Natural language intent parsing** — Describe your trip in plain English, AI extracts all parameters
- **Rules + AI hybrid planner** — Deterministic constraints (budget, opening hours, mobility) applied first; Gemini ranks and personalizes second
- **Real-time adaptation engine** — Weather changes, attraction closures, or a simple "make it cheaper" chat message triggers automatic replanning with clear human-readable explanations
- **Confidence scores** — Every activity shows an AI confidence rating (0–100) based on data freshness and preference matching
- **Graceful degradation** — Full demo mode with rich sample data when external APIs are unavailable

---

## 🌐 Live Demo

| URL | Description |
|-----|-------------|
| **https://travel-ai-578619311654.us-central1.run.app** | Main app (Landing page) |
| **https://travel-ai-578619311654.us-central1.run.app/dashboard** | Travel dashboard (pre-loaded with Tokyo demo trip) |

> The app runs in **demo mode** without API keys — all features are functional using pre-seeded rich sample data.

---

## ✨ Features

### 1. 🧠 Natural Language Trip Intake
- Accepts plain-English queries: *"3-day family trip to Tokyo under $1500 with kid-friendly activities"*
- Gemini extracts destination, dates, budget, group size, travel style, and interests automatically
- Falls back to a guided 5-step wizard for manual input

### 2. 📋 AI Itinerary Generation
- **Day-by-day plans** structured into Morning / Afternoon / Evening slots
- **Route-optimized** — activities clustered geographically to minimize transit time
- **Cost estimation** per activity, per day, and trip total vs. budget
- **Confidence scores** on every activity (0–100%)
- **1–2 alternatives** provided for every major activity
- **"Why AI picked this"** explanation for every recommendation

### 3. ⚡ Real-Time Adaptation Engine
- Detects weather changes and automatically swaps outdoor activities for indoor alternatives
- Re-plans when budget is exceeded, attractions close, or user preferences change
- Every adaptation is logged with a human-readable explanation and impact level (minor / moderate / major)

### 4. 💬 Conversational Planning Assistant
- Chat interface powered by Gemini
- Understands natural language modification requests:
  - *"Make this trip cheaper"* → finds budget substitutions, estimates savings
  - *"Replace outdoor activities because it may rain"* → suggests indoor alternatives
  - *"Add nightlife for Friday"* → adds evening bar/club recommendations
  - *"Move the museum to tomorrow"* → reschedules with impact analysis
- Returns quick-action suggestions after each response

### 5. 🗺️ Map & Timeline View
- **Itinerary view** — day-by-day timeline with activity cards
- **Map view** — stylized route map with numbered activity pins and transit connectors
- Toggle between List View and Map View
- Day selector with weather forecast and cost summary

### 6. 📊 Budget & Analytics Dashboard
- Total cost vs. budget with visual progress bar
- Category breakdown (Attractions, Restaurants, Experiences, Transport, Shopping)
- Per-day cost breakdown
- AI Optimization Score (0–100) based on route efficiency + preference match

### 7. 🎨 Premium UX
- Dark glassmorphism design with animated gradients
- Framer Motion animations throughout
- Weather badges, confidence ring indicators, tag taxonomy
- Responsive for desktop and tablet
- Graceful empty states and loading animations

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                            │
│                    Next.js 16 (React + TypeScript)              │
│          Landing Page → Dashboard → Itinerary → Chat           │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     GOOGLE CLOUD RUN                            │
│              travel-ai service (us-central1)                    │
│                                                                  │
│  ┌─────────────────────┐   ┌──────────────────────────────┐    │
│  │  Next.js App Router │   │    API Routes (Edge-ready)   │    │
│  │  (Server Components)│   │  POST /api/trips             │    │
│  └─────────────────────┘   │  POST /api/itinerary/generate│    │
│                             │  POST /api/chat              │    │
│                             │  GET  /api/trips             │    │
│                             └──────────────┬───────────────┘    │
└────────────────────────────────────────────┼────────────────────┘
                                             │
                    ┌────────────────────────┼────────────────────┐
                    │                        │                     │
                    ▼                        ▼                     ▼
        ┌─────────────────┐    ┌─────────────────────┐  ┌────────────────┐
        │  Gemini 1.5 Pro │    │   Rules Engine      │  │  Seed / Sample │
        │  (Vertex AI)    │    │   (Deterministic    │  │  Data Store    │
        │  - NL Parsing   │    │    Constraints)     │  │  (Firestore-   │
        │  - Itinerary Gen│    │   - Budget limits   │  │   ready schema)│
        │  - Chat/Replan  │    │   - Opening hours   │  └────────────────┘
        │  - Structured   │    │   - Mobility needs  │
        │    JSON output  │    │   - Visa rules      │
        └─────────────────┘    └─────────────────────┘
```

### Data Flow
```
User Input (NL or Wizard)
        │
        ▼
  Rules Engine validates constraints (budget, dates, mobility)
        │
        ▼
  Gemini 1.5 Pro generates ranked activity list (JSON)
        │
        ▼
  Route optimizer clusters activities by geography
        │
        ▼
  Cost validator checks daily + total budget
        │
        ▼
  Itinerary assembled → returned to UI
        │
        ▼
  Live signals (weather, events) → Adaptation Engine → Re-plan
```

---

## ☁️ Google Cloud Services Used

| Service | Role | Status |
|---------|------|--------|
| **Cloud Run** | Hosts the entire Next.js application | ✅ Deployed |
| **Gemini 1.5 Pro** (Vertex AI) | Itinerary generation, NL parsing, chat assistant | ✅ Integrated |
| **Gemini 1.5 Flash** | Fast natural language intent extraction | ✅ Integrated |
| **Cloud Build** | CI/CD pipeline — source → container → deploy | ✅ Used |
| **Artifact Registry** | Docker image storage (`travel-ai-repo`) | ✅ Created |
| **Google Maps Platform** | Map view, routing, place IDs | 🔧 Architecture-ready |
| **Firestore** | Persistent trip/itinerary storage | 🔧 Schema defined |
| **Pub/Sub** | Real-time weather/event change notifications | 🔧 Architecture-ready |
| **Firebase Auth** | User authentication | 🔧 Architecture-ready |
| **BigQuery** | Trip analytics and recommendations data | 🔧 Architecture-ready |
| **Cloud Logging** | Structured request/error logging | ✅ Active (Cloud Run) |

---

## 📁 Project Structure

```
travel-ai/
├── app/
│   ├── layout.tsx              # Root layout with metadata & toast
│   ├── page.tsx                # Landing page with NL input
│   ├── globals.css             # Global design system
│   └── api/
│       ├── trips/route.ts      # GET all trips / POST create trip
│       ├── itinerary/
│       │   └── generate/route.ts  # POST generate itinerary
│       └── chat/route.ts       # POST chat with planner
├── components/
│   ├── dashboard/
│   │   ├── Sidebar.tsx         # Trip navigation, budget bars
│   │   └── TripCard.tsx        # Trip overview card
│   ├── itinerary/
│   │   ├── ItineraryView.tsx   # Day-by-day + Overview tabs
│   │   └── ActivityCard.tsx    # Expandable activity with AI reason
│   ├── chat/
│   │   └── ChatAssistant.tsx   # Conversational planning panel
│   ├── map/
│   │   └── MapView.tsx         # Route map with activity pins
│   └── onboarding/
│       └── OnboardingWizard.tsx # 5-step trip creation wizard
├── lib/
│   ├── types.ts                # Full TypeScript domain models
│   ├── gemini.ts               # Gemini API client + fallbacks
│   ├── store.ts                # Zustand global state
│   └── seed-data.ts            # Rich sample Tokyo/Bali trips
├── Dockerfile                  # Multi-stage production build
├── cloudbuild.yaml             # Cloud Build CI/CD config
└── next.config.ts              # Standalone output for Cloud Run
```

---

## 🔌 REST API Endpoints

All endpoints follow the pattern: `ApiResponse<T> = { success, data, message, timestamp }`

### `GET /api/trips`
List all trips for a user.
```json
{
  "success": true,
  "data": [{ "id": "trip_...", "intent": {...}, "itinerary": {...} }]
}
```

### `POST /api/trips`
Create a trip from natural language or structured input.
```json
// Request (NL mode)
{ "naturalLanguageInput": "3-day family trip to Tokyo under $1500" }

// Request (structured mode)
{
  "destination": "Tokyo, Japan",
  "startDate": "2026-06-01",
  "endDate": "2026-06-04",
  "budget": 1500,
  "groupSize": 2,
  "travelStyle": ["cultural"],
  "interests": ["Food & Dining", "History & Culture"]
}
```

### `POST /api/itinerary/generate`
Generate a full AI itinerary for an existing trip.
```json
{ "tripId": "trip_abc123", "regenerate": false }
```

### `POST /api/chat`
Conversational trip modification.
```json
{
  "tripId": "trip_abc123",
  "message": "Make this trip cheaper",
  "currentItinerary": { ... }
}
```

---

## 🛠️ Setup & Local Development

### Prerequisites
- Node.js ≥ 20 (use `nvm use 20`)
- npm ≥ 10

### 1. Clone & Install
```bash
git clone https://github.com/shivkumarsah/H2S-PromptsWarGurugram.git
cd H2S-PromptsWarGurugram/travel-ai
npm install
```

### 2. Environment Variables
```bash
cp .env.example .env.local
# Edit .env.local and add your keys:
```

```env
# Get from https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# Get from https://console.cloud.google.com/apis/credentials
MAPS_API_KEY=your_maps_api_key_here
```

> **No API key?** The app runs in **demo mode** automatically with full sample data — all features work.

### 3. Run Locally
```bash
# Make sure you're using Node 20
nvm use 20

npm run dev
# → http://localhost:3000
```

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 🚀 Deployment to Cloud Run

### One-command deploy (from `travel-ai/` directory)
```bash
gcloud run deploy travel-ai \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 1Gi \
  --set-env-vars NODE_ENV=production \
  --project YOUR_PROJECT_ID
```

### With Gemini API key (for full AI mode)
```bash
gcloud run deploy travel-ai \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 1Gi \
  --set-env-vars "NODE_ENV=production,GEMINI_API_KEY=your_key_here" \
  --project YOUR_PROJECT_ID
```

### CI/CD via Cloud Build
```bash
# From project root
gcloud builds submit \
  --config=cloudbuild.yaml \
  --project=YOUR_PROJECT_ID
```

---

## 🎬 Demo Script for Judges

**Total time: ~3 minutes**

### Step 1 — Landing Page (30s)
1. Open https://travel-ai-578619311654.us-central1.run.app
2. Type in the search box: *"3-day romantic trip to Tokyo for 2 under $1500"*
3. Show the featured destination cards and Google Cloud architecture strip

### Step 2 — Dashboard (45s)
1. Click **"Open Dashboard →"** or the demo trip loads automatically
2. Show the **Tokyo trip** in the sidebar with budget bar and AI Active indicator
3. Point out: status badge, travel style tags, budget remaining

### Step 3 — Itinerary View (60s)
1. Click **Day 1** — show *Ancient Tokyo* theme
2. Expand **Senso-ji Temple** card → show AI reasoning, confidence score (96), tags
3. Click **alternatives** to show the Ueno Park option
4. Switch to **Day 2** → show the 🌧️ rain advisory and the re-plan explanation in the sidebar (*"Moved outdoor Meiji Shrine to morning, added teamLab as rain alternative"*)
5. Click **📊 Overview** tab → show budget pie, optimization score dial

### Step 4 — Map View (20s)
1. Click **🗺️ Map View** toggle
2. Show numbered activity pins, route connector, day tabs

### Step 5 — AI Chat (30s)
1. Click **💬 AI Planner** button
2. Click quick action **"Make this trip cheaper"**
3. Wait for Gemini response — show specific savings ($130), line items
4. Type **"Replace outdoor activities because it may rain"**
5. Show the indoor alternatives recommendation

### Step 6 — New Trip Wizard (15s)
1. Click **+ Plan New Trip**
2. Type a natural language query → click **✨ Parse with AI**
3. Show how AI skips to the Review step with parsed values

---

## 🤖 AI / Hybrid Planning Logic

The planner uses a **rules-first, AI-second** architecture:

```
Phase 1 — DETERMINISTIC (Rules Engine)
  ✓ Budget cap enforcement (hard limit)
  ✓ Opening hours validation
  ✓ Mobility constraint filtering
  ✓ Visa/entry requirement flags
  ✓ Dietary restriction filtering

Phase 2 — AI RANKING (Gemini 1.5 Pro)
  ✓ Preference matching score
  ✓ Travel style alignment
  ✓ Geographic clustering
  ✓ Experience diversity (no repetition)
  ✓ Local experience weighting

Phase 3 — FALLBACK (Graceful Degradation)
  ✓ Pre-seeded sample itineraries if Gemini unavailable
  ✓ Static alternatives for every activity
  ✓ Error boundaries at every API call
  ✓ Zero-downtime demo mode
```

### Structured JSON Output
Gemini is instructed via system prompt to return **strict JSON** matching the `Itinerary` TypeScript schema — validated and parsed before rendering. Malformed output triggers the fallback.

---

## 📦 Sample Data

The app ships with two complete seed trips:

| Trip | Duration | Budget | Status |
|------|----------|--------|--------|
| **Tokyo, Japan** | 3 days | $1,500 | Active (with AI adaptation log) |
| **Bali, Indonesia** | 7 days | $2,000 | Planning |

The Tokyo trip includes:
- 11 fully detailed activities across 3 days
- Weather forecasts (rain advisory on Day 2)
- Pre-computed route distances and transit times
- 3 adaptation log entries showing re-planning decisions
- Image URLs, opening hours, ratings, and booking links

---

## 🔒 Security & Non-Functional

| Requirement | Implementation |
|-------------|---------------|
| **Secure** | No secrets in code; env vars via Cloud Run secret injection |
| **Scalable** | Cloud Run auto-scales 0→10 instances; stateless Next.js |
| **Low Latency** | Gemini Flash for NL parsing (<1s), Pro for itinerary (~3s) |
| **Cost Conscious** | Min instances = 0 (no idle cost); Flash used for cheap ops |
| **Observable** | Cloud Run structured logs; all API errors caught and logged |
| **Degradation** | Full offline/demo mode; every API call wrapped in try/catch |

---

## 👤 Team

**Shiv Kumar** — Solution Architect & Full-Stack Engineer
- Hackathon: H2S Prompts War Gurugram · May 2026
- Stack: Next.js · TypeScript · Google Gemini · Cloud Run · Zustand · Framer Motion

---

## 📄 License

MIT License — built for the H2S Prompts War Gurugram Hackathon.

---

<div align="center">

**Built with ❤️ using Google Cloud + Gemini AI**

[🚀 Live Demo](https://travel-ai-578619311654.us-central1.run.app) · [📋 Dashboard](https://travel-ai-578619311654.us-central1.run.app/dashboard)

</div>
