from datetime import datetime
from pydantic import BaseModel


class UploadResponse(BaseModel):
    id: int
    business_id: int
    file_name: str
    file_type: str
    uploaded_at: datetime
    rows_imported: int

    class Config:
        from_attributes = True
