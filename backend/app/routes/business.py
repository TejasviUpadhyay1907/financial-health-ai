from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models import Business
from app.schemas.business import BusinessCreate, BusinessResponse

router = APIRouter(prefix="/business", tags=["business"])


@router.post("", response_model=BusinessResponse)
def create_business(payload: BusinessCreate, db: Session = Depends(get_db)):
    business = Business(
        name=payload.name,
        industry=payload.industry,
        language=payload.language or "en",
    )
    db.add(business)
    db.commit()
    db.refresh(business)
    return business
