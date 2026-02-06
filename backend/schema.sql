-- Financial Health Assessment Tool - PostgreSQL Schema
-- Run this against your database before starting the app (e.g. Supabase SQL editor).

CREATE TABLE IF NOT EXISTS businesses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS uploads (
    id SERIAL PRIMARY KEY,
    business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS monthly_financials (
    id SERIAL PRIMARY KEY,
    business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    month DATE NOT NULL,
    revenue NUMERIC(18, 2) DEFAULT 0,
    cogs NUMERIC(18, 2) DEFAULT 0,
    operating_expense NUMERIC(18, 2) DEFAULT 0,
    ar NUMERIC(18, 2) DEFAULT 0,
    ap NUMERIC(18, 2) DEFAULT 0,
    inventory NUMERIC(18, 2) DEFAULT 0,
    loan_emi NUMERIC(18, 2) DEFAULT 0,
    UNIQUE(business_id, month)
);

CREATE TABLE IF NOT EXISTS assessment_results (
    id SERIAL PRIMARY KEY,
    business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    health_score INTEGER NOT NULL CHECK (health_score >= 0 AND health_score <= 100),
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('Low', 'Medium', 'High')),
    metrics_json JSONB NOT NULL DEFAULT '{}',
    risk_flags JSONB NOT NULL DEFAULT '[]',
    insights_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_uploads_business_id ON uploads(business_id);
CREATE INDEX IF NOT EXISTS idx_monthly_financials_business_id ON monthly_financials(business_id);
CREATE INDEX IF NOT EXISTS idx_monthly_financials_month ON monthly_financials(month);
CREATE INDEX IF NOT EXISTS idx_assessment_results_business_id ON assessment_results(business_id);
CREATE INDEX IF NOT EXISTS idx_assessment_results_created_at ON assessment_results(business_id, created_at DESC);
