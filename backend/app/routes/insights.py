from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import AssessmentResult, Business
from app.schemas.assessment import InsightsResponse
from app.services.insights import generate_insights

router = APIRouter(prefix="/insights", tags=["insights"])


@router.post("/{business_id}", response_model=InsightsResponse)
def get_insights(
    business_id: int,
    lang: str = Query("en", description="Language: en or hi"),
    db: Session = Depends(get_db),
):
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
            status_code=400,
            detail="No assessment found. Run analyze first.",
        )

    metrics_json = latest.metrics_json or {}
    risk_flags = latest.risk_flags or []
    health_score = latest.health_score
    risk_level = latest.risk_level

    insights_text = generate_insights(
        metrics_json=metrics_json,
        risk_flags=risk_flags,
        health_score=health_score,
        risk_level=risk_level,
        lang=lang.strip().lower()[:2],
    )

    latest.insights_text = insights_text
    db.commit()

    return InsightsResponse(
        business_id=business_id,
        insights_text=insights_text,
        lang=lang,
    )
