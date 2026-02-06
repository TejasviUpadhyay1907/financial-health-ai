# Financial Health Assessment Backend

FastAPI backend for SME financial health assessment with deterministic analysis and AI-powered insights.

## Features

- **Financial Data Ingestion**: CSV/XLSX file upload and processing
- **Deterministic Analysis**: Rule-based financial health scoring
- **AI Insights**: GPT-5 powered narrative insights (mock mode available)
- **Forecasting**: Deterministic financial forecasts using linear trend or moving average
- **PDF Reports**: Investor-ready PDF report generation
- **Multi-language**: English and Hindi support

## Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations (if using PostgreSQL)
# See schema.sql for database structure

# Start server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/financial_health

# AI/LLM (optional - defaults to mock mode)
LLM_PROVIDER=mock
OPENAI_API_KEY=your_key_here

# CORS
ALLOWED_ORIGINS=http://localhost:5173,https://yourdomain.com
```

## API Endpoints

### Core Endpoints

#### Health Check
```bash
GET /health
```

#### Business Management
```bash
# Create business
POST /business
Content-Type: application/json

{
  "name": "My Business",
  "industry": "Manufacturing",
  "language": "en"
}

# Get business
GET /business/{business_id}
```

#### File Upload
```bash
POST /upload
Content-Type: multipart/form-data

file: [CSV/XLSX file]
business_id: 1
```

#### Analysis
```bash
POST /analyze/{business_id}
```

#### Insights
```bash
# Generate insights
POST /insights/{business_id}?lang=en|hi

# Get existing insights
GET /insights/{business_id}
```

#### Dashboard
```bash
GET /dashboard/{business_id}
```

### NEW: Forecasting Endpoints

#### Generate Forecast
```bash
POST /forecast/{business_id}?horizon=3

# Response:
{
  "business_id": 1,
  "horizon": 3,
  "history": [
    {
      "month": "2024-01-01",
      "revenue": 100000.00,
      "operating_expense": 80000.00,
      "profit_proxy": 15000.00
    }
  ],
  "forecast": [
    {
      "month": "2024-04-01",
      "revenue": 105000.00,
      "operating_expense": 82000.00,
      "profit_proxy": 16000.00
    }
  ],
  "method": "linear_trend",
  "notes": [
    "Forecast is baseline and explainable using linear trend",
    "Based on 6 months of historical data",
    "Forecast does not account for external factors or seasonality",
    "Actual results may vary significantly from forecast",
    "Linear trend identifies direction and rate of change"
  ]
}
```

#### Get Forecast Info
```bash
GET /forecast/{business_id}/info

# Response:
{
  "business_id": 1,
  "data_points": 8,
  "date_range": {
    "start": "2023-08-01",
    "end": "2024-03-01"
  },
  "recommended_method": "linear_trend",
  "method_description": "Linear trend using least squares regression",
  "can_forecast": true,
  "max_horizon": 12
}
```

### NEW: PDF Report Endpoints

#### Generate PDF Report
```bash
GET /report/{business_id}.pdf?lang=en

# Returns: PDF file as download
# Content-Type: application/pdf
# Content-Disposition: attachment; filename=financial_health_report_business_name_1.pdf
```

#### Get Report Info
```bash
GET /report/{business_id}/info

# Response:
{
  "business_id": 1,
  "business_name": "My Business",
  "industry": "Manufacturing",
  "language": "en",
  "has_assessment": true,
  "assessment_date": "2024-03-15T10:30:00Z",
  "health_score": 75,
  "risk_level": "medium",
  "has_insights": true,
  "metrics_count": 12,
  "risk_flags_count": 2,
  "period": {
    "start": "2023-08-01",
    "end": "2024-03-01"
  }
}
```

## Testing

### Quick Test Script

Run the included test script to verify new endpoints:

```bash
python test_new_endpoints.py
```

This will test:
- Forecast endpoint with sample business data
- PDF report generation
- Info endpoints for both features

### Manual Testing with curl

```bash
# Test forecasting (requires business with at least 3 months of data)
curl -X POST "http://localhost:8000/forecast/1?horizon=3" \
  -H "Content-Type: application/json"

# Test forecast info
curl -X GET "http://localhost:8000/forecast/1/info"

# Test PDF report (requires completed assessment)
curl -X GET "http://localhost:8000/report/1.pdf?lang=en" \
  --output report.pdf

# Test report info
curl -X GET "http://localhost:8000/report/1/info"
```

## Forecasting Method

The forecasting service uses deterministic methods:

1. **Linear Trend** (≥ 6 months data):
   - Least squares regression on historical values
   - Captures trend direction and rate of change
   - More accurate for businesses with clear trends

2. **Moving Average** (< 6 months data):
   - Simple average of last 3 months
   - Smooths out short-term fluctuations
   - Conservative approach for limited data

Both methods are:
- **Deterministic**: Same input always produces same output
- **Explainable**: Clear mathematical basis
- **Transparent**: Method and assumptions disclosed

## PDF Report Features

Generated PDFs include:

- **Professional Layout**: Clean, investor-ready formatting
- **Health Score**: Visual score with risk level badge
- **Key Metrics**: Table of important financial indicators
- **Risk Analysis**: List of identified risk factors
- **AI Insights**: Narrative recommendations (if available)
- **Multi-language**: English or Hindi content
- **Disclaimer**: Legal and usage information

## Database Schema

See `schema.sql` for complete database structure.

Key tables:
- `businesses`: Business information
- `uploads`: File upload records
- `monthly_financials`: Monthly financial data
- `assessment_results`: Analysis results and metrics

## Error Handling

The API returns appropriate HTTP status codes:

- `200`: Success
- `400`: Bad request (validation errors)
- `404`: Not found (business/assessment missing)
- `500`: Internal server error

Error responses follow FastAPI standard format:
```json
{
  "detail": "Error message description"
}
```

## Development

### Adding New Features

1. Add new models in `app/models/`
2. Create services in `app/services/`
3. Add routes in `app/routes/`
4. Include router in `app/main.py`
5. Add tests and update documentation

### Code Style

- Beginner-friendly with comprehensive comments
- Type hints for better IDE support
- Deterministic logic (no AI for core calculations)
- Graceful error handling
- Clear separation of concerns

## Deployment

The application is designed to work on Render.com with minimal configuration:

1. Set environment variables in Render dashboard
2. Deploy using GitHub integration
3. Ensure PostgreSQL database is configured
4. Test all endpoints after deployment

## License

MIT License - see LICENSE file for details.
