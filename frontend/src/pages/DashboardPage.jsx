import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import api from '../api'

function DashboardPage() {
  const { businessId } = useParams()
  const navigate = useNavigate()
  
  const [dashboardData, setDashboardData] = useState(null)
  const [insights, setInsights] = useState('')
  const [insightLanguage, setInsightLanguage] = useState('en')
  const [loading, setLoading] = useState(true)
  const [insightLoading, setInsightLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadDashboard()
  }, [businessId])

  const loadDashboard = async () => {
    try {
      setLoading(true)
      const data = await api.getDashboard(businessId)
      setDashboardData(data)
      
      // Load existing insights
      try {
        const insightsData = await api.getInsights(businessId)
        setInsights(insightsData.insights_text)
        setInsightLanguage(insightsData.lang)
      } catch (err) {
        // Insights might not exist yet
        setInsights('')
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const generateInsights = async () => {
    try {
      setInsightLoading(true)
      const response = await api.generateInsights(businessId, insightLanguage)
      setInsights(response.insights_text)
    } catch (err) {
      setError(err.message || 'Failed to generate insights')
    } finally {
      setInsightLoading(false)
    }
  }

  const getRiskLevelColor = (riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
      case 'low': return 'risk-low'
      case 'medium': return 'risk-medium'
      case 'high': return 'risk-high'
      default: return ''
    }
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'score-excellent'
    if (score >= 60) return 'score-good'
    if (score >= 40) return 'score-fair'
    return 'score-poor'
  }

  const prepareChartData = () => {
    if (!dashboardData?.metrics_json?.monthly_data) return []
    
    return dashboardData.metrics_json.monthly_data.map(item => ({
      month: new Date(item.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      revenue: item.revenue,
      expense: item.operating_expense,
      profitProxy: item.profit_proxy
    }))
  }

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <div className="loading" style={{ margin: '0 auto' }}></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container">
        <div className="card">
          <div className="error">{error}</div>
          <button className="btn btn-secondary mt-4" onClick={() => navigate('/')}>
            Back to Upload
          </button>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="container">
        <div className="card">
          <h2>No Data Available</h2>
          <p>Please upload and analyze your financial data first.</p>
          <button className="btn mt-4" onClick={() => navigate('/')}>
            Upload Data
          </button>
        </div>
      </div>
    )
  }

  const chartData = prepareChartData()

  return (
    <div className="container">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1>Financial Health Dashboard</h1>
          <button 
            className="btn btn-secondary" 
            onClick={() => navigate(`/report/${businessId}`)}
          >
            View Report
          </button>
        </div>

        {/* Health Score and Risk Level */}
        <div className="grid grid-2" style={{ marginBottom: '32px' }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <h3>Health Score</h3>
            <div className={`getScoreColor(dashboardData.health_score)}`} style={{ fontSize: '48px', fontWeight: 'bold', margin: '16px 0' }}>
              {dashboardData.health_score}/100
            </div>
            <div className={getRiskLevelColor(dashboardData.risk_level)} style={{ fontSize: '20px', fontWeight: '500' }}>
              {dashboardData.risk_level?.toUpperCase()} RISK
            </div>
          </div>

          <div className="card">
            <h3>Key Metrics</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
              <div>
                <strong>Revenue:</strong> ${dashboardData.metrics_json?.revenue?.toLocaleString() || 'N/A'}
              </div>
              <div>
                <strong>Expense:</strong> ${dashboardData.metrics_json?.expense?.toLocaleString() || 'N/A'}
              </div>
              <div>
                <strong>Profit:</strong> ${dashboardData.metrics_json?.profit_proxy?.toLocaleString() || 'N/A'}
              </div>
              <div>
                <strong>Net Margin:</strong> {dashboardData.metrics_json?.net_margin_percent?.toFixed(1) || 'N/A'}%
              </div>
              <div>
                <strong>EMI Burden:</strong> {dashboardData.metrics_json?.emi_burden_percent?.toFixed(1) || 'N/A'}%
              </div>
              <div>
                <strong>Trend:</strong> {dashboardData.metrics_json?.revenue_trend_percent?.toFixed(1) || 'N/A'}%
              </div>
            </div>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="card">
          <h3>Score Breakdown</h3>
          <div className="grid grid-3">
            {dashboardData.score_breakdown && Object.entries(dashboardData.score_breakdown).map(([key, value]) => (
              <div key={key} className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                  {key.replace(/_/g, ' ').toUpperCase()}
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                  {Math.round(value)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Charts */}
        {chartData.length > 0 && (
          <div className="card">
            <h3>Financial Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#2563eb" name="Revenue" />
                <Line type="monotone" dataKey="expense" stroke="#dc2626" name="Expense" />
                <Line type="monotone" dataKey="profitProxy" stroke="#16a34a" name="Profit Proxy" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Risk Flags */}
        {dashboardData.risk_flags && dashboardData.risk_flags.length > 0 && (
          <div className="card">
            <h3>Risk Flags</h3>
            <ul style={{ textAlign: 'left', color: '#dc2626' }}>
              {dashboardData.risk_flags.map((flag, index) => (
                <li key={index}>{flag}</li>
              ))}
            </ul>
          </div>
        )}

        {/* AI Insights */}
        <div className="card">
          <h3>AI Insights</h3>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>
            <select
              value={insightLanguage}
              onChange={(e) => setInsightLanguage(e.target.value)}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
            >
              <option value="en">English</option>
              <option value="hi">हिंदी</option>
            </select>
            <button 
              className="btn" 
              onClick={generateInsights}
              disabled={insightLoading}
            >
              {insightLoading ? (
                <>
                  <div className="loading" style={{ marginRight: '8px', display: 'inline-block' }}></div>
                  Generating...
                </>
              ) : (
                'Generate Insights'
              )}
            </button>
          </div>
          
          {insights ? (
            <div style={{ 
              textAlign: 'left', 
              padding: '16px', 
              backgroundColor: '#f8fafc', 
              borderRadius: '6px',
              whiteSpace: 'pre-line',
              lineHeight: '1.6'
            }}>
              {insights}
            </div>
          ) : (
            <p style={{ color: '#666', fontStyle: 'italic' }}>
              Click "Generate Insights" to get AI-powered analysis and recommendations.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
