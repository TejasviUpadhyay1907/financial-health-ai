import traceback
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.routes import health, business, upload, analyze, insights, dashboard, forecast, report
from app.db.database import Base, engine
from app.models import *

app = FastAPI(
    title="Financial Health Assessment API",
    description="SME financial data ingestion, deterministic analysis, and GPT-5 narrative insights.",
    version="1.0.0",
)
Base.metadata.create_all(bind=engine)

settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.ALLOWED_ORIGINS if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(business.router)
app.include_router(upload.router)
app.include_router(analyze.router)
app.include_router(insights.router)
app.include_router(dashboard.router)
app.include_router(forecast.router)
app.include_router(report.router)


@app.exception_handler(Exception)
def generic_exception_handler(request: Request, exc: Exception):
    print("\n🔥 INTERNAL SERVER ERROR:")
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},  # show real error for debugging
    )




