from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models import Business, MonthlyFinancial, Upload
from app.schemas.upload import UploadResponse
from app.services.parser import parse_upload

router = APIRouter(prefix="/upload", tags=["upload"])


@router.post("", response_model=UploadResponse)
def upload_file(
    business_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    # Validate business exists
    business = db.query(Business).filter(Business.id == business_id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    if not file.filename:
        raise HTTPException(status_code=400, detail="No file name")

    content = file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty file")

    try:
        df, data_quality_flags = parse_upload(content, file.filename)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    file_type = "csv" if (file.filename or "").lower().endswith(".csv") else "xlsx"
    upload_record = Upload(
        business_id=business_id,
        file_name=file.filename or "upload",
        file_type=file_type,
    )
    db.add(upload_record)
    db.commit()
    db.refresh(upload_record)

    rows_imported = 0
    for _, row in df.iterrows():
        month_val = row["month"]
        if hasattr(month_val, "date"):
            month_val = month_val.date()
        existing = (
            db.query(MonthlyFinancial)
            .filter(
                MonthlyFinancial.business_id == business_id,
                MonthlyFinancial.month == month_val,
            )
            .first()
        )
        if existing:
            existing.revenue = row["revenue"]
            existing.cogs = row["cogs"]
            existing.operating_expense = row["operating_expense"]
            existing.ar = row["ar"]
            existing.ap = row["ap"]
            existing.inventory = row["inventory"]
            existing.loan_emi = row["loan_emi"]
        else:
            mf = MonthlyFinancial(
                business_id=business_id,
                month=month_val,
                revenue=row["revenue"],
                cogs=row["cogs"],
                operating_expense=row["operating_expense"],
                ar=row["ar"],
                ap=row["ap"],
                inventory=row["inventory"],
                loan_emi=row["loan_emi"],
            )
            db.add(mf)
        rows_imported += 1
    db.commit()

    return UploadResponse(
        id=upload_record.id,
        business_id=upload_record.business_id,
        file_name=upload_record.file_name,
        file_type=upload_record.file_type,
        uploaded_at=upload_record.uploaded_at,
        rows_imported=rows_imported,
    )
