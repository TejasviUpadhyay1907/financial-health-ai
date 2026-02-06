# Financial Health Assessment Tool - Frontend

React + Vite frontend for the SME Financial Health Assessment Tool.

## Features

- **Upload Page**: Simple form for business data upload (CSV/Excel)
- **Dashboard**: Interactive financial health dashboard with charts
- **Reports**: Investor-ready financial health reports
- **Multilingual**: English and Hindi support
- **Responsive**: Works on desktop and mobile devices

## Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your backend URL
```

3. Start development server:
```bash
npm run dev
```

4. Open http://localhost:3000 in your browser

## Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_BASE_URL=http://localhost:8000
```

For production, set this to your deployed backend URL.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
frontend/
├── src/
│   ├── api.js              # API wrapper for backend communication
│   ├── App.jsx             # Main app component with routing
│   ├── index.css           # Global styles
│   ├── main.jsx            # App entry point
│   └── pages/
│       ├── UploadPage.jsx  # File upload and business creation
│       ├── DashboardPage.jsx # Financial dashboard with charts
│       └── ReportPage.jsx  # Investor-ready reports
├── public/                 # Static assets
├── index.html              # HTML template
├── package.json            # Dependencies and scripts
└── vite.config.js          # Vite configuration
```

## Key Components

### UploadPage
- Business information form
- File upload (CSV/Excel)
- Progress indicators
- Error handling

### DashboardPage
- Health score display
- Risk level indicators
- Financial metrics grid
- Interactive charts (Recharts)
- AI insights generation
- Risk flags display

### ReportPage
- Executive summary
- Financial breakdowns
- Risk analysis
- AI recommendations
- Print/PDF functionality

## API Integration

The frontend communicates with the backend through the `api.js` wrapper:

```javascript
import api from './api'

// Create business
const business = await api.createBusiness(data)

// Upload file
await api.uploadFile(businessId, file)

// Analyze data
await api.analyzeBusiness(businessId)

// Get dashboard data
const dashboard = await api.getDashboard(businessId)

// Generate insights
const insights = await api.generateInsights(businessId, 'en')
```

## Styling

The application uses custom CSS with utility classes:
- Responsive grid system
- Component-based styling
- Color-coded risk levels
- Loading states and animations

## Charts

Financial visualizations are powered by Recharts:
- Revenue vs Expense trends
- Profit margin analysis
- Cash flow patterns

## Error Handling

- User-friendly error messages
- Network error recovery
- Form validation
- Loading states

## Deployment

### Vercel
1. Connect your GitHub repository
2. Set `VITE_API_BASE_URL` environment variable
3. Deploy automatically

### Netlify
1. Connect your GitHub repository
2. Set build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Add environment variable: `VITE_API_BASE_URL`

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Follow the existing code style
2. Add comments for complex logic
3. Test all functionality
4. Update documentation

## Troubleshooting

### Common Issues

**CORS Errors**: Ensure backend allows your frontend domain in `ALLOWED_ORIGINS`

**API Connection**: Verify `VITE_API_BASE_URL` is correct and backend is running

**Build Failures**: Check Node.js version and clear npm cache

**File Upload**: Ensure file format is CSV or Excel with required columns

### Debug Mode

Add `?debug=true` to URL to enable console logging for API calls.

## Performance

- Lazy loading of route components
- Optimized bundle size
- Efficient re-rendering
- Image optimization

## Security

- No sensitive data in frontend
- Environment variables for configuration
- Input validation
- XSS prevention
