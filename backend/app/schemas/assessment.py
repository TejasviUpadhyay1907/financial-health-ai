from datetime import date, datetime
from pydantic import BaseModel, Field


class ScoreBreakdown(BaseModel):
    """Explainable sub-scores (each 0–100)."""
    profitability: float = Field(..., ge=0, le=100)
    liquidity_proxy: float = Field(..., ge=0, le=100)
    leverage: float = Field(..., ge=0, le=100)
    cashflow_quality: float = Field(..., ge=0, le=100)
    data_quality: float = Field(..., ge=0, le=100)


class AssessmentResponse(BaseModel):
    id: int
    business_id: int
    period_start: date
    period_end: date
    health_score: int = Field(..., ge=0, le=100)
    risk_level: str  # Low | Medium | High
    score_breakdown: ScoreBreakdown
    top_positive_factors: list[str] = Field(default_factory=list)
    top_negative_factors: list[str] = Field(default_factory=list)
    metrics_json: dict = Field(default_factory=dict)
    risk_flags: list = Field(default_factory=list)
    created_at: datetime

    class Config:
        from_attributes = True


class InsightsResponse(BaseModel):
    business_id: int
    insights_text: str
    lang: str = "en"
