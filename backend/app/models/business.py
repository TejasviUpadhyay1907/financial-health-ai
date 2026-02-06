from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime

from app.models.base import Base


class Business(Base):
    __tablename__ = "businesses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    industry = Column(String(100))
    language = Column(String(10), default="en")
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
