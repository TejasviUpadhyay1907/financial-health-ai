from sqlalchemy import Column, Integer, Date, Numeric, ForeignKey, UniqueConstraint
from app.models.base import Base


class MonthlyFinancial(Base):
    __tablename__ = "monthly_financials"
    __table_args__ = (UniqueConstraint("business_id", "month", name="uq_business_month"),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    business_id = Column(Integer, ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False)
    month = Column(Date, nullable=False)
    revenue = Column(Numeric(18, 2), default=0)
    cogs = Column(Numeric(18, 2), default=0)
    operating_expense = Column(Numeric(18, 2), default=0)
    ar = Column(Numeric(18, 2), default=0)
    ap = Column(Numeric(18, 2), default=0)
    inventory = Column(Numeric(18, 2), default=0)
    loan_emi = Column(Numeric(18, 2), default=0)
