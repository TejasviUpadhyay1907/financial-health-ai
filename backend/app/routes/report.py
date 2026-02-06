"""
PDF report generation endpoints.
Provides investor-ready PDF reports for business financial assessments.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional
from app.db.database import get_db
from app.services.report_pdf import build_pdf_report
from app.models.business import Business
from app.models.assessment_result import AssessmentResult


router = APIRouter(prefix="/report", tags=["report"])


@router.get("/{business_id}.pdf")
def get_pdf_report(
    business_id: int,
    lang: str = Query(default="en", regex="^(en|hi)$", description="Language for insights (en or hi)"),
    db: Session = Depends(get_db)
):
    """
    Generate and download a PDF report for a business's latest assessment.
    
    The PDF includes:
    - Business information and health score
    - Key financial metrics table
    - Risk analysis and flags
    - AI-powered insights and recommendations
    - Generation timestamp and disclaimer
    
    Args:
        business_id: Business ID to generate report for
        lang: Language for insights content ('en' or 'hi')
        db: Database session
        
    Returns:
        PDF file as streaming response
    """
    try:
        # Generate PDF report
        pdf_buffer = build_pdf_report(db, business_id, lang)
        
        # Create filename
        business = db.query(Business).filter(Business.id == business_id).first()
        if business:
            filename = f"financial_health_report_{business.name.replace(' ', '_').lower()}_{business_id}.pdf"
        else:
            filename = f"financial_health_report_{business_id}.pdf"
        
        # Return PDF as streaming response
        return StreamingResponse(
            iter([pdf_buffer.getvalue()]),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
    
    except ValueError as e:
        # Handle business not found or no assessment
        raise HTTPException(status_code=404, detail=str(e))
    
    except Exception as e:
        # Handle unexpected errors
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate PDF report: {str(e)}"
        )


@router.get("/{business_id}/info")
def get_report_info(
    business_id: int,
    db: Session = Depends(get_db)
):
    """
    Get information about available report data.
    
    Returns metadata about the assessment data available for a business,
    helping clients understand what will be included in the PDF report.
    
    Args:
        business_id: Business ID to check
        db: Database session
        
    Returns:
        Information about available assessment data
    """
    try:
        # Check if business exists
        business = db.query(Business).filter(Business.id == business_id).first()
        if not business:
            raise HTTPException(status_code=404, detail=f"Business {business_id} not found")
        
        # Get latest assessment
        latest_assessment = db.query(AssessmentResult).filter(
            AssessmentResult.business_id == business_id
        ).order_by(AssessmentResult.created_at.desc()).first()
        
        if not latest_assessment:
            return {
                'business_id': business_id,
                'business_name': business.name,
                'has_assessment': False,
                'message': 'No assessment found. Run analysis first.'
            }
        
        # Prepare assessment info
        metrics = latest_assessment.metrics_json or {}
        risk_flags = latest_assessment.risk_flags or []
        
        return {
            'business_id': business_id,
            'business_name': business.name,
            'industry': business.industry,
            'language': business.language,
            'has_assessment': True,
            'assessment_date': latest_assessment.created_at.isoformat(),
            'health_score': latest_assessment.health_score,
            'risk_level': latest_assessment.risk_level,
            'has_insights': bool(latest_assessment.insights_text),
            'metrics_count': len(metrics),
            'risk_flags_count': len(risk_flags),
            'period': {
                'start': latest_assessment.period_start.isoformat() if latest_assessment.period_start else None,
                'end': latest_assessment.period_end.isoformat() if latest_assessment.period_end else None
            }
        }
    
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    
    except Exception as e:
        # Handle unexpected errors
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get report info: {str(e)}"
        )
