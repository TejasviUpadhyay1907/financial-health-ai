# FastAPI Backend Fixes - SQLite Local Development

## Issues Fixed

✅ **PostgreSQL dependency removed** - Now uses SQLite by default  
✅ **JSONB → JSON** - SQLite-compatible data types  
✅ **Database imports fixed** - All routes use correct import path  
✅ **Frontend payload compatibility** - Accepts both `name` and `businessName`  
✅ **CORS configuration** - Allows localhost:5173 and 127.0.0.1:5173  
✅ **Auto table creation** - Models imported before create_all()  

---

## File Changes (Diff Style)

### 1. `backend/app/db/database.py`
```diff
- DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./financial_health.db")
+ DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")
```

### 2. `backend/app/schemas/business.py`
```diff
+ from datetime import datetime
+ from pydantic import BaseModel, Field
+ 
+ 
+ class BusinessCreate(BaseModel):
+     name: str = Field(..., min_length=1, max_length=255, alias="businessName")
+     industry: str | None = Field(None, max_length=100)
+     language: str = Field("en", max_length=10)
+ 
+     class Config:
+         populate_by_name = True
```

### 3. `backend/app/models/assessment_result.py`
```diff
- from sqlalchemy.dialects.postgresql import JSONB
+ from sqlalchemy import Column, Integer, Date, String, Text, DateTime, ForeignKey, JSON
-     metrics_json = Column(JSONB, nullable=False, default=dict)
-     risk_flags = Column(JSONB, nullable=False, default=list)
+     metrics_json = Column(JSON, nullable=False, default=dict)
+     risk_flags = Column(JSON, nullable=False, default=list)
```

### 4. `backend/app/routes/*.py` (All route files)
```diff
- from app.db.session import get_db
+ from app.db.database import get_db
```

### 5. `backend/.env.example`
```diff
- # PostgreSQL (Supabase or local)
- DATABASE_URL=postgresql://user:password@host:5432/database
+ # SQLite (default) or PostgreSQL
+ DATABASE_URL=sqlite:///./app.db
+ # DATABASE_URL=postgresql://user:password@host:5432/database
```

### 6. `backend/requirements.txt`
```diff
- psycopg2-binary>=2.9.9
+ # psycopg2-binary>=2.9.9  # Uncomment if using PostgreSQL
```

---

## Step-by-Step Setup Commands

### Backend Setup
```bash
# Navigate to backend
cd backend

# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Start the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Test Backend
```bash
# Run the test script
python test_local.py

# Or test manually:
curl http://localhost:8000/health

# Create a business (frontend-compatible payload)
curl -X POST "http://localhost:8000/business" \
  -H "Content-Type: application/json" \
  -d '{"businessName": "Test Business", "industry": "Manufacturing", "language": "en"}'
```

### Frontend Setup
```bash
# Navigate to frontend (new terminal)
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## Verification Checklist

### Backend Tests
- [ ] `uvicorn app.main:app --reload` starts without errors
- [ ] `curl http://localhost:8000/health` returns `200 OK`
- [ ] POST `/business` accepts `businessName` payload
- [ ] Database file `app.db` is created in backend directory
- [ ] No PostgreSQL connection errors

### Frontend Tests
- [ ] Frontend loads at `http://localhost:5173`
- [ ] Can create business and upload file
- [ ] Dashboard loads with health score
- [ ] Forecast feature works
- [ ] PDF download works

### Integration Tests
- [ ] Complete flow: Upload → Analyze → Dashboard → Forecast → PDF
- [ ] No CORS errors in browser console
- [ ] All API calls succeed
- [ ] SQLite database contains data

---

## Troubleshooting

### Common Issues

#### 1. "no such table: businesses"
**Solution**: Ensure models are imported in `main.py`:
```python
from app.models import *  # This should be in main.py
Base.metadata.create_all(bind=engine)
```

#### 2. "SQLiteTypeCompiler has no attribute visit_JSONB"
**Solution**: The JSONB → JSON fix should resolve this. Verify all models use `JSON` not `JSONB`.

#### 3. "psycopg2 OperationalError"
**Solution**: SQLite is now default, but if you still see this:
```bash
# Check your .env file
cat .env | grep DATABASE_URL
# Should show: sqlite:///./app.db
```

#### 4. CORS errors
**Solution**: Verify ALLOWED_ORIGINS includes your frontend URL:
```bash
# In .env
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

#### 5. Frontend payload mismatch
**Solution**: Backend now accepts both `name` and `businessName` due to Pydantic alias.

### Debug Mode
For detailed error messages, the backend is configured to show full error details in development mode.

---

## Production Deployment (Optional)

For PostgreSQL deployment (e.g., Render.com):
1. Uncomment `psycopg2-binary>=2.9.9` in requirements.txt
2. Set `DATABASE_URL=postgresql://...` in environment
3. The JSON columns work with both SQLite and PostgreSQL

---

## Next Steps

Once everything is working:
1. Test the complete user flow
2. Verify forecast and PDF features
3. Test with different file formats
4. Deploy to production if needed

The backend should now work seamlessly with the React frontend using SQLite for local development!
