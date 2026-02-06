"""
Deterministic forecasting service for financial data.
Uses simple, explainable methods: linear trend or moving average.
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional
from sqlalchemy.orm import Session
from app.models.monthly_financial import MonthlyFinancial


def linear_trend_forecast(series: pd.Series, horizon: int) -> List[float]:
    """
    Calculate linear trend forecast using least squares regression.
    
    Args:
        series: Historical values as pandas Series
        horizon: Number of periods to forecast
        
    Returns:
        List of forecasted values
    """
    if len(series) < 2:
        raise ValueError("Need at least 2 data points for linear trend")
    
    # Create x values (0, 1, 2, ...) for regression
    x = np.arange(len(series))
    y = series.values
    
    # Calculate linear regression coefficients (least squares)
    # y = mx + b
    n = len(x)
    x_mean = np.mean(x)
    y_mean = np.mean(y)
    
    # Calculate slope (m) and intercept (b)
    numerator = np.sum((x - x_mean) * (y - y_mean))
    denominator = np.sum((x - x_mean) ** 2)
    
    if denominator == 0:
        # All x values are the same, use mean
        slope = 0
    else:
        slope = numerator / denominator
    
    intercept = y_mean - slope * x_mean
    
    # Generate forecast for next horizon periods
    forecast = []
    for i in range(1, horizon + 1):
        next_x = len(series) + i - 1
        next_y = slope * next_x + intercept
        forecast.append(float(next_y))
    
    return forecast


def moving_average_forecast(series: pd.Series, horizon: int, window: int = 3) -> List[float]:
    """
    Calculate moving average forecast.
    
    Args:
        series: Historical values as pandas Series
        horizon: Number of periods to forecast
        window: Window size for moving average (default: 3)
        
    Returns:
        List of forecasted values
    """
    if len(series) < window:
        raise ValueError(f"Need at least {window} data points for moving average")
    
    # Calculate moving average of last 'window' periods
    recent_values = series.tail(window)
    avg_value = recent_values.mean()
    
    # Forecast uses the same average value for all future periods
    forecast = [float(avg_value)] * horizon
    return forecast


def get_monthly_financials(db: Session, business_id: int) -> pd.DataFrame:
    """
    Load monthly financial data for a business from database.
    
    Args:
        db: Database session
        business_id: Business ID to fetch data for
        
    Returns:
        DataFrame with monthly financial data sorted by month
    """
    # Query monthly financials
    records = db.query(MonthlyFinancial).filter(
        MonthlyFinancial.business_id == business_id
    ).order_by(MonthlyFinancial.month).all()
    
    if not records:
        raise ValueError(f"No financial data found for business {business_id}")
    
    # Convert to DataFrame
    data = []
    for record in records:
        data.append({
            'month': record.month,
            'revenue': float(record.revenue or 0),
            'operating_expense': float(record.operating_expense or 0),
            'cogs': float(record.cogs or 0)
        })
    
    df = pd.DataFrame(data)
    
    # Calculate profit_proxy
    df['profit_proxy'] = df['revenue'] - df['cogs'] - df['operating_expense']
    
    return df


def generate_forecast(db: Session, business_id: int, horizon: int = 3) -> Dict:
    """
    Generate forecast for a business using deterministic methods.
    
    Args:
        db: Database session
        business_id: Business ID to forecast for
        horizon: Number of months to forecast (default: 3)
        
    Returns:
        Dictionary containing forecast data and metadata
    """
    # Validate horizon
    if horizon < 1 or horizon > 12:
        raise ValueError("Horizon must be between 1 and 12 months")
    
    # Load historical data
    df = get_monthly_financials(db, business_id)
    
    # Check minimum data requirements
    if len(df) < 3:
        raise ValueError("Need at least 3 months of historical data for forecasting")
    
    # Determine forecasting method
    if len(df) >= 6:
        method = "linear_trend"
        use_linear_trend = True
    else:
        method = "moving_average"
        use_linear_trend = False
    
    # Prepare historical data for response
    history = []
    for _, row in df.iterrows():
        history.append({
            'month': row['month'].strftime('%Y-%m-%d'),
            'revenue': round(row['revenue'], 2),
            'operating_expense': round(row['operating_expense'], 2),
            'profit_proxy': round(row['profit_proxy'], 2)
        })
    
    # Generate forecasts for each metric
    metrics_to_forecast = ['revenue', 'operating_expense', 'profit_proxy']
    forecasts = {}
    
    for metric in metrics_to_forecast:
        series = df[metric]
        
        if use_linear_trend:
            try:
                forecast_values = linear_trend_forecast(series, horizon)
            except ValueError:
                # Fallback to moving average if linear trend fails
                forecast_values = moving_average_forecast(series, horizon)
                method = "moving_average"
        else:
            forecast_values = moving_average_forecast(series, horizon)
        
        forecasts[metric] = forecast_values
    
    # Generate forecast dates (next 'horizon' months)
    last_month = df['month'].iloc[-1]
    forecast_dates = []
    for i in range(1, horizon + 1):
        next_month = last_month + timedelta(days=32 * i)  # Approximate month
        # Adjust to first day of month
        next_month = next_month.replace(day=1)
        forecast_dates.append(next_month)
    
    # Prepare forecast data for response
    forecast = []
    for i, date in enumerate(forecast_dates):
        forecast.append({
            'month': date.strftime('%Y-%m-%d'),
            'revenue': round(forecasts['revenue'][i], 2),
            'operating_expense': round(forecasts['operating_expense'][i], 2),
            'profit_proxy': round(forecasts['profit_proxy'][i], 2)
        })
    
    # Generate explanatory notes
    notes = [
        f"Forecast is baseline and explainable using {method.replace('_', ' ')}",
        f"Based on {len(df)} months of historical data",
        "Forecast does not account for external factors or seasonality",
        "Actual results may vary significantly from forecast"
    ]
    
    if use_linear_trend:
        notes.append("Linear trend identifies the direction and rate of change")
    else:
        notes.append("Moving average smooths out short-term fluctuations")
    
    return {
        'business_id': business_id,
        'horizon': horizon,
        'history': history,
        'forecast': forecast,
        'method': method,
        'notes': notes
    }
