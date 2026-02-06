# Deployment Guide

## Overview
Complete deployment instructions for the Financial Health Assessment Tool for SMEs.

---

## A. Database Setup (Supabase)

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Choose a region close to your users
4. Set a strong database password

### 2. Run Database Schema
1. Go to SQL Editor in your Supabase dashboard
2. Copy the contents of `backend/schema.sql`
3. Paste and run the SQL script

### 3. Get Connection String
1. Go to Settings → Database
2. Copy the Connection string (URI format)
3. Format: `postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres`

---

## B. Backend Deployment (Render or Railway)

### Option 1: Render
1. Create account at [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure build settings:
   - **Build Command**: `cd backend && pip install -r requirements.txt`
   - **Start Command**: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Runtime**: Python 3

5. Set Environment Variables:
   ```
   DATABASE_URL=your-supabase-connection-string
   LLM_PROVIDER=openai
   OPENAI_API_KEY=your-openai-api-key
   OPENAI_MODEL=gpt-4o
   ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app,https://your-frontend-domain.netlify.app
   ENV=production
   ```

6. Deploy and wait for the service to be live
7. Note your backend URL (e.g., `https://your-app.onrender.com`)

### Option 2: Railway
1. Create account at [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Configure settings:
   - **Working Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

5. Add Environment Variables in the Variables tab:
   ```
   DATABASE_URL=your-supabase-connection-string
   LLM_PROVIDER=openai
   OPENAI_API_KEY=your-openai-api-key
   OPENAI_MODEL=gpt-4o
   ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app,https://your-frontend-domain.netlify.app
   ENV=production
   ```

6. Deploy and note your backend URL

---

## C. Frontend Deployment (Vercel or Netlify)

### Option 1: Vercel
1. Create account at [vercel.com](https://vercel.com)
2. Click "New Project" → Import your GitHub repository
3. Configure settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. Add Environment Variable:
   ```
   VITE_API_BASE_URL=https://your-backend-url.onrender.com
   ```

5. Deploy and note your frontend URL

### Option 2: Netlify
1. Create account at [netlify.com](https://netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect your GitHub repository
4. Configure build settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`

5. Add Environment Variable under Site settings → Build & deploy → Environment:
   ```
   VITE_API_BASE_URL=https://your-backend-url.onrender.com
   ```

6. Deploy and note your frontend URL

---

## D. CORS Configuration

### Update Backend CORS
After deploying your frontend, update the `ALLOWED_ORIGINS` environment variable on your backend:

```
ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app,https://your-frontend-domain.netlify.app,http://localhost:3000
```

### Test CORS
1. Open browser dev tools on your deployed frontend
2. Check Network tab for any CORS errors
3. If errors occur, verify the frontend URL is exactly matching in ALLOWED_ORIGINS

---

## E. Environment Variables Summary

### Backend Required Variables
```
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o
ALLOWED_ORIGINS=https://your-domain.vercel.app
ENV=production
```

### Frontend Required Variables
```
VITE_API_BASE_URL=https://your-backend-url.onrender.com
```

---

## F. Testing the Deployment

### 1. Backend Health Check
```bash
curl https://your-backend-url.onrender.com/health
```

### 2. Frontend Access
1. Open your frontend URL in browser
2. Test file upload with sample data
3. Verify dashboard loads correctly
4. Test insights generation

### 3. Error Monitoring
- Check Render/Railway logs for backend errors
- Check Vercel/Netlify functions for frontend errors
- Monitor Supabase logs for database issues

---

## G. Security Considerations

1. **API Keys**: Never expose API keys in frontend code
2. **Database**: Use Supabase Row Level Security if needed
3. **HTTPS**: All deployed services should use HTTPS
4. **Rate Limiting**: Consider implementing rate limiting for production
5. **Input Validation**: Backend validates all inputs (already implemented)

---

## H. Backup and Recovery

### Database Backup
- Supabase automatically backs up your database
- Enable point-in-time recovery in Supabase settings
- Export regular backups using Supabase dashboard

### Code Backup
- Your code is stored in GitHub
- Tag releases for easy rollback
- Maintain separate branches for production/staging

---

## I. Monitoring and Maintenance

### Performance Monitoring
- Use Render/Railway analytics for backend performance
- Use Vercel Analytics for frontend performance
- Monitor API response times

### Error Tracking
- Check logs regularly
- Set up alerts for critical errors
- Monitor database connection limits

### Updates
- Regular dependency updates
- Security patches
- Feature deployments

---

## J. Troubleshooting Common Issues

### Backend Issues
- **Database Connection**: Verify DATABASE_URL format
- **CORS Errors**: Check ALLOWED_ORIGINS configuration
- **Memory Issues**: Monitor resource usage on Render/Railway

### Frontend Issues
- **API Calls**: Verify VITE_API_BASE_URL is correct
- **Build Failures**: Check package.json dependencies
- **Routing**: Ensure React Router is configured correctly

### Database Issues
- **Connection Limits**: Monitor Supabase usage
- **Schema Mismatches**: Re-run schema.sql if needed
- **Permission Issues**: Check database user permissions

---

## K. Production Checklist

Before going live:

- [ ] All environment variables set
- [ ] CORS configured correctly
- [ ] Database schema applied
- [ ] SSL certificates active
- [ ] Error monitoring setup
- [ ] Backup strategy in place
- [ ] Performance testing completed
- [ ] Security review done
- [ ] Documentation updated
- [ ] Team trained on deployment process
