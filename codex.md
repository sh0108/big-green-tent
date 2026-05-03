# Big Green Tent Repo Brain

Last updated: April 29, 2026

This file is the working memory for the Big Green Tent prototype. Use it to understand the product intent, the current architecture, the design direction, the dataset, and the implementation decisions that have shaped the repo.

## Project Purpose

Big Green Tent is an internal reviewer workspace for environmental nonprofit discovery, evaluation, shortlisting, and outreach preparation.

The prototype is not intended to feel like a public marketing website or a traditional analytics dashboard. It should feel like a warm, editorial, accessible internal tool that helps human reviewers make confident decisions while staying rooted in Big Green Tent's brand.

The main user is a human reviewer evaluating environmental organizations before they move into outreach. The interface should reduce cognitive load, make screening logic transparent, and keep the reviewer oriented as they move between discovery, shortlist review, and outreach preparation.

## Company And Brand Intent

Big Green Tent's mission direction, as interpreted during this build, is about connecting people, purpose, storytelling, and practical environmental action.

Core brand ideas:

- Human, not clinical.
- Environmental, but not generic green-tech.
- Editorial and mission-led, not spreadsheet-first.
- Trustworthy enough for donor and reviewer workflows.
- Warm enough to make sustainability feel approachable.
- Structured enough to support repeatable internal evaluation.

Brand typography from the provided kit:

- Headline: `GT Alpina Condensed Light`.
- Accent or pull quote: `GT Alpina Condensed Light Italic`.
- Body copy: `Articulat CF Regular`.
- Subheads and CTAs: `Articulat CF Bold`.

Brand color tokens used in the app:

- Forest: `#0d3023`, the primary dark green for anchors, buttons, and high-contrast surfaces.
- Pine: `#1a7252`, supportive green for links and states.
- Grove: `#2d915f`, secondary green for positive accents.
- Sun: `#f4c146`, warm yellow for action accents.
- Ember: `#ed5632`, warning and risk accent.
- Sky: `#4fa2db`, secondary informational accent.
- Ink: `#231f20`, primary text.
- Cream and warm off-whites for page backgrounds and card surfaces.

Capacity weighting chart colors:

- Financial Stability: `#9FE1CB`.
- Revenue Health: `#B5D4F4`.
- Operational Efficiency: `#FAC775`.
- Organizational Maturity: `#D0CBF6`.

Brand assets live in `public/brand`. The shell currently uses `BGT-Tent_Icon_Forest.svg`; organic frame and divider assets are used sparingly so dense operational UI does not become decorative clutter.

## Current Stack

Frontend:

- React 19.
- Vite 7.
- React Router 7.
- Tailwind CSS plus custom CSS tokens in `src/index.css`.
- Framer Motion is installed and used lightly.
- Lucide React icons.
- D3 Geo and TopoJSON for the map.

Backend:

- Node.js with Express.
- SQLite via `better-sqlite3`.
- OpenAI SDK for optional explanation and outreach generation endpoints.
- Dotenv for local env loading.

State management:

- Local React state only: `useState`, `useEffect`, and `useMemo`.
- No Redux, Zustand, server-state library, or global state store.
- Shortlist persistence is backend-backed through SQLite, not browser-only state.

Data imports:

- Primary organization data is imported from `server/bgt_orgs_data_v2.json`.
- Map topology is fetched from `public/data/us-states-10m.json`.
- Brand images and SVGs are served from `public/brand`.
- The generated SQLite database is `server/big_green_tent.db`.

## Local Development

Primary local command:

```bash
npm run dev
```

This runs both services through `concurrently`:

- Vite frontend at `http://localhost:5173/` unless that port is busy.
- Express backend at `http://localhost:8000/`.

Useful commands:

```bash
npm run build
npm run lint
npm start
```

Common local issue:

- If localhost refuses to connect, the dev server is not running.
- If port `8000` is already in use, the backend will crash with `EADDRINUSE`.
- If Vite says port `5173` is busy, it may move to `5174`, `5175`, or another port. Use the URL printed by Vite.

OpenAI environment variable:

```bash
OPENAI_QUIZ_API_KEY=your_key_here
```

If this key is missing, the app still runs, but AI-backed endpoints return errors. The local server logs `Missing OPENAI_QUIZ_API_KEY in .env`.

## Routes

Frontend routes are defined in `src/App.jsx`:

- `/` renders `DiscoveryPage`.
- `/admin` renders `AdminPage`.
- `/admin/personalize` renders `PersonalizePage`.
- Unknown routes redirect to `/`.

The branded header shell is `src/components/AppShell.jsx`. It shows:

- Big Green Tent logo and wordmark treatment.
- `Reviewer Workspace`.
- Navigation between Discovery and Outreach.
- Reviewer access badge.
- Reviewer profile shown as `Jane Smith`.
- Log Out button placeholder.

Important routing note:

- A prior version used route-level animation with `AnimatePresence`.
- That caused intermittent blank Outreach pages after navigation.
- The current direct `Routes` rendering is intentional for reliability.

## Frontend Structure

Key files:

- `src/main.jsx`: React entry point.
- `src/App.jsx`: route composition and app shell.
- `src/index.css`: design tokens, global typography, brand components, form controls, focus states.
- `src/components/AppShell.jsx`: shared branded header and navigation.
- `src/components/ui.jsx`: shared primitives such as `Surface`, `Button`, `Badge`, `TabButton`, `FieldLabel`, and `EmptyState`.
- `src/components/DiscoveryMap.jsx`: US map, state filtering, candidate markers.
- `src/pages/DiscoveryPage.jsx`: main reviewer discovery workspace.
- `src/pages/AdminPage.jsx`: outreach dashboard and approved organization workspace.
- `src/pages/PersonalizePage.jsx`: outreach personalization editor.
- `src/components/NavBar.jsx`: legacy component that should not be treated as the active shell.

Styling approach:

- Use Tailwind utilities for component layout.
- Use `src/index.css` for shared brand classes and CSS variables.
- Prefer the shared UI primitives before adding one-off styles.
- Keep focus states visible and keyboard-accessible.
- Use `accent-color: var(--forest)` for native checkbox and radio selected states.

Typography and wrapping:

- The app has had repeated UI polish passes to prevent one-word widow lines.
- `FieldLabel` uses balanced wrapping.
- Detail and profile text should prefer readable line lengths over cramped multi-column density.
- If one-word widow tails appear, adjust container widths, line heights, or copy length rather than shrinking text too far.

## Backend Structure

Key files:

- `server/index.js`: Express app, API routes, OpenAI calls, static production serving.
- `server/db.js`: SQLite connection, schema execution, lightweight migrations, indexes.
- `server/schema.sql`: tables for legacy attempts/nonprofits plus current organizations and approvals.
- `server/seed.js`: seeds organizations from JSON only when the organizations table is empty.
- `server/capacityScoring.js`: recalculates the four BGT capacity category scores from raw 990 metrics using maturity-tier thresholds ported from `pull_990_data.py`.
- `server/bgt_orgs_data_v2.json`: current source dataset.
- `server/big_green_tent.db`: generated local SQLite database.
- `server/scoring.js`: legacy seven-metric scoring helper; current Discovery page computes four-score capacity weighting in the frontend.
- `server/tracing.js`: tracing instrumentation.

Backend endpoints:

- `GET /healthz`: health check.
- `GET /api/orgs`: in-scope organizations after filters.
- `GET /api/orgs/manual`: manual-review organizations outside the BGT revenue band.
- `GET /api/orgs/stats`: summary stats for current filters.
- `GET /api/orgs/:ein`: one organization by EIN.
- `POST /api/explain`: optional OpenAI explanation.
- `POST /api/generate-outreach`: optional OpenAI outreach copy generation.
- `POST /api/approve`: save an organization to the approved shortlist.
- `GET /api/approved`: fetch approved shortlist with compatibility aliases.
- `DELETE /api/approve/:id`: remove one approved row by approval id.

The Express server also serves `dist` in production and falls back to `dist/index.html` for frontend routes.

## Database And Seeding

The SQLite schema includes both legacy and current tables:

- `attempts`: legacy quiz/prototype table.
- `nonprofits`: legacy nonprofit table with old seven-metric fields.
- `organizations`: current BGT organization data table.
- `approved_organizations`: shortlist table.

The current source of truth is the JSON file:

```text
server/bgt_orgs_data_v2.json
```

Current dataset shape:

- `mainOrgs`: 167 in-scope organizations.
- `manualReviewOrgs`: 40 outside-band organizations.
- Total seeded organizations: 207.

Seeding behavior:

- `seedIfEmpty(getDb())` runs when the server starts.
- It only seeds if the `organizations` table is empty.
- If the JSON changes and you need to reseed locally, delete `server/big_green_tent.db` and restart the dev server.

Important database note:

- `server/big_green_tent.db` is generated local state, not the durable source of truth.
- It can contain local shortlist edits and reseed artifacts.
- Avoid treating database diffs as meaningful product code changes unless the task is explicitly about a seeded demo state.

Approved shortlist compatibility:

- The original app used `nonprofit_id`.
- The BGT dataset uses EINs.
- `approved_organizations` now supports `org_ein`.
- `/api/approved` returns `approval_id`, `org_ein`, and compatibility aliases so Discovery, Outreach, and Personalize can keep working.

## Dataset Interpretation

The current dataset is scoped to C32 water-related organizations. The default sector is:

```text
Water Systems & Marine & Coastal Ecosystems
```

The Discovery sector dropdown intentionally shows the full environmental taxonomy for client preview:

- All sectors.
- Built Environment & Sustainable Transportation.
- Climate Change & Adaptation.
- Energy Systems.
- Environmental Education & Communication.
- Environmental Health.
- Environmental Justice & Equity.
- Food & Agriculture.
- Green Finance & ESG.
- Industrial Ecology & Circularity.
- Land Conservation, Forests & Soils.
- Law & Public Policy.
- Water Systems & Marine & Coastal Ecosystems.
- Science, Research & Innovation.
- Wildlife & Biodiversity.

Because the current data is C32-specific, choosing non-water sectors may produce no matches. That is expected until a broader dataset exists.

Manual review eligibility labels are normalized in the frontend because earlier source labels were ambiguous:

- Yellow/below labels display `Below BGT Revenue Band (500K minimum)`.
- Purple/above labels display `Above BGT Revenue Band (5M maximum)`.

## Discovery Workspace

`src/pages/DiscoveryPage.jsx` is the main product surface.

Core purpose:

- Help reviewers discover, filter, evaluate, shortlist, and inspect environmental organizations.
- Keep all backend logic intact while improving the reviewer-facing UI.

Main sections:

- Hero dashboard with match count, average score, top sector, and top match.
- Next-step cards for explaining the top match, reviewing the shortlist, and tuning/resetting the lens.
- Geography map for state-level review.
- Filter panel.
- Discovery tabs for Top Matches, Saved Shortlist, Manual Review, and Data Gaps.
- Inline selected organization detail panel.

Hero next-step behavior:

- `Generate explanation` opens the current top match inline and reveals the AI-style narrative panel.
- `Open shortlist` switches to the Saved Shortlist tab and scrolls to the shortlist panel.
- `Focus sidebar` scrolls to the filters.

Important recent behavior:

- `Review details` expands the selected card inline where the card appears.
- It should not jump the reviewer to the bottom of the page.
- The selected details panel appears below the active card in Top Matches, Manual Review, and Data Gaps.

## Discovery Filters

The filter panel is the current "Shape the lens" control surface.

Current filters:

- Environmental Sector dropdown.
- State dropdown.
- Maturity dropdown.
- Minimum Alignment Score slider.
- Program Focus checklist.
- Website Mission Match checklist.
- Data Quality Gate radio group.
- Minimum Score Threshold number input.
- Capacity Weighting segmented controls.

Maturity options:

- All maturity levels.
- Emerging, 0-5 years of operation.
- Established, 5-15 years of operation.
- Mature, 15+ years of operation.

Minimum Alignment Score labels:

- `1 = Minimal`.
- `2 = Tangential`.
- `3 = Some water connection`.
- `4 = Strong adjacent`.
- `5 = Core water mission`.

Minimum Alignment Score explanations:

- Minimal: hardly any connection to water at all.
- Tangential: water barely comes up.
- Some water connection: water is part of what they do but not the focus.
- Strong adjacent: clear environmental org with a significant water component.
- Core water mission: unambiguously a water org, like a watershed council or marine conservation group.

Program Focus labels:

- Highly Focused: water is the clear center of the organization's work.
- Moderately Focused: water is important, but shares space with adjacent priorities.
- Diversified: water sits alongside several other environmental priorities.
- Sprawling: the organization covers many issue areas, with water as one part.
- Tangential: water appears only lightly in the overall mission.

Website Mission Match labels:

- Confirmed: the website clearly supports the mission fit.
- Partial: the website supports part of the mission fit, but not fully.
- Unclear: the website does not make the water connection easy to verify.
- Diverged: the website suggests the organization may have drifted from the expected focus.
- Not available: no usable website signal was available.

Data Quality Gate labels:

- Show all organizations.
- Only show high and medium confidence organizations.
- Only show high confidence organizations.

Minimum Score Threshold:

- Default is `70`.
- Maximum is `100`.
- It affects Top Matches only.
- Manual Review intentionally ignores this threshold because those organizations are outside the revenue band and shown for context.

Capacity Weighting:

- Four controls: Financial Stability, Revenue Health, Operational Efficiency, Organizational Maturity.
- Each uses a polished segmented control with Light, Medium, High.
- Internal mapping is `Light = 13`, `Medium = 25`, `High = 37`.
- The values are normalized so the final weights always sum to 100%.
- The Weighting Mix indicator uses matching colors and a donut/progress-bar visual.
- The frontend computes `computedOverallScore` from the four weighted scores without mutating stored source data.

## Discovery Cards And Detail Panel

Top Match and Manual Review cards show:

- Organization name.
- Sector.
- Maturity.
- Data confidence.
- Mission alignment.
- Program focus.
- Website mission match.
- State.
- Mission summary.
- Program summary.
- Geographic scope.
- AI insight.
- Match score.
- Save or remove shortlist action.
- Review details action.

Card polish decisions:

- Badges should align text vertically in the center.
- Match score card and Save to Shortlist pill should feel visually paired, not wildly different widths.
- The match score card was intentionally returned to a compact size after an overly wide pass.
- Buttons and hover states should maintain sufficient contrast.

Selected organization detail panel includes:

- AI Explanation block.
- Normalized Mission Statement.
- Data Confidence.
- Mission Profile.
- Capacity score tiles.
- Source Data.
- Hard Red Flags.
- Soft Flags.
- Human Evaluation reminders.
- Reviewer Notes.

Mission statement normalization:

- Some source mission statements arrive in all caps from filings.
- `normalizeMissionStatement` converts all-caps text into readable sentence-style capitalization when it detects the pattern.
- This is presentation-layer cleanup only; it does not rewrite the stored source.

Human evaluation reminders:

- These are reminders, not mandatory blockers.
- The reviewer should not have to check every item before approving.
- The four reminders are:
  - Verify Program Outcomes.
  - Review Field Reports.
  - Assess Community Engagement.
  - Contextualize Financial Data.
- Each reminder has a source-document launch action.

## Shortlist Behavior

Shortlisting is backend-backed.

Add flow:

- Discovery calls `POST /api/approve`.
- It sends `org_ein`, `name`, and `sector`.
- The response id becomes `approval_id` in local React state.

Remove flow:

- Discovery calls `DELETE /api/approve/:id`.
- The id must be the approval row id, not the org EIN.
- This fixed a bug where removing one item could appear to clear the entire shortlist.

Saved Shortlist tab:

- Uses `/api/approved`.
- Joins saved approval rows back to current org data where possible.
- Shows the selected shortlist without requiring a page refresh.

## Manual Review

Manual Review shows organizations outside BGT's standard Top Matches pool but still worth contextual visibility.

Manual Review rules:

- These organizations are either below the `$500K` BGT revenue floor or missing mission-review fields.
- They are distinct from upstream data gaps.
- Capacity scores are shown for context only.
- Manual Review sorts by mission alignment first, then data confidence.
- Minimum Score Threshold does not filter Manual Review.

Data Gaps:

- The prototype now keeps all 217 fixed Excel rows visible in the backend/UI.
- Top Matches: 202.
- Manual Review: 6.
- Data Gaps: 9.
- Data Gaps are upstream exclusions, not candidate recommendations.
- Five are flagged `Missing Full 990 Filing`.
- Four are flagged `No NCCS Coverage`.
- Data Gaps use `/api/orgs/excluded` and the `excludedOrgs` group in `server/bgt_orgs_data_v2.json`.
- They remain visible so reviewers can re-examine them if better filings, NCCS coverage, or source evidence becomes available.

Eligibility label normalization is intentional because the client needs plain language:

- `Below BGT Revenue Band (500K minimum)`.
- `Above BGT Revenue Band (5M maximum)`.

## Map

`src/components/DiscoveryMap.jsx` renders a US map with D3 and TopoJSON.

Map behavior:

- Loads topology from `/data/us-states-10m.json`.
- Shows candidate markers by state centroid with deterministic offsets.
- Approved organizations use a different marker state.
- The map state dropdown and filter-panel state dropdown stay in sync.
- Clicking a state updates the state filter.
- Clicking an organization marker opens that organization in the Top Matches tab and scrolls to its card.

## Outreach Dashboard

`src/pages/AdminPage.jsx` is the Outreach workspace.

Purpose:

- Show approved organizations.
- Summarize outreach queue status.
- Help reviewers move from shortlist to contact preparation.

Current dashboard stats:

- Approved.
- Sectors covered.
- Top sector.
- AVG MATCH SCORE.

Important naming decision:

- The stat formerly called `AVG READINESS` was renamed to `AVG MATCH SCORE`.

Outreach next steps:

- Personalize the next draft.
- Review the full shortlist.
- Expand the pipeline.

Pre-filled outreach prototype:

- Admin includes a prototype-only contact package generator.
- It creates placeholder recipient, subject, context, ask, and notes from existing org data.
- This is not an email-sending function.
- This is not AI-backed unless the user goes into the separate personalization generation route.

## Personalization Page

`src/pages/PersonalizePage.jsx` is a deeper outreach editor.

Important caveat:

- This page still carries some legacy structure from the earlier prototype.
- Backend compatibility aliases keep it functional with the newer organization dataset.
- It has not been fully redesigned around the four-score BGT methodology in the same way Discovery has.

Treat this as future-work territory if the prototype moves beyond review/demo.

## Design System Decisions

The redesign replaced the old clinical/starter prototype styling with a shared brand system.

Major choices:

- Warm cream surfaces instead of stark white cards.
- Forest green for important controls and high-trust panels.
- Sun yellow for primary accent actions when contrast allows.
- Organic, hand-drawn brand assets used sparingly.
- Rounded cards and pill controls for a softer internal workspace feel.
- Larger touch targets and visible focus outlines.
- Native selects and inputs retained where they improve accessibility.
- Inline toasts and confirmations instead of browser `alert()` patterns.

Accessibility priorities:

- Preserve keyboard focus states.
- Maintain contrast on hover and active states.
- Avoid hover styles that make text disappear.
- Avoid mandatory checklist hurdles for repeated reviewer workflows.
- Use explanatory labels for filters so reviewers do not need to decode internal scoring language.
- Keep dense operational UI legible and not over-decorated.

Specific accessibility fixes made during the build:

- Dropdown controls were repositioned and restyled for readability.
- Button hover colors were corrected when text became low-contrast.
- Checkbox and radio selected states now use dark BGT green rather than default blue.
- Tooltips were made more opaque after transparent bubbles became unreadable.
- Filter helper text was removed or rewritten when it confused reviewers.
- One-word widow tails were reduced through label cleanup, balanced wrapping, and layout adjustments.

## Important Product Decisions

This is an internal tool dashboard:

- Do not frame it as a generic "mission-led prototype" in the UI.
- The reviewer should see operational language: Discovery, Outreach, Reviewer Workspace, Reviewer Access, Log Out.
- Client-facing labels should be clear and plain.

Backend was intentionally preserved:

- The redesign was a UI/UX overhaul, not a system rewrite.
- Routes, endpoints, SQLite usage, and request/response shapes were kept stable where possible.

Shortlist persistence stayed backend-backed:

- One prompt suggested a session-only shortlist.
- The implemented choice preserved backend persistence so Discovery and Outreach remain connected.
- This is a deliberate deviation because it better supports the internal workflow.

Human review steps are reminders:

- They should help reviewers remember due diligence checks.
- They should not lock the approval button.
- The reviewer workflow is repetitive, so unnecessary gates create friction.

Full sector taxonomy is shown for demo value:

- Even though the current data is C32 scoped, the dropdown includes all environmental categories.
- This helps clients understand where the product could go once more sectors are loaded.

## Known Technical Debt

README drift:

- `README.md` still describes parts of the older seven-metric and pipeline workflow.
- This `codex.md` is more accurate for the current UI and C32 dataset state.

Legacy scoring:

- `server/scoring.js` still contains old seven-metric scoring logic.
- `server/capacityScoring.js` is the current backend capacity scoring path.
- During seeding, `server/seed.js` ignores the static JSON score objects and recalculates Financial Stability, Revenue Health, Operational Efficiency, Organizational Maturity, and overall score from raw metrics.
- The recalculation uses Emerging, Established, and Mature thresholds from the provided `pull_990_data.py`.
- Discovery still computes the live user-weighted match score in the frontend from those four backend-provided category scores.
- Mission review fields remain separate from capacity scoring; an org can have strong 990 capacity scores while still being sent to Manual Review for missing mission-review data.

Legacy data-pipeline folder:

- `data-pipeline/venv` appears in the repo file tree.
- Treat it as environment/vendor-like material, not app architecture.
- Avoid spending time there unless the task is explicitly about data ingestion.

Database diffs:

- `server/big_green_tent.db` changes during local reseeding and shortlist testing.
- Do not assume database diffs are intentional source changes.

Personalize page:

- It is partially adapted through compatibility aliases.
- It is not yet as brand- or methodology-aligned as Discovery and Outreach.

AI endpoints:

- AI functionality requires `OPENAI_QUIZ_API_KEY`.
- The prototype should still be reviewable without it.
- Missing key errors are expected if the reviewer uses AI generation without configuring the env var.

Render or temporary deployment:

- The app can be deployed as a single Node web service.
- Build command: `npm install && npm run build`.
- Start command: `npm start`.
- Health check path: `/healthz`.
- SQLite persistence requires a persistent disk and `DATABASE_PATH`; otherwise shortlist state may reset.

## Current Uncommitted Context To Watch

At the time this file was created, local status included:

- Modified `src/pages/DiscoveryPage.jsx`.
- Modified `src/components/ui.jsx`.
- Modified `src/index.css`.
- Modified `server/big_green_tent.db`.
- Untracked `blank_orgs_report.csv`.

Do not revert or discard these unless the user explicitly asks. Some are likely intentional UI changes and local generated data.

## Testing Checklist

Run after meaningful frontend or backend changes:

```bash
npm run build
npm run lint
```

Manual browser checks:

- `/` renders Discovery.
- `/admin` renders Outreach.
- `/admin/personalize` renders the personalization editor.
- Filters update Top Matches.
- Sector, state, and maturity dropdowns work.
- Minimum Alignment Score tooltip is readable.
- Capacity segmented controls update the Weighting Mix visual.
- Top Matches and Manual Review cards open details inline.
- Generate explanation opens and reveals the selected top match panel.
- Save to Shortlist adds one org.
- Remove from Shortlist removes only that org.
- Saved Shortlist tab scrolls into view when opened from hero.
- Outreach dashboard loads approved orgs.
- Contact package prototype opens in Outreach.
- Map state selection stays synced with filters.

## What Future Codex Should Be Careful About

- Do not make backend changes unless the user explicitly wants system behavior changed.
- Do not remove compatibility aliases from `formatOrg` unless all frontend pages are updated.
- Do not change `/`, `/admin`, or `/admin/personalize` routes casually.
- Do not reintroduce route animation if it causes blank pages.
- Do not turn human review reminders into mandatory approval gates.
- Do not make hover states low contrast.
- Do not collapse the full sector taxonomy just because current data is water-only.
- Do not commit generated database changes by default unless asked.
- Do not treat `node_modules`, `dist`, or `data-pipeline/venv` as meaningful app source.
- Keep UI language plain and reviewer-centered.

## Future Work Ideas

- Fully redesign `PersonalizePage` around the current BGT four-score methodology.
- Add a durable auth/profile model if reviewer identity becomes real.
- Add persistent deployment storage for approved shortlist rows.
- Add a broader dataset beyond C32 so the full sector taxonomy becomes active.
- Move frontend scoring constants into a shared config if backend and frontend need guaranteed parity.
- Add tests for shortlist add/remove and filter query generation.
- Add an admin-only reseed command or endpoint for demo maintenance.
- Update `README.md` so it matches the current C32 dataset and BGT reviewer workflow.
