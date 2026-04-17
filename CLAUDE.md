# Big Green Tent — CLAUDE.md

A reviewer workspace for institutional donors to discover, evaluate, and manage vetted environmental nonprofits. React + Express + SQLite, with AI-augmented scoring and explanations.

---

## Architecture

### Stack
| Layer | Tech |
|---|---|
| Frontend | React 19, Vite 7, Tailwind CSS 3, Framer Motion, React Router 7 |
| Backend | Node.js 20, Express 4, better-sqlite3 |
| AI | OpenAI GPT-4o-mini (explanations), Ollama/Llama 3 (ETL enrichment) |
| Database | SQLite (single file: `server/big_green_tent.db`) |
| Observability | OpenTelemetry + Arize Phoenix (optional) |
| Data Pipeline | Python 3, ProPublica Nonprofits API |

### File Layout
```
big-green-tent/
├── src/                    # React frontend
│   ├── App.jsx             # Routes: /, /admin, /admin/personalize
│   ├── main.jsx            # React root + BrowserRouter
│   ├── index.css           # Brand design system (CSS variables + @layer components)
│   ├── components/
│   │   ├── AppShell.jsx    # Header, nav, user badge
│   │   ├── NavBar.jsx      # Nav links
│   │   └── ui.jsx          # Shared components (Button, Badge, Surface, etc.)
│   └── pages/
│       ├── DiscoveryPage.jsx    # Main filter/score/approve interface (612 lines)
│       ├── AdminPage.jsx        # Outreach packages dashboard
│       └── PersonalizePage.jsx  # Press-kit editor + PDF preview/export + auto-generated email preview
├── server/
│   ├── index.js            # Express routes + OpenAI integration
│   ├── db.js               # SQLite init + connection singleton
│   ├── schema.sql          # Tables: nonprofits, approved_organizations, attempts
│   ├── scoring.js          # Weighted 7-metric score engine (0–100)
│   ├── seed.js             # DB seed (disabled in prod)
│   └── tracing.js          # OTel/Phoenix instrumentation
├── data-pipeline/
│   ├── ingest_ollama.py    # ProPublica fetch + Ollama enrichment → SQLite
│   └── ingest_propublica.py  # Alternative (no AI enrichment)
├── public/brand/           # SVG/PNG brand assets (logos, dividers, frames)
├── tailwind.config.js      # Brand color tokens + font families
└── vite.config.js          # Dev proxy: /api → :8000
```

---

## Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Create .env at project root
cp server/.env.example .env
# → Add OPENAI_QUIZ_API_KEY= if you want AI explanations

# 3. Start both servers (Vite :5173 + Express :8000)
npm run dev
```

- Discovery UI: http://localhost:5173/
- Outreach Admin: http://localhost:5173/admin
- Personalize editor: http://localhost:5173/admin/personalize (reached from an approved org's "Personalize this package" button — requires router state)
- API: http://localhost:8000/api/...
- Health check: http://localhost:8000/healthz

The SQLite database (`server/big_green_tent.db`) is checked in with seed data — no ingest step needed for local dev.

### Re-ingesting Data (optional)
```bash
cd data-pipeline
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python ingest_ollama.py   # requires local Ollama + llama3 model
```

"Grand Reset" workflow: edit `schema.sql` → delete the `.db` file → restart server → re-run ingest.

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/nonprofits` | Filtered + scored nonprofit list |
| POST | `/api/explain` | GPT-4o-mini score explanation |
| POST | `/api/generate-outreach` | GPT-4o-mini outreach-text regeneration (per field) |
| POST | `/api/approve` | Add org to shortlist |
| GET | `/api/approved` | Fetch approved orgs (joined) |
| DELETE | `/api/approve/:id` | Remove from shortlist |
| GET | `/healthz` | Health check |

Query params for `/api/nonprofits`: `sector`, `maturity`, `efficiency`, `growth`, `sustainability`, `scale` (weights 0–2).

`/api/generate-outreach` body: `{ org: {...}, field: <key> }`. Returns `{ text: string }`. Returns `500` with friendly message if `OPENAI_QUIZ_API_KEY` is missing.

Supported `field` keys:
- **Press-kit (PDF) — used by PersonalizePage**: `aboutHeadline`, `aboutBgt`, `methodology`, `whySelected`, `offer`, `nextSteps`
- **Email (legacy, still supported)**: `recipient`, `subject`, `opening`, `context`, `ask`, `closing`

---

## Scoring Engine (`server/scoring.js`)

7 metrics stored as REAL (0.5–2.0) in the `nonprofits` table:
- `program_efficiency`, `revenue_growth`, `sustainability`, `scale`
- `grant_distribution`, `geographic_reach`, `innovation_output`

Formula: `weighted_sum / total_weight * 50`, clamped to 0–100.
User weight sliders (0–2) amplify or suppress each metric. Default weight = 1.

**Do not change the scoring schema** without also updating the ingest pipeline and frontend weight sliders.

---

## Brand Design System

### Colors (per Big Green Tent Brand Kit)
| Name | Hex | Use |
|---|---|---|
| `forest` | `#0D3023` | Primary dark, headers |
| `pine` | `#157151` | Secondary dark |
| `grove` | `#2D915F` | Accent green |
| `sun` | `#F4C148` | Highlight, CTAs |
| `ember` | `#ED5632` | Alerts, section blocks |
| `sky` | `#4FA2DB` | Secondary blue |
| `ink` | `#231F20` | Body text |
| `cream` | `#F6F0E5` | Warm surface bg |
| `mist` | `#E7DDCE` | Secondary surface |
| `canvas` | `#F9F6EF` | Press-kit paper bg |
| `sand` | `#C1AE92` | Tinted surfaces |
| `soil` | `#3F291E` | PDF preview backdrop |

### Typography
| Role | Font |
|---|---|
| Headline (`font-display`) | GT Alpina Condensed Light |
| Body (`font-body`) | Articulat CF Regular |
| CTA/subhead (`font-cta`) | Articulat CF Bold |
| Accent (`font-accent`) | GT Alpina Condensed Light Italic |

### Reusable CSS Classes (`index.css` `@layer components`)
- `.brand-card` / `.brand-card-strong` — glass-morphism surfaces
- `.brand-button`, `.brand-button-primary`, `.brand-button-secondary`
- `.brand-input`, `.brand-select` — form controls (also used on textareas in PersonalizePage)
- `.range-track` — gradient slider with sun-yellow thumb
- `.eyebrow` — small caps label
- `.display-title` — large serif headline
- `.accent-script` — italic serif accent
- `.dashboard-tent` — dark hero with radial sun highlight
- `.hero-tent` — green gradient tent image hero
- `.soft-grid` — subtle grid background

### Print styles (`@media print`)
Defined in `index.css` below the component layer. Hides `body > *:not(#bgt-print-area)`, reveals the portal-mounted print container, sets `@page { size: A4; margin: 0 }` so the `PressKitDocument` hero bleeds to the page edge. Used by PersonalizePage's Preview PDF modal and Export as PDF.

All brand assets live in `public/brand/`. Reference via `/brand/filename.svg`.

---

## Key Components

### `DiscoveryPage.jsx`
- Left sidebar: sector/maturity dropdowns + 7 weight sliders (0–2)
- Hero: live stats (matches, shortlist count, sector)
- Tab view: "Top matches" / "Saved shortlist"
- Card click → animated detail panel (Framer Motion layout)
  - AI explanation on demand (`/api/explain`)
  - 4-step due-diligence checklist with links
  - "Approve for outreach" → `/api/approve`
- Toast notifications: bottom-right, auto-dismiss 3.2s

### `AdminPage.jsx`
- Approved org list with metric grid (7 metrics, 0–100)
- Click org → pre-filled outreach package (subject, body, checklist)
- "Personalize this package →" button navigates to `/admin/personalize` with the selected org passed via React Router `location.state.org`

### `PersonalizePage.jsx` — Press-kit editor + email preview
Reached from AdminPage; redirects to `/admin` if no org state is present (e.g., on refresh). Organization context (mission, sector, maturity, location, enrichment summary, 7-metric impact snapshot) renders beneath the org name as a hero.

**Separation of concerns**: press-kit fields (for PDF) are distinct from the email preview. Editing fields does not change the email; the email is auto-generated from the org.

**Layout** — two-column grid on desktop:
- **Left (editor)**: 6 editable press-kit fields — `aboutHeadline`, `aboutBgt`, `methodology`, `whySelected`, `offer`, `nextSteps`. Each has label + hint + resizable textarea + live character count (amber → ember when near/at limit) + per-field "Regenerate" button. Seeded on load via `initKit(org)`.
- **Right (sticky)**: Package actions card (Preview PDF, Export PDF, Copy email template) + live email preview on dark forest surface with sun-colored section labels, full-opacity `text-cream` body, and a monospaced `To:` line using `slugForEmail(org.name)` → `partnerships@{slug}.org`.

**AI regeneration** — each field has its own `Regenerate` button; a top-level "Regenerate all with AI" button fires them sequentially. All call `POST /api/generate-outreach` with the press-kit field key.

**PDF preview + export** — `PdfPreviewModal` is a full-screen overlay on soil-brown (`#3F291E`) backdrop with Escape-key close, Cancel, and Export CTAs. It renders the same `PressKitDocument` the print flow uses, so what reviewers see is what exports. `exportPDF()` closes the modal and calls `window.print()`. `PressKitDocument` is mounted into `document.body` via `createPortal` (`#bgt-print-area`), hidden off-screen by default, and revealed under `@media print` while the app shell is hidden.

**PressKitDocument (brand-kit aligned)** — editorial one-pager built from the Big Green Tent Brand Kit:
- Hero cover: ember color block + photo panel with organic frame overlay (`/brand/TENT_HEADER-Forest.png`, `/brand/BGT_OrganicFrame-1_Grove.png`), cream wordmark, condensed serif headline.
- Italic serif pull-quote band on sand tint.
- "About Big Green Tent" + "How We Review" two-column on canvas bg.
- 7-metric "Impact Methodology" chips color-coded per brand palette (forest, pine, grove, sun, ember, sky, soil).
- Forest band "Why We Selected {org}" with sun quarter-circle accent.
- Three offer cards (Visibility / Introductions / Impact synthesis) on canvas.
- Sand-tinted "Next Steps" section with sun CTA pill.
- Forest footer with tent icon.
- Typography: GT Alpina Condensed Light for headlines, Articulat CF for body, Articulat CF Bold for CTA/labels, GT Alpina Condensed Light Italic for accents.

**Email copy** — `buildEmail(org)` generates subject/body/recipient independently from editable fields. `copyEmail()` uses `navigator.clipboard.writeText` with a hidden-textarea `document.execCommand('copy')` fallback. Button turns green with checkmark for 2.5s.

**Accessibility (WCAG 2.1 AA)**:
- Skip-to-content link (`#personalize-main`)
- Screen-reader-only `role="status" aria-live="polite"` region mirrors all toast announcements
- All controls have `<label htmlFor>`, `aria-describedby` for hints and counts, `aria-busy` on regeneration, `aria-pressed` on copy button, `aria-label` on icon buttons
- Logical heading hierarchy: `<h1>` (org name) → `<h2>` per section
- Focus-visible sky-blue ring on every interactive element
- All color pairs meet 4.5:1 contrast ratio

### `ui.jsx` — Shared primitives
`SectionHeading`, `Surface`, `Button`, `Badge`, `TabButton`, `FieldLabel`, `EmptyState`

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `OPENAI_QUIZ_API_KEY` | No | — | GPT-4o-mini explanations |
| `PORT` | No | `8000` | Express server port |
| `DATABASE_PATH` | No | `server/big_green_tent.db` | SQLite path |
| `PHOENIX_COLLECTOR_ENDPOINT` | No | `http://localhost:6006` | OTel tracing |
| `PHOENIX_PROJECT_NAME` | No | `big-brain` | OTel project name |
| `PROMPT_VARIANT` | No | `A` | A/B prompt variant |

`.env` must be at the **project root** (where `npm run dev` is called from).

---

## Deployment (Render / Production)

```bash
# Build
npm install && npm run build

# Start (Express serves /dist as static + API)
npm start
```

- Set `NODE_ENV=production`, `OPENAI_QUIZ_API_KEY`, optionally `DATABASE_PATH`
- Add a persistent disk at `/data` and set `DATABASE_PATH=/data/big_green_tent.db` to survive redeploys
- Health check endpoint: `GET /healthz`

---

## Development Notes

- **Backend is stable** — do not change `schema.sql`, scoring logic, or API contracts without updating the data pipeline and frontend together.
- **Frontend redesign** — all visual work is isolated to `src/`. The brand system is in `index.css` and `tailwind.config.js`; add new components to `src/components/ui.jsx`.
- **Animations** — use Framer Motion (`motion.*`, `AnimatePresence`, `layout` prop). Do not use CSS transitions for layout-affecting changes.
- **No email send** — the outreach package in AdminPage is prototype-only; it renders a pre-filled template. PersonalizePage adds PDF export and clipboard copy, but still no SMTP integration.
- **Seeding disabled** — `seed.js` is commented out. The committed `.db` file is the demo dataset.
- **Linting** — run `npm run lint` before committing; ESLint enforces React hooks rules.
- **Accessibility-first** — all new UI work must keep WCAG 2.1 AA compliance: labeled controls, visible focus ring, `aria-live` for status changes, logical heading hierarchy, 4.5:1 contrast.
- **Title Case everywhere** — every word in headers, subheaders, section titles, buttons, tabs, stat labels, badges, empty states, and toast titles is capitalized (strict Title Case). This applies site-wide to DiscoveryPage, AdminPage, PersonalizePage, and AppShell. Sentence-case is only acceptable inside body paragraphs and descriptive hint text.
- **Brand Kit is authoritative** — colors, typography, and PDF design must match the Big Green Tent Brand Kit. Use exact brand hex values (see table above). Press-kit PDFs should feature brand imagery from `public/brand/` (tent photography, organic frames, logomarks).
- **Server restart required** — Express (`server/index.js`) does not hot-reload. After editing server code, kill and restart `npm run dev`. Vite HMR only covers frontend.

---

## Recent Changes

### Press-kit redesign + brand-kit alignment (latest)
- Split [PersonalizePage.jsx](src/pages/PersonalizePage.jsx) into a press-kit editor (6 new fields: `aboutHeadline`, `aboutBgt`, `methodology`, `whySelected`, `offer`, `nextSteps`) and a side-panel email preview auto-generated from the org.
- Added `PdfPreviewModal` — full-screen preview on soil-brown backdrop with Escape-close, Cancel, and Export actions. Export calls `window.print()`.
- Rebuilt `PressKitDocument` as an editorial one-pager matching the Big Green Tent Brand Kit: hero cover with ember block + organic-framed photography, italic serif pull-quote, color-coded 7-metric chips, forest "Why We Selected" band with sun quarter-circle, offer cards, sand-tinted next steps, forest footer.
- Added 6 press-kit prompts to `POST /api/generate-outreach` in [server/index.js](server/index.js) (legacy email prompts preserved).
- Hero now surfaces org mission, location, enrichment summary, and 7-metric impact snapshot.
- Email preview accessibility: full-opacity `text-cream`, sun-colored section labels, monospaced placeholder `To:` address via `slugForEmail(org.name)`.

### Title Case convention (site-wide)
- Every header, subheader, button, tab, badge, stat label, empty state, and toast title across [DiscoveryPage.jsx](src/pages/DiscoveryPage.jsx), [AdminPage.jsx](src/pages/AdminPage.jsx), [PersonalizePage.jsx](src/pages/PersonalizePage.jsx), and [AppShell.jsx](src/components/AppShell.jsx) is now Title Case.

### Personalize flow (initial)
- Added `/admin/personalize` route and [PersonalizePage.jsx](src/pages/PersonalizePage.jsx)
- Added `POST /api/generate-outreach` endpoint in [server/index.js](server/index.js)
- Added `@media print` block in [src/index.css](src/index.css)
- Changed "Ready to personalize" badge in [AdminPage.jsx](src/pages/AdminPage.jsx) to a navigation button that passes the selected org via `location.state`
