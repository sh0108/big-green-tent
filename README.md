# Simplify — AI-Assisted Smart Application Form

Simplify is a web application that uses an AI chatbot (GPT-4o-mini) to guide users through completing an application form. The agent extracts structured data from the conversation and sends real-time JSON updates to populate the form fields automatically.

## Features

- **AI-Guided Form Filling** — A text-based chatbot asks for each field one at a time, extracting and validating data conversationally.
- **Smart Mission Rewriting** — The AI analyzes the user's mission statement and proposes a more professional version before saving.
- **Real-Time Field Updates** — JSON blocks emitted by the AI are parsed by the frontend and instantly reflected in the form UI.
- **Application Scoring** — On submission, a scoring engine computes an Impact Score (keyword-based sentiment analysis of the mission) and a Revenue Percentile (vs. existing submissions).
- **Auto-Save** — Form state and chat history persist in `localStorage`, so progress survives page reloads.
- **Admin Dashboard** — Password-protected view of all submissions with summary statistics and CSV export.

## Tech Stack

| Layer    | Technology                    |
|----------|-------------------------------|
| Frontend | React 19, Vite, Framer Motion |
| Backend  | Node.js, Express              |
| Database | SQLite (better-sqlite3)       |
| AI       | OpenAI GPT-4o-mini            |

## Setup

```bash
# Install dependencies
npm install

# Create a .env file in the project root
echo "OPENAI_QUIZ_API_KEY=sk-your-key-here" > .env

# Start both Vite dev server and Express backend
npm run dev
```

The frontend runs on `http://localhost:5173` and the API on `http://localhost:8000`.

## Architecture

```
User ↔ React Chat Panel ↔ POST /api/chat ↔ GPT-4o-mini
                                ↓
                        JSON: {"update_field": "company_name", "value": "Acme"}
                                ↓
                       React Form State (auto-updated)
                                ↓
                       POST /api/applications → SQLite + Scoring Engine
                                ↓
                       Analysis { impactScore, revenuePercentile }
```

## Application Fields

| Field            | Type        | Required |
|------------------|-------------|----------|
| `company_name`   | Text        | ✅        |
| `mission`        | Text        | ✅        |
| `annual_revenue` | Numeric     | ✅        |
| `team_size`      | Numeric     | ❌        |
| `industry`       | Select      | ✅        |

**Industry options:** Tech, Healthcare, Education, Other

## Admin Dashboard

Navigate to `/admin` and log in with the configured password to view all submitted applications, summary statistics (average revenue, industry breakdown), and export data as CSV.
