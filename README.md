# Big Green Tent — Environmental Nonprofit Discovery & Vetting

Big Green Tent is a sophisticated platform designed to help institutional donors and environmental advocates discover, evaluate, and manage a shortlist of high-impact environmental nonprofits. By combining real-time data from ProPublica with AI-driven insights (Ollama & OpenAI), the platform provides a rigorous framework for environmental due diligence.

## Key Features

- **Advanced Discovery Interface** — Filter nonprofits across a curated taxonomy of 14 environmental sectors (e.g., Climate Change & Adaptation, Industrial Ecology, Wildlife & Biodiversity).
- **Dynamic Weighted Scoring** — A custom-built engine calculates a Match Score based on 7 distinct impact parameters:
  - Program Efficiency, Revenue Growth, Sustainability, Scale, Grant Distribution, Geographic Reach, and Innovation Output.
- **Explainable AI (XAI)** — Uses OpenAI (GPT-4o-mini) to generate natural language explanations for *why* an organization matches the user's specific priorities.
- **AI-Enriched Deep Analysis** — Integrates a local **Ollama** pipeline (`llama3`) to analyze mission statements and generate "AI Insights" that highlight strategic strengths and potential risks.
- **Shortlist & Outreach Workflow** — Approve vetted organizations to a dedicated shortlist to manage communication and track engagement status.
- **Human Evaluation Checklist** — Embedded due diligence checks to ensure AI insights are cross-referenced with field reports and financial audits.

## Tech Stack

| Layer          | Technology                                   |
|----------------|----------------------------------------------|
| **Frontend**   | React 19, Vite, Tailwind CSS, Framer Motion  |
| **Backend**    | Node.js, Express                             |
| **Data ETL**   | Python 3 (Requests, SQLite)                  |
| **Database**   | SQLite (better-sqlite3)                      |
| **AI (Cloud)** | OpenAI GPT-4o-mini                           |
| **AI (Local)** | Ollama (Llama 3)                             |

## Project Structure

```text
├── data-pipeline/      # Python ETL scripts for data ingestion and AI enrichment
├── server/             # Express API, SQLite database, and scoring logic
├── src/                # React application (Pages, Components, Assets)
└── dist/               # Production build output
```

## Setup & Execution

### 1. Prerequisites
- **Node.js** (v18+)
- **Python 3** (for data ingestion)
- **Ollama** (running locally with `llama3` model)

### 2. Installation
```bash
# Install frontend and backend dependencies
npm install

# Setup environment variables
echo "OPENAI_QUIZ_API_KEY=your-key-here" > .env
```

### 3. Data Ingestion (Grand Reset)
To populate the platform with AI-enriched data:
```bash
cd data-pipeline
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python ingest_ollama.py
```

### 4. Running the App
```bash
# In the root directory
npm run dev
```
- **Discovery Portal**: `http://localhost:5173/`
- **Outreach Dashboard**: `http://localhost:5173/admin`

## Development Workflow
Big Green Tent uses a **Grand Reset** architecture for development. To apply major schema changes:
1. Update `server/schema.sql`.
2. Delete `server/big_green_tent.db`.
3. Restart the server.
4. Re-run the `data-pipeline/ingest_ollama.py` script to repopulate data.

## Temporary Deployment
If you want to share the current prototype before it is finished, the simplest path is to deploy it as a single Node web service. The Express server already serves the built Vite app from `dist/`.

### Recommended Setup
- Host type: Node web service
- Build command: `npm install && npm run build`
- Start command: `npm start`
- Health check path: `/healthz`

### Environment Variables
- `OPENAI_QUIZ_API_KEY`
  - Optional for a review build, but required if you want the AI explanation endpoint to work.
- `PORT`
  - Usually set automatically by the host.
- `DATABASE_PATH`
  - Optional override for where the SQLite file should live in production.

### Render Example
Render’s web service docs say your app must bind to `0.0.0.0` on the platform-provided port, and that you can configure build/start commands, environment variables, health checks, and an optional persistent disk in the dashboard:
- https://render.com/docs/web-services

Suggested Render settings:
- Service type: `Web Service`
- Environment: `Node`
- Branch: your working branch or `main`
- Build Command: `npm install && npm run build`
- Start Command: `npm start`
- Health Check Path: `/healthz`

Important note for this repo:
- The app uses SQLite. If you only need a temporary review deployment, the checked-in database can be enough to demo the app.
- If you want shortlist changes to persist across deploys/restarts, use a persistent disk on your host and point `DATABASE_PATH` at that mounted location.
