from datetime import datetime
from sqlalchemy import Column, Integer, Date, String, Text, DateTime, ForeignKey, JSON
from app.models.base import Base


class AssessmentResult(Base):
    __tablename__ = "assessment_results"

    id = Column(Integer, primary_key=True, autoincrement=True)
    business_id = Column(Integer, ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False)
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    health_score = Column(Integer, nullable=False)
    risk_level = Column(String(20), nullable=False)
    metrics_json = Column(JSON, nullable=False, default=dict)
    risk_flags = Column(JSON, nullable=False, default=list)
    insights_text = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
