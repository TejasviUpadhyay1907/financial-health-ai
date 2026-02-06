# Financial Health Assessment Tool for SMEs

Hackathon-ready platform: ingest SME financial data, analyze deterministically (Python/pandas), store in PostgreSQL, and use **GPT-5 only** for narrative insights and multilingual output.

## Rules (non-negotiable)

- **AI does not calculate metrics or score** — all calculations are Python/pandas (deterministic).
- **AI does not invent numbers** — it only uses provided computed metrics and risk flags.
- Backend: FastAPI, pandas, PostgreSQL (JSONB for metrics), OpenAI GPT-5 (narrative layer only).

---

## Repo structure

```
Financial Health Assessment Tool/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── db/
│   │   │   ├── __init__.py
│   │   │   └── session.py
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── base.py
│   │   │   ├── business.py
│   │   │   ├── upload.py
│   │   │   ├── monthly_financial.py
│   │   │   └── assessment_result.py
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── business.py
│   │   │   ├── upload.py
│   │   │   └── assessment.py
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── health.py
│   │   │   ├── business.py
│   │   │   ├── upload.py
│   │   │   ├── analyze.py
│   │   │   └── insights.py
│   │   └── services/
│   │       ├── __init__.py
│   │       ├── parser.py
│   │       ├── analyzer.py
│   │       └── insights.py
│   ├── schema.sql
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   └── .gitkeep
├── sample-data/
│   └── sme_sample_12months.csv
└── README.md
```

---

## Backend: run locally

### 1. PostgreSQL

Create a database (local or Supabase). Example local:

```bash
# If using local Postgres (example)
createdb financial_health
```

Apply the schema:

```bash
psql -d financial_health -f backend/schema.sql
```

For Supabase: open SQL Editor, paste contents of `backend/schema.sql`, run.

### 2. Python env and dependencies

From the **project root** (or from `backend/`):

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
# source venv/bin/activate
pip install -r requirements.txt
```

### 3. Environment variables

```bash
cp .env.example .env
# Edit .env: set DATABASE_URL and optionally OPENAI_API_KEY, OPENAI_MODEL, ALLOWED_ORIGINS
```

Required for full flow:

- `DATABASE_URL` — PostgreSQL connection string (required).
- `OPENAI_API_KEY` — required for `/insights` (narrative). Leave blank to get a friendly “insights unavailable” message.

### 4. Start the API

From `backend/`:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API: `http://localhost:8000`. Docs: `http://localhost:8000/docs`.

---

## Backend: test end-to-end with curl

Base URL: `http://localhost:8000`.

### 1. Health

```bash
curl -s http://localhost:8000/health
```

### 2. Create business

```bash
curl -s -X POST http://localhost:8000/business \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"Demo SME\", \"industry\": \"Retail\", \"language\": \"en\"}"
```

Note the returned `id` (e.g. `1`). Use it as `BUSINESS_ID` below.

### 3. Upload financial file

```bash
curl -s -X POST http://localhost:8000/upload \
  -F "business_id=1" \
  -F "file=@sample-data/sme_sample_12months.csv"
```

Use your `BUSINESS_ID` and the path to the sample CSV (from project root: `sample-data/sme_sample_12months.csv`).

### 4. Analyze

```bash
curl -s -X POST http://localhost:8000/analyze/1
```

Replace `1` with your `BUSINESS_ID`. Response includes `health_score`, `risk_level`, `score_breakdown`, `metrics_json`, `risk_flags`, `top_positive_factors`, `top_negative_factors`.

### 5. Get insights (English)

```bash
curl -s -X POST "http://localhost:8000/insights/1?lang=en"
```

Replace `1` with your `BUSINESS_ID`. Requires `OPENAI_API_KEY` in `.env`.

### 6. Get insights (Hindi)

```bash
curl -s -X POST "http://localhost:8000/insights/1?lang=hi"
```

---

## Complete End-to-End Test

```bash
# 1. Create business
BUSINESS_ID=$(curl -s -X POST http://localhost:8000/business \
  -H "Content-Type: application/json" \
  -d '{"name": "Test SME", "industry": "Retail", "language": "en"}' | \
  jq -r '.id')

# 2. Upload file
curl -s -X POST http://localhost:8000/upload \
  -F "business_id=$BUSINESS_ID" \
  -F "file=@sample-data/sme_sample_12months.csv"

# 3. Analyze
curl -s -X POST http://localhost:8000/analyze/$BUSINESS_ID

# 4. Generate insights
curl -s -X POST "http://localhost:8000/insights/$BUSINESS_ID?lang=en"

# 5. Get dashboard
curl -s http://localhost:8000/dashboard/$BUSINESS_ID
```

---

## Environment variables (summary)

| Variable          | Required | Description                                      |
|-------------------|----------|--------------------------------------------------|
| `DATABASE_URL`    | Yes      | PostgreSQL URL (e.g. Supabase or local).          |
| `LLM_PROVIDER`    | No       | LLM provider: `mock` or `openai` (default: mock). |
| `OPENAI_API_KEY`  | For insights | OpenAI API key for narrative insights.      |
| `OPENAI_MODEL`    | No       | Model name (default `gpt-4o`; use `gpt-5` when available). |
| `ALLOWED_ORIGINS` | No       | Comma-separated CORS origins.                    |
| `ENV`             | No       | e.g. `development` / `production`.               |

---

## Deployment (Render / Railway + Supabase)

- **Database**: Create a Postgres project on Supabase; run `backend/schema.sql` in SQL Editor; use the connection string (with password) as `DATABASE_URL`.
- **Backend**: Create a Web Service on Render or Railway; root or build command: install deps from `backend/requirements.txt`, start with `uvicorn app.main:app --host 0.0.0.0 --port $PORT` (set working directory to `backend/`). Add env vars: `DATABASE_URL`, `LLM_PROVIDER`, `OPENAI_API_KEY`, and optionally `OPENAI_MODEL`, `ALLOWED_ORIGINS` (include your frontend URL).
- **Security**: Use HTTPS (Render/Railway provide it); keep secrets in env vars only; avoid storing raw sensitive data beyond what’s needed.

---

## Sample data

- `sample-data/sme_sample_12months.csv` — 12 months of revenue, COGS, operating expense, AR, AP, inventory, loan EMI. Column names match the canonical schema (month, revenue, cogs, etc.). Upload this to test the full flow.

Frontend is now implemented with React + Vite for complete user interface.

---

## Hackathon Submission Links

- Live deployed URL:
- GitHub repository link:
- Public demo video link (YouTube/Drive):
