import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api'

function ReportPage() {
  const { businessId } = useParams()
  const navigate = useNavigate()
  
  const [dashboardData, setDashboardData] = useState(null)
  const [insights, setInsights] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadReportData()
  }, [businessId])

  const loadReportData = async () => {
    try {
      setLoading(true)
      const [dashboardResponse, insightsResponse] = await Promise.all([
        api.getDashboard(businessId),
        api.getInsights(businessId).catch(() => ({ insights_text: '' }))
      ])
      
      setDashboardData(dashboardResponse)
      setInsights(insightsResponse.insights_text)
    } catch (err) {
      setError(err.message || 'Failed to load report data')
    } finally {
      setLoading(false)
    }
  }

  const getRiskLevelColor = (riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
      case 'low': return '#16a34a'
      case 'medium': return '#f59e0b'
      case 'high': return '#dc2626'
      default: return '#666'
    }
  }

  const getScoreColor = (score) => {
    if (score >= 80) return '#16a34a'
    if (score >= 60) return '#84cc16'
    if (score >= 40) return '#f59e0b'
    return '#dc2626'
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <div className="loading" style={{ margin: '0 auto' }}></div>
          <p>Loading report...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container">
        <div className="card">
          <div className="error">{error}</div>
          <button className="btn btn-secondary mt-4" onClick={() => navigate(`/dashboard/${businessId}`)}>
            Back to Dashboard
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
          <p>Please complete the analysis first.</p>
          <button className="btn mt-4" onClick={() => navigate('/')}>
            Upload Data
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      {/* Print Header - Hidden on screen, visible on print */}
      <div style={{ display: 'none', '@media print': { display: 'block' } }} className="print-only">
        <h1>Financial Health Assessment Report</h1>
        <p>Generated on: {new Date().toLocaleDateString()}</p>
        <hr />
      </div>

      <div className="card">
        {/* Screen Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }} className="screen-only">
          <h1>Investor Report</h1>
          <div>
            <button 
              className="btn btn-secondary" 
              onClick={() => navigate(`/dashboard/${businessId}`)}
              style={{ marginRight: '12px' }}
            >
              Back to Dashboard
            </button>
            <button className="btn" onClick={handlePrint}>
              Print / Save as PDF
            </button>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="card" style={{ backgroundColor: '#f8fafc', border: '2px solid #e2e8f0' }}>
          <h2>Executive Summary</h2>
          <div className="grid grid-2">
            <div>
              <h3>Overall Health Score</h3>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: getScoreColor(dashboardData.health_score) }}>
                {dashboardData.health_score}/100
              </div>
              <div style={{ fontSize: '18px', color: getRiskLevelColor(dashboardData.risk_level), fontWeight: '500' }}>
                {dashboardData.risk_level?.toUpperCase()} RISK
              </div>
            </div>
            <div>
              <h3>Key Financial Metrics</h3>
              <ul style={{ textAlign: 'left', lineHeight: '1.8' }}>
                <li><strong>Total Revenue:</strong> ${dashboardData.metrics_json?.revenue?.toLocaleString() || 'N/A'}</li>
                <li><strong>Total Expenses:</strong> ${dashboardData.metrics_json?.expense?.toLocaleString() || 'N/A'}</li>
                <li><strong>Net Profit:</strong> ${dashboardData.metrics_json?.profit_proxy?.toLocaleString() || 'N/A'}</li>
                <li><strong>Net Margin:</strong> {dashboardData.metrics_json?.net_margin_percent?.toFixed(1) || 'N/A'}%</li>
                <li><strong>EMI Burden:</strong> {dashboardData.metrics_json?.emi_burden_percent?.toFixed(1) || 'N/A'}%</li>
                <li><strong>Revenue Trend:</strong> {dashboardData.metrics_json?.revenue_trend_percent?.toFixed(1) || 'N/A'}%</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="card">
          <h2>Financial Health Breakdown</h2>
          <div className="grid grid-3">
            {dashboardData.score_breakdown && Object.entries(dashboardData.score_breakdown).map(([key, value]) => (
              <div key={key} className="card" style={{ textAlign: 'center', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px', fontWeight: '500' }}>
                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: getScoreColor(value) }}>
                  {Math.round(value)}
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  {value >= 80 ? 'Excellent' : value >= 60 ? 'Good' : value >= 40 ? 'Fair' : 'Poor'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Analysis */}
        {dashboardData.risk_flags && dashboardData.risk_flags.length > 0 && (
          <div className="card">
            <h2>Risk Analysis</h2>
            <div style={{ backgroundColor: '#fef2f2', padding: '20px', borderRadius: '8px', border: '1px solid #fecaca' }}>
              <h3 style={{ color: '#dc2626', marginBottom: '16px' }}>Identified Risk Factors</h3>
              <ul style={{ textAlign: 'left', color: '#7f1d1d', lineHeight: '1.8' }}>
                {dashboardData.risk_flags.map((flag, index) => (
                  <li key={index}>{flag}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Positive Factors */}
        {dashboardData.top_positive_factors && dashboardData.top_positive_factors.length > 0 && (
          <div className="card">
            <h2>Strengths</h2>
            <div style={{ backgroundColor: '#f0fdf4', padding: '20px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
              <ul style={{ textAlign: 'left', color: '#14532d', lineHeight: '1.8' }}>
                {dashboardData.top_positive_factors.map((factor, index) => (
                  <li key={index}>{factor}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* AI Insights and Recommendations */}
        {insights && (
          <div className="card">
            <h2>AI-Powered Insights & Recommendations</h2>
            <div style={{ 
              textAlign: 'left', 
              padding: '24px', 
              backgroundColor: '#f8fafc', 
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              whiteSpace: 'pre-line',
              lineHeight: '1.7',
              fontSize: '15px'
            }}>
              {insights}
            </div>
          </div>
        )}

        {/* Suggested Financial Products */}
        <div className="card">
          <h2>Recommended Financial Products & Services</h2>
          <div className="grid grid-2">
            <div className="card" style={{ border: '1px solid #e2e8f0' }}>
              <h3>Based on Health Score: {dashboardData.health_score}</h3>
              {dashboardData.health_score >= 70 && (
                <div>
                  <h4 style={{ color: '#16a34a' }}>Premium Products Available</h4>
                  <ul style={{ textAlign: 'left', lineHeight: '1.6' }}>
                    <li>Business expansion loans</li>
                    <li>Working capital optimization</li>
                    <li>Investment advisory services</li>
                    <li>Trade finance facilities</li>
                  </ul>
                </div>
              )}
              {dashboardData.health_score >= 40 && dashboardData.health_score < 70 && (
                <div>
                  <h4 style={{ color: '#f59e0b' }}>Growth Support Products</h4>
                  <ul style={{ textAlign: 'left', lineHeight: '1.6' }}>
                    <li>Working capital loans</li>
                    <li>Cash flow management tools</li>
                    <li>Financial consulting services</li>
                    <li>Invoice discounting</li>
                  </ul>
                </div>
              )}
              {dashboardData.health_score < 40 && (
                <div>
                  <h4 style={{ color: '#dc2626' }}>Recovery Support Products</h4>
                  <ul style={{ textAlign: 'left', lineHeight: '1.6' }}>
                    <li>Debt restructuring assistance</li>
                    <li>Emergency working capital</li>
                    <li>Financial recovery consulting</li>
                    <li>Credit counseling services</li>
                  </ul>
                </div>
              )}
            </div>

            <div className="card" style={{ border: '1px solid #e2e8f0' }}>
              <h3>Industry-Specific Solutions</h3>
              <p style={{ textAlign: 'left', lineHeight: '1.6' }}>
                Based on your industry profile, we recommend exploring specialized financial products 
                designed for businesses in your sector. Contact our relationship managers to learn 
                about industry-specific loan programs, supply chain financing, and sector-focused 
                investment opportunities.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid #e2e8f0', textAlign: 'center', color: '#666' }}>
          <p>This report was generated using the Financial Health Assessment Tool.</p>
          <p>For questions or additional analysis, please contact your financial advisor.</p>
          <p><strong>Disclaimer:</strong> This assessment is based on the provided financial data and should be considered along with other factors when making financial decisions.</p>
        </div>
      </div>

      <style jsx>{`
        @media print {
          .screen-only {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          .card {
            break-inside: avoid;
            box-shadow: none;
            border: 1px solid #e2e8f0;
          }
        }
        @media screen {
          .print-only {
            display: none;
          }
        }
      `}</style>
    </div>
  )
}

export default ReportPage
