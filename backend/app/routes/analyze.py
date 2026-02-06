from datetime import date

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models import AssessmentResult, Business, MonthlyFinancial
from app.schemas.assessment import AssessmentResponse, ScoreBreakdown
from app.services.analyzer import (
    compute_health_score,
    compute_metrics_and_risk,
    compute_sub_scores,
    get_risk_level,
)

router = APIRouter(prefix="/analyze", tags=["analyze"])


@router.post("/{business_id}", response_model=AssessmentResponse)
def analyze_business(business_id: int, db: Session = Depends(get_db)):
    business = db.query(Business).filter(Business.id == business_id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    rows = (
        db.query(MonthlyFinancial)
        .filter(MonthlyFinancial.business_id == business_id)
        .order_by(MonthlyFinancial.month)
        .all()
    )
    if not rows:
        raise HTTPException(
            status_code=400,
            detail="No financial data. Upload a CSV or XLSX first.",
        )
    if len(rows) < 2:
        raise HTTPException(
            status_code=400,
            detail="At least 2 months of data required for analysis.",
        )

    df = pd.DataFrame(
        [
            {
                "month": r.month,
                "revenue": float(r.revenue or 0),
                "cogs": float(r.cogs or 0),
                "operating_expense": float(r.operating_expense or 0),
                "ar": float(r.ar or 0),
                "ap": float(r.ap or 0),
                "inventory": float(r.inventory or 0),
                "loan_emi": float(r.loan_emi or 0),
            }
            for r in rows
        ]
    )
    df["month"] = pd.to_datetime(df["month"])

    data_quality_flags = []  # From upload we don't persist flags; use from metrics after first run or leave empty
    metrics, risk_flags, top_positive, top_negative = compute_metrics_and_risk(
        df, data_quality_flags
    )
    # If we had stored data_quality_flags in metrics from upload, use them
    data_quality_flags = metrics.get("data_quality_flags", [])

    breakdown = compute_sub_scores(metrics, risk_flags, data_quality_flags)
    health_score = compute_health_score(breakdown)
    risk_level = get_risk_level(health_score, risk_flags)

    period_start = date.fromisoformat(str(metrics.get("period_start", df["month"].min().date())))
    period_end = date.fromisoformat(str(metrics.get("period_end", df["month"].max().date())))

    result = AssessmentResult(
        business_id=business_id,
        period_start=period_start,
        period_end=period_end,
        health_score=health_score,
        risk_level=risk_level,
        metrics_json=metrics,
        risk_flags=risk_flags,
        insights_text=None,
    )
    db.add(result)
    db.commit()
    db.refresh(result)

    return AssessmentResponse(
        id=result.id,
        business_id=result.business_id,
        period_start=result.period_start,
        period_end=result.period_end,
        health_score=result.health_score,
        risk_level=result.risk_level,
        score_breakdown=breakdown,
        top_positive_factors=top_positive,
        top_negative_factors=top_negative,
        metrics_json=result.metrics_json or {},
        risk_flags=result.risk_flags or [],
        created_at=result.created_at,
    )
