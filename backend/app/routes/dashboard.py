from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models import AssessmentResult, Business
from app.schemas.assessment import AssessmentResponse, InsightsResponse

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/{business_id}", response_model=AssessmentResponse)
def get_dashboard(business_id: int, db: Session = Depends(get_db)):
    """Get latest assessment for dashboard view."""
    business = db.query(Business).filter(Business.id == business_id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    latest = (
        db.query(AssessmentResult)
        .filter(AssessmentResult.business_id == business_id)
        .order_by(AssessmentResult.created_at.desc())
        .first()
    )
    if not latest:
        raise HTTPException(
            status_code=404,
            detail="No assessment found. Run analyze first.",
        )

    return AssessmentResponse(
        id=latest.id,
        business_id=latest.business_id,
        period_start=latest.period_start,
        period_end=latest.period_end,
        health_score=latest.health_score,
        risk_level=latest.risk_level,
        score_breakdown=latest.metrics_json.get("score_breakdown", {
            "profitability": 0,
            "liquidity_proxy": 0,
            "leverage": 0,
            "cashflow_quality": 0,
            "data_quality": 0
        }),
        top_positive_factors=latest.metrics_json.get("top_positive_factors", []),
        top_negative_factors=latest.metrics_json.get("top_negative_factors", []),
        metrics_json=latest.metrics_json or {},
        risk_flags=latest.risk_flags or [],
        created_at=latest.created_at,
    )


@router.get("/{business_id}/insights", response_model=InsightsResponse)
def get_dashboard_insights(business_id: int, db: Session = Depends(get_db)):
    """Get latest insights for dashboard view."""
    business = db.query(Business).filter(Business.id == business_id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    latest = (
        db.query(AssessmentResult)
        .filter(AssessmentResult.business_id == business_id)
        .order_by(AssessmentResult.created_at.desc())
        .first()
    )
    if not latest:
        raise HTTPException(
            status_code=404,
            detail="No assessment found. Run analyze first.",
        )

    return InsightsResponse(
        business_id=business_id,
        insights_text=latest.insights_text or "No insights available yet.",
        lang=business.language or "en",
    )
