from datetime import datetime
from pydantic import BaseModel, Field


class BusinessCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, alias="businessName")
    industry: str | None = Field(None, max_length=100)
    language: str = Field("en", max_length=10)

    class Config:
        populate_by_name = True


class BusinessResponse(BaseModel):
    id: int
    name: str
    industry: str | None
    language: str
    created_at: datetime

    class Config:
        from_attributes = True
