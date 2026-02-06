"""
PDF report generation service for investor-ready financial health reports.
Uses ReportLab to create clean, professional PDFs from assessment data.
"""

from io import BytesIO
from datetime import datetime
from typing import Optional, Dict, Any
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, black, white
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.platypus.tableofcontents import TableOfContents
from sqlalchemy.orm import Session
from app.models.business import Business
from app.models.assessment_result import AssessmentResult
from app.services.insights import generate_insights


def get_health_score_color(score: int) -> HexColor:
    """Get color based on health score."""
    if score >= 80:
        return HexColor('#16a34a')  # green-600
    elif score >= 60:
        return HexColor('#84cc16')  # lime-600
    elif score >= 40:
        return HexColor('#f59e0b')  # amber-600
    else:
        return HexColor('#dc2626')  # red-600


def get_risk_level_color(risk_level: str) -> HexColor:
    """Get color based on risk level."""
    risk_level = risk_level.lower()
    if risk_level == 'low':
        return HexColor('#16a34a')  # green-600
    elif risk_level == 'medium':
        return HexColor('#f59e0b')  # amber-600
    elif risk_level == 'high':
        return HexColor('#dc2626')  # red-600
    else:
        return HexColor('#6b7280')  # gray-500


def create_health_score_section(score: int, risk_level: str) -> list:
    """Create health score and risk level section."""
    elements = []
    
    # Health Score
    score_color = get_health_score_color(score)
    risk_color = get_risk_level_color(risk_level)
    
    # Title
    elements.append(Paragraph("Financial Health Assessment", ParagraphStyle(
        'CustomTitle',
        parent=getSampleStyleSheet()['Title'],
        fontSize=24,
        spaceAfter=30,
        alignment=1  # center
    )))
    
    # Health Score Badge
    score_text = f"<font name='Helvetica-Bold' size={36} color='{score_color}'>{score}/100</font>"
    elements.append(Paragraph(score_text, ParagraphStyle(
        'ScoreStyle',
        parent=getSampleStyleSheet()['Normal'],
        fontSize=36,
        alignment=1,
        spaceAfter=10
    )))
    
    # Risk Level Badge
    risk_text = f"<font name='Helvetica-Bold' size={18} color='{risk_color}'>{risk_level.upper()} RISK</font>"
    elements.append(Paragraph(risk_text, ParagraphStyle(
        'RiskStyle',
        parent=getSampleStyleSheet()['Normal'],
        fontSize=18,
        alignment=1,
        spaceAfter=30
    )))
    
    return elements


def create_key_metrics_table(metrics: Dict[str, Any]) -> list:
    """Create key metrics table section."""
    elements = []
    
    elements.append(Paragraph("Key Financial Metrics", ParagraphStyle(
        'SectionTitle',
        parent=getSampleStyleSheet()['Heading2'],
        fontSize=16,
        spaceAfter=15,
        spaceBefore=20
    )))
    
    # Prepare metrics data for table
    metrics_data = [['Metric', 'Value']]
    
    # Top 6 key metrics
    key_metrics = [
        ('Total Revenue', metrics.get('revenue', 0)),
        ('Net Profit', metrics.get('profit_proxy', 0)),
        ('Net Margin (%)', metrics.get('net_margin_percent', 0)),
        ('EMI Burden (%)', metrics.get('emi_burden_percent', 0)),
        ('Revenue Trend (%)', metrics.get('revenue_trend_percent', 0)),
        ('Data Quality', metrics.get('data_quality_score', 0))
    ]
    
    for metric_name, value in key_metrics:
        if isinstance(value, (int, float)):
            if 'percent' in metric_name.lower():
                formatted_value = f"{value:.1f}%"
            else:
                formatted_value = f"${value:,.0f}"
        else:
            formatted_value = str(value)
        
        metrics_data.append([metric_name, formatted_value])
    
    # Create table
    table = Table(metrics_data, colWidths=[3*inch, 2*inch])
    table.setStyle(TableStyle([
        # Header styling
        ('BACKGROUND', (0, 0), (-1, 0), HexColor('#f3f4f6')),
        ('TEXTCOLOR', (0, 0), (-1, 0), black),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        
        # Data styling
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 11),
        ('ALIGN', (0, 1), (0, -1), 'LEFT'),  # Metric names left-aligned
        ('ALIGN', (1, 1), (1, -1), 'RIGHT'),  # Values right-aligned
        
        # Borders
        ('GRID', (0, 0), (-1, -1), 1, HexColor('#e5e7eb')),
        ('LINEBELOW', (0, 0), (-1, 0), 2, HexColor('#9ca3af')),
    ]))
    
    elements.append(table)
    elements.append(Spacer(1, 20))
    
    return elements


def create_risk_flags_section(risk_flags: list) -> list:
    """Create risk flags section."""
    elements = []
    
    elements.append(Paragraph("Risk Analysis", ParagraphStyle(
        'SectionTitle',
        parent=getSampleStyleSheet()['Heading2'],
        fontSize=16,
        spaceAfter=15,
        spaceBefore=20
    )))
    
    if not risk_flags:
        elements.append(Paragraph("No risk factors identified.", getSampleStyleSheet()['Normal']))
    else:
        for i, flag in enumerate(risk_flags, 1):
            flag_text = f"<font name='Helvetica-Bold' color='#dc2626'>Risk {i}:</font> {flag}"
            elements.append(Paragraph(flag_text, ParagraphStyle(
                'RiskFlag',
                parent=getSampleStyleSheet()['Normal'],
                fontSize=11,
                spaceAfter=8,
                leftIndent=20
            )))
    
    elements.append(Spacer(1, 20))
    return elements


def create_insights_section(insights_text: Optional[str]) -> list:
    """Create insights and recommendations section."""
    elements = []
    
    elements.append(Paragraph("AI-Powered Insights & Recommendations", ParagraphStyle(
        'SectionTitle',
        parent=getSampleStyleSheet()['Heading2'],
        fontSize=16,
        spaceAfter=15,
        spaceBefore=20
    )))
    
    if not insights_text:
        elements.append(Paragraph("Insights not generated yet.", getSampleStyleSheet()['Normal']))
    else:
        # Split insights into paragraphs and format
        paragraphs = insights_text.split('\n\n')
        for paragraph in paragraphs:
            if paragraph.strip():
                elements.append(Paragraph(paragraph.strip(), ParagraphStyle(
                    'InsightParagraph',
                    parent=getSampleStyleSheet()['Normal'],
                    fontSize=11,
                    spaceAfter=10,
                    leftIndent=20,
                    rightIndent=20
                )))
    
    elements.append(Spacer(1, 20))
    return elements


def create_footer_section(business_name: str, generated_at: datetime) -> list:
    """Create footer with timestamp and disclaimer."""
    elements = []
    
    # Generation timestamp
    timestamp_text = f"Generated on {generated_at.strftime('%B %d, %Y at %I:%M %p')}"
    elements.append(Paragraph(timestamp_text, ParagraphStyle(
        'Timestamp',
        parent=getSampleStyleSheet()['Normal'],
        fontSize=9,
        alignment=1,
        spaceAfter=10
    )))
    
    # Disclaimer
    disclaimer_text = (
        "<font name='Helvetica-Oblique' size=8>"
        "Disclaimer: This assessment is based on the provided financial data and should be considered "
        "along with other factors when making financial decisions. The recommendations provided are "
        "for informational purposes only and do not constitute financial advice."
        "</font>"
    )
    elements.append(Paragraph(disclaimer_text, ParagraphStyle(
        'Disclaimer',
        parent=getSampleStyleSheet()['Normal'],
        fontSize=8,
        alignment=1,
        spaceBefore=20
    )))
    
    return elements


def build_pdf_report(
    db: Session,
    business_id: int,
    lang: str = 'en'
) -> BytesIO:
    """
    Build a PDF report for a business's latest assessment.
    
    Args:
        db: Database session
        business_id: Business ID to generate report for
        lang: Language for insights ('en' or 'hi')
        
    Returns:
        BytesIO buffer containing the PDF data
    """
    # Fetch business and latest assessment
    business = db.query(Business).filter(Business.id == business_id).first()
    if not business:
        raise ValueError(f"Business {business_id} not found")
    
    latest_assessment = db.query(AssessmentResult).filter(
        AssessmentResult.business_id == business_id
    ).order_by(AssessmentResult.created_at.desc()).first()
    
    if not latest_assessment:
        raise ValueError(f"No assessment found for business {business_id}")
    
    # Get insights (generate if missing)
    insights_text = latest_assessment.insights_text
    if not insights_text:
        try:
            insights_result = generate_insights(db, business_id, lang)
            insights_text = insights_result.get('insights_text', 'Insights not available')
        except Exception:
            insights_text = 'Insights not generated yet'
    
    # Create PDF buffer
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=72
    )
    
    # Build PDF content
    story = []
    
    # Title and business info
    story.append(Paragraph(f"Financial Health Report", ParagraphStyle(
        'MainTitle',
        parent=getSampleStyleSheet()['Title'],
        fontSize=28,
        spaceAfter=10,
        alignment=1
    )))
    
    story.append(Paragraph(f"{business.name}", ParagraphStyle(
        'BusinessName',
        parent=getSampleStyleSheet()['Heading1'],
        fontSize=18,
        spaceAfter=5,
        alignment=1
    )))
    
    story.append(Paragraph(f"{business.industry} • {business.language}", ParagraphStyle(
        'BusinessInfo',
        parent=getSampleStyleSheet()['Normal'],
        fontSize=12,
        spaceAfter=20,
        alignment=1
    )))
    
    # Health Score Section
    story.extend(create_health_score_section(
        latest_assessment.health_score,
        latest_assessment.risk_level
    ))
    
    # Key Metrics Table
    metrics = latest_assessment.metrics_json or {}
    story.extend(create_key_metrics_table(metrics))
    
    # Risk Flags Section
    risk_flags = latest_assessment.risk_flags or []
    story.extend(create_risk_flags_section(risk_flags))
    
    # Insights Section
    story.extend(create_insights_section(insights_text))
    
    # Footer
    story.extend(create_footer_section(
        business.name,
        latest_assessment.created_at
    ))
    
    # Build PDF
    doc.build(story)
    
    # Reset buffer position
    buffer.seek(0)
    return buffer
