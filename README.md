# MindCheck — Gen-Z Mental Health Screening

> No judgment. No clinical jargon. Just a safe space to understand what's going on in your head right now.

MindCheck is a full-stack adaptive mental health screening web app built for Gen-Z. It guides users through a weighted, multi-phase questionnaire, provides a real-time AI emotional-support companion (MindBot), and generates a downloadable wellness report.

---

## Table of Contents

1. [Live Demo](#live-demo)
2. [Tech Stack](#tech-stack)
3. [Architecture Overview](#architecture-overview)
4. [Project Structure](#project-structure)
5. [Database Schema](#database-schema)
6. [Screening Algorithm — How It Works](#screening-algorithm--how-it-works)
7. [Question Decision Logic](#question-decision-logic)
8. [Scoring & Risk Calculation](#scoring--risk-calculation)
9. [AI / MindBot — Model & Prompt Engineering](#ai--mindbot--model--prompt-engineering)
10. [API Reference](#api-reference)
11. [PDF Report Generation](#pdf-report-generation)
12. [Admin Dashboard](#admin-dashboard)
13. [Running Locally](#running-locally)
14. [Environment Variables](#environment-variables)

---

## Live Demo

Deployed on Replit — visit the published URL to try MindCheck.

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| Vite | 7 | Dev server & bundler |
| TypeScript | 5.9 | Type safety |
| Tailwind CSS | v4 | Utility-first styling |
| Framer Motion | latest | Animations & transitions |
| Radix UI | latest | Accessible component primitives |
| Wouter | latest | Client-side routing |
| TanStack Query | v5 | Server state management & caching |
| React Hook Form | latest | Form state management |
| jsPDF + jsPDF-autotable | latest | Client-side PDF generation |
| Lucide React | latest | Icon library |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | 24 | Runtime |
| Express | 5.2.1 | HTTP server framework |
| TypeScript | 5.9 | Type safety |
| Drizzle ORM | latest | Type-safe database queries |
| PostgreSQL | latest | Relational database |
| Zod | v4 | Runtime input validation |
| PDFKit | latest | Server-side PDF generation |
| Pino | latest | Structured logging |
| esbuild | latest | Production bundler |

### AI / ML
| Technology | Purpose |
|---|---|
| OpenAI `gpt-4o-mini` | MindBot conversational AI companion |
| Server-Sent Events (SSE) | Real-time streaming of AI responses |
| Prompt Engineering | Adaptive Gen-Z tone, crisis detection |

### Tooling & Monorepo
| Technology | Purpose |
|---|---|
| pnpm workspaces | Monorepo package management |
| Orval | OpenAPI → TypeScript codegen (hooks + Zod schemas) |
| OpenAPI 3.0 | API contract-first spec in `lib/api-spec` |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (React + Vite)                │
│                                                         │
│  Landing → Screening → Results → Chat → Admin           │
│      ↓           ↓         ↓        ↓                   │
│  TanStack Query hooks (auto-generated from OpenAPI)     │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP / SSE (via reverse proxy)
                         ▼
┌─────────────────────────────────────────────────────────┐
│             Express API Server (port 8080)              │
│                                                         │
│  /api/screening/*  →  Scoring Engine                    │
│  /api/openai/*     →  MindBot (OpenAI SSE bridge)       │
│                                                         │
│  Validation: Zod schemas (generated from OpenAPI spec)  │
└────────────────────────┬────────────────────────────────┘
                         │ Drizzle ORM
                         ▼
┌─────────────────────────────────────────────────────────┐
│                   PostgreSQL Database                    │
│  screening_sessions | conversations | messages          │
└─────────────────────────────────────────────────────────┘
```

The reverse proxy routes `/` to the frontend and `/api` to the backend — no CORS configuration needed in application code.

---

## Project Structure

```
artifacts-monorepo/
├── artifacts/
│   ├── mental-health-app/        # React + Vite frontend
│   │   └── src/
│   │       ├── pages/
│   │       │   ├── landing.tsx       # Onboarding form
│   │       │   ├── screening.tsx     # Adaptive questionnaire
│   │       │   ├── results.tsx       # Risk scores + recommendations
│   │       │   ├── chat.tsx          # MindBot AI chat
│   │       │   └── admin.tsx         # Admin dashboard
│   │       ├── lib/
│   │       │   ├── screening-algorithm.ts  # Client-side scoring
│   │       │   └── pdf-generator.ts        # jsPDF report builder
│   │       └── components/
│   └── api-server/               # Express backend
│       └── src/
│           └── routes/
│               ├── screening/    # Session CRUD + scoring engine
│               └── openai/       # MindBot SSE streaming
├── lib/
│   ├── db/                       # Drizzle schema + migrations
│   ├── api-spec/                 # OpenAPI 3.0 YAML spec
│   ├── api-zod/                  # Generated Zod validators
│   └── api-client-react/         # Generated TanStack Query hooks
└── scripts/                      # Utility scripts
```

---

## Database Schema

### `screening_sessions`
| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | Auto-generated session identifier |
| `name` | text | User's name or nickname |
| `age` | integer | Optional age |
| `email` | text | Optional email for report delivery |
| `status` | enum | `in_progress` or `completed` |
| `results` | JSONB | Full scoring output (see below) |
| `conversationId` | UUID (FK) | Linked MindBot chat session |
| `createdAt` | timestamp | Session start time |

**`results` JSONB shape:**
```json
{
  "overallScore": 62,
  "riskLevel": "Needs Attention",
  "safetyAlert": false,
  "moduleScores": {
    "depression": { "score": 8.4, "maxScore": 12, "riskPercent": 70, "riskLevel": "Needs Attention" },
    "anxiety":    { "score": 4.2, "maxScore": 10, "riskPercent": 42, "riskLevel": "Keep an Eye On It" }
  },
  "recommendations": ["..."]
}
```

### `conversations`
| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | Conversation identifier |
| `title` | text | Auto-generated title |
| `createdAt` | timestamp | Creation time |

### `messages`
| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | Message identifier |
| `conversationId` | UUID (FK) | Parent conversation |
| `role` | enum | `user` or `assistant` |
| `content` | text | Message body |
| `createdAt` | timestamp | Send time |

---

## Screening Algorithm — How It Works

MindCheck uses a **3-phase adaptive branching algorithm** based on clinical screening frameworks (PHQ-9, GAD-7, ISS) adapted for Gen-Z language and delivery.

```
Phase 1: Universal Mood Check (5 questions)
        ↓
   Score ≥ 5?
   YES → Phase 2     NO → Skip to Results
        ↓
Phase 2: 8 Issue Modules (targeted questions per module)
        ↓
   Depression score > 7?
   YES → Phase 3     NO → Calculate results
        ↓
Phase 3: Safety Module (3 critical questions)
        ↓
   Calculate final results + safetyAlert flag
```

### Why This Design?

- **Reducing burden:** Not everyone needs the full assessment. If mood is unaffected (Phase 1 score < 5), the user is likely doing well and doesn't need deeper probing.
- **Clinical triage:** Depression score thresholding before the safety module mirrors real clinical workflows — safety screening is only triggered when risk indicators are present, reducing false-positive distress.
- **Adaptive engagement:** Shorter paths keep Gen-Z users engaged; only those who need deeper screening see more questions.

---

## Question Decision Logic

### Phase 1 — Universal Mood Check

5 questions assessing baseline emotional state, framed in Gen-Z language:

| Question | Scoring |
|---|---|
| "How many browser tabs do you have open rn?" | Standard (0–4) |
| "How often do you feel like you're running on empty?" | Standard (0–4) |
| "How hyped are you about the future?" | **Reverse scored** (4 − value) |
| "How often do you feel disconnected from people around you?" | Standard (0–4) |
| "How often do you feel like you can't catch a break?" | Standard (0–4) |

**Gate condition:** Sum ≥ 5 → unlock Phase 2.

### Phase 2 — Issue Modules

8 modules, each targeting a distinct mental health domain:

| Module | Clinical Basis | Questions | Key Signals |
|---|---|---|---|
| **Academic / Life Stress** | PSS (Perceived Stress Scale) | 3 | Overwhelm, deadlines, control |
| **Anxiety** | GAD-7 | 4 | Worry, restlessness, dread |
| **Sleep** | PSQI items | 3 | Insomnia, fatigue, quality |
| **Burnout** | MBI subscales | 3 | Exhaustion, detachment |
| **Depression** | PHQ-9 adapted | 4 | Anhedonia, hopelessness, low energy |
| **Imposter Syndrome** | CIPS adapted | 3 | Self-doubt, fraud feelings |
| **Social Isolation** | UCLA Loneliness | 3 | Disconnection, loneliness |
| **Low Self-Esteem** | Rosenberg scale adapted | 3 | Self-worth, confidence |

**Gate condition:** Depression module score > 7 → unlock Phase 3.

### Phase 3 — Safety Module

3 questions about self-harm ideation and psychological crisis, phrased sensitively. A positive screen sets `safetyAlert: true` in results, which:
- Surfaces crisis resources prominently on the results page
- Injects a crisis-aware system directive into MindBot's context
- Flags the session in the admin dashboard

---

## Scoring & Risk Calculation

### Likert Scale
All questions use a 5-point Likert scale:

| Value | Label |
|---|---|
| 0 | Never |
| 1 | Rarely |
| 2 | Sometimes |
| 3 | Often |
| 4 | Almost Always |

### Weighted Scoring

Each question carries a **weight multiplier** reflecting its clinical significance within its module. Example weights for the Depression module:

| Question ID | Weight | Rationale |
|---|---|---|
| `dep1` (anhedonia) | 1.6 | Core DSM-5 criterion |
| `dep2` (hopelessness) | 1.5 | Strong predictor of severity |
| `dep3` (low energy) | 1.2 | Common but less specific |
| `dep4` (worthlessness) | 1.4 | Linked to suicidality risk |

**Raw module score:**
```
moduleScore = Σ (answer_value × question_weight)
```

**Reverse scoring** is applied to positively-framed questions before multiplication:
```
adjusted_value = 4 − raw_value
```

### Risk Level Thresholds

| Risk % | Label | Color |
|---|---|---|
| 0 – 24% | Chill | Green |
| 25 – 49% | Keep an Eye On It | Yellow |
| 50 – 74% | Needs Attention | Orange |
| 75 – 100% | High Risk | Red |

**Module risk percentage:**
```
riskPercent = (moduleScore / maxPossibleScore) × 100
```

**Overall risk** is the weighted average across all triggered modules, with depression and anxiety weighted at 1.3× relative to other modules.

---

## AI / MindBot — Model & Prompt Engineering

### Model

**OpenAI `gpt-4o-mini`** — chosen for:
- Low latency (critical for SSE streaming UX)
- Cost-effective for per-message usage
- Sufficient capability for empathetic conversational support

### System Prompt Design

MindBot's system prompt is engineered with several layers:

```
1. PERSONA LAYER
   → "You are MindBot, a warm, non-judgmental mental health companion..."
   → Tone: supportive, casual Gen-Z language, no clinical jargon

2. CONTEXT INJECTION
   → Session risk scores and triggered modules are injected at conversation start
   → MindBot knows which areas the user scored high on and tailors responses

3. SAFETY LAYER
   → If safetyAlert=true: "This user may be in distress. Always provide
     crisis resources (988 Suicide & Crisis Lifeline) if self-harm is mentioned."
   → Detects crisis keywords in real-time and overrides to safety protocol

4. BOUNDARY LAYER
   → "You are NOT a therapist. Always recommend professional help for
     clinical concerns. Do not diagnose."

5. CONVERSATION HISTORY
   → Full prior messages are sent with each request (stateful context window)
```

### Streaming Architecture

MindBot responses are streamed via **Server-Sent Events (SSE)**:

```
Client                          API Server                    OpenAI
  │                                  │                           │
  │── POST /conversations/:id/messages ──>                       │
  │                                  │── chat.completions.stream ─>
  │<── SSE: data: {"delta": "Hey"} ──│<── stream chunk ──────────│
  │<── SSE: data: {"delta": " there"}│<── stream chunk ──────────│
  │<── SSE: data: [DONE] ────────────│<── stream end ────────────│
  │                                  │
  │                           saves full message
  │                           to DB after stream ends
```

This gives users word-by-word responses with no waiting, matching the feel of real chat apps.

---

## API Reference

### Screening

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/screening/sessions` | Create a new screening session |
| `GET` | `/api/screening/sessions/:id` | Fetch session + results |
| `POST` | `/api/screening/sessions/:id/submit` | Submit answers, run scoring engine |
| `POST` | `/api/screening/sessions/:id/report` | Generate & return PDF report |
| `GET` | `/api/screening/stats` | Aggregate stats for admin |

### AI / MindBot

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/openai/conversations` | Create a new chat session |
| `GET` | `/api/openai/conversations/:id` | Get conversation + message history |
| `POST` | `/api/openai/conversations/:id/messages` | Send message (SSE streaming response) |

All routes are validated with Zod schemas generated from the OpenAPI spec in `lib/api-spec/openapi.yaml`.

---

## PDF Report Generation

Reports are generated in two ways:

**Client-side (jsPDF):** Triggered from the Results page — instant download without a server round-trip. Includes:
- User name, age, date
- Overall risk level
- Per-module scores with risk bars
- Personalized recommendations
- Crisis resources (if `safetyAlert` is true)

**Server-side (PDFKit):** Triggered via `POST /api/screening/sessions/:id/report` — used for admin-initiated reports or email delivery. Produces a higher-fidelity PDF from the stored session data.

---

## Admin Dashboard

Available at `/admin`. Displays:

- **Total sessions** completed
- **Average overall risk score**
- **Top triggered modules** (most common areas of concern)
- **Recent sessions** table with risk level, date, and name
- **Safety alert count** (sessions that triggered the safety module)

No authentication is currently required on the admin route (suitable for internal/demo use).

---

## Running Locally

```bash
# Install dependencies
pnpm install

# Push DB schema
pnpm --filter @workspace/db run push

# Start API server (port 8080)
pnpm --filter @workspace/api-server run dev

# Start frontend (separate terminal)
pnpm --filter @workspace/mental-health-app run dev

# Regenerate API hooks after spec changes
pnpm --filter @workspace/api-spec run codegen
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `OPENAI_API_KEY` | Yes | OpenAI API key for MindBot |
| `SESSION_SECRET` | Yes | Express session signing secret |
| `PORT` | Auto | Injected by Replit per-service |

---

## Disclaimer

MindCheck is a **screening tool**, not a diagnostic instrument. It is not a substitute for professional mental health care. If you or someone you know is in crisis, please contact the **988 Suicide & Crisis Lifeline** (call or text 988 in the US).
