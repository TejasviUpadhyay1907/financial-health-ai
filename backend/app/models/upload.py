from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from app.models.base import Base


class Upload(Base):
    __tablename__ = "uploads"

    id = Column(Integer, primary_key=True, autoincrement=True)
    business_id = Column(Integer, ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)
    uploaded_at = Column(DateTime(timezone=True), default=datetime.utcnow)
