"""
Forecasting API endpoints.
Provides deterministic financial forecasts using linear trend or moving average methods.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.db.database import get_db
from app.services.forecasting import generate_forecast


# Response models
class ForecastData(BaseModel):
    month: str
    revenue: float
    operating_expense: float
    profit_proxy: float


class ForecastResponse(BaseModel):
    business_id: int
    horizon: int
    history: List[ForecastData]
    forecast: List[ForecastData]
    method: str
    notes: List[str]


router = APIRouter(prefix="/forecast", tags=["forecast"])


@router.post("/{business_id}", response_model=ForecastResponse)
def create_forecast(
    business_id: int,
    horizon: int = Query(default=3, ge=1, le=12, description="Number of months to forecast"),
    db: Session = Depends(get_db)
):
    """
    Generate financial forecast for a business.
    
    Uses deterministic methods:
    - Linear trend (least squares) if >= 6 months data available
    - Moving average of last 3 months if < 6 months data
    
    Args:
        business_id: Business ID to forecast for
        horizon: Number of months to forecast (1-12)
        db: Database session
        
    Returns:
        Forecast data with historical values and future predictions
    """
    try:
        forecast_result = generate_forecast(db, business_id, horizon)
        return forecast_result
    
    except ValueError as e:
        # Handle validation errors
        raise HTTPException(status_code=400, detail=str(e))
    
    except Exception as e:
        # Handle unexpected errors
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate forecast: {str(e)}"
        )


@router.get("/{business_id}/info", response_model=Dict[str, Any])
def get_forecast_info(
    business_id: int,
    db: Session = Depends(get_db)
):
    """
    Get information about available data for forecasting.
    
    Returns metadata about the historical data available for a business,
    helping clients understand what forecasting method will be used.
    
    Args:
        business_id: Business ID to check
        db: Database session
        
    Returns:
        Information about available data and recommended method
    """
    try:
        from app.services.forecasting import get_monthly_financials
        
        # Load data to check availability
        df = get_monthly_financials(db, business_id)
        
        # Determine method based on data length
        data_length = len(df)
        if data_length >= 6:
            recommended_method = "linear_trend"
            method_description = "Linear trend using least squares regression"
        elif data_length >= 3:
            recommended_method = "moving_average"
            method_description = "Moving average of last 3 months"
        else:
            recommended_method = "insufficient_data"
            method_description = "Need at least 3 months of data"
        
        # Get date range
        if data_length > 0:
            start_date = df['month'].min().strftime('%Y-%m-%d')
            end_date = df['month'].max().strftime('%Y-%m-%d')
        else:
            start_date = None
            end_date = None
        
        return {
            'business_id': business_id,
            'data_points': data_length,
            'date_range': {
                'start': start_date,
                'end': end_date
            },
            'recommended_method': recommended_method,
            'method_description': method_description,
            'can_forecast': data_length >= 3,
            'max_horizon': 12
        }
    
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get forecast info: {str(e)}"
        )
