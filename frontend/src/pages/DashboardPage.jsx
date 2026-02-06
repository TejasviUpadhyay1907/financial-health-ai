import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  FileText,
  Brain,
  Download,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'

import Navbar from '../components/Navbar'
import Forecast from '../components/Forecast'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Progress } from '../components/ui/progress'
import { api } from '../lib/api'
import { storage } from '../lib/storage'

export default function DashboardPage() {
  const { businessId } = useParams()
  const navigate = useNavigate()
  
  const [language, setLanguage] = useState(storage.getLanguage())
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
        setInsightLanguage(insightsData.lang || 'en')
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

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang)
    storage.setLanguage(newLang)
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

  const downloadPDFReport = () => {
    if (!businessId) {
      setError('Business ID is required for PDF report')
      return
    }

    try {
      const reportUrl = api.getReportUrl(businessId, language)
      window.open(reportUrl, '_blank')
    } catch (err) {
      setError(err.message || 'Failed to generate PDF report')
    }
  }

  const getRiskLevelColor = (riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
      case 'low': return 'text-green-600'
      case 'medium': return 'text-yellow-600'
      case 'high': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getRiskLevelBg = (riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-lime-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-red-600'
  }

  const prepareChartData = () => {
    if (!dashboardData?.metrics_json?.monthly_data) return []
    
    return dashboardData.metrics_json.monthly_data.map(item => ({
      month: new Date(item.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      revenue: item.revenue,
      expense: item.operating_expense,
      profit: item.profit_proxy
    }))
  }

  const prepareBarChartData = () => {
    if (!dashboardData?.metrics_json?.monthly_data) return []
    
    return dashboardData.metrics_json.monthly_data.map(item => ({
      month: new Date(item.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      profit: item.profit_proxy
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar currentLanguage={language} onLanguageChange={handleLanguageChange} />
        <main className="container mx-auto py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar currentLanguage={language} onLanguageChange={handleLanguageChange} />
        <main className="container mx-auto py-8">
          <Card className="max-w-2xl mx-auto border-destructive">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
                <h2 className="text-xl font-semibold text-destructive">Error Loading Dashboard</h2>
                <p className="text-muted-foreground">{error}</p>
                <Button onClick={() => navigate('/')} className="mt-4">
                  Back to Upload
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar currentLanguage={language} onLanguageChange={handleLanguageChange} />
        <main className="container mx-auto py-8">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h2 className="text-xl font-semibold">No Data Available</h2>
                <p className="text-muted-foreground">Please upload and analyze your financial data first.</p>
                <Button onClick={() => navigate('/')} className="mt-4">
                  Upload Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  const chartData = prepareChartData()
  const barChartData = prepareBarChartData()
  const metrics = dashboardData.metrics_json || {}

  return (
    <div className="min-h-screen bg-background">
      <Navbar currentLanguage={language} onLanguageChange={handleLanguageChange} />
      
      <main className="container mx-auto py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Financial Health Dashboard</h1>
              <p className="text-muted-foreground">
                Comprehensive analysis of your business financial health
              </p>
            </div>
            <Button onClick={() => navigate(`/report/${businessId}`)}>
              <FileText className="mr-2 h-4 w-4" />
              View Report
            </Button>
          </div>

          {/* Hero Card - Health Score */}
          <Card className="border-l-4 border-l-primary">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                <div className="text-center">
                  <div className="text-6xl font-bold mb-2">
                    <span className={getScoreColor(dashboardData.health_score)}>
                      {dashboardData.health_score}
                    </span>
                    <span className="text-2xl text-muted-foreground">/100</span>
                  </div>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRiskLevelBg(dashboardData.risk_level)}`}>
                    {dashboardData.risk_level?.toUpperCase()} RISK
                  </div>
                </div>

                <div className="md:col-span-2 space-y-4">
                  <h3 className="text-lg font-semibold mb-4">Score Breakdown</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {dashboardData.score_breakdown && Object.entries(dashboardData.score_breakdown).map(([key, value]) => (
                      <div key={key} className="text-center p-3 border rounded-lg">
                        <div className="text-xs text-muted-foreground mb-1">
                          {key.replace(/_/g, ' ').toUpperCase()}
                        </div>
                        <div className="text-lg font-bold">
                          {Math.round(value)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold">
                      ${metrics.revenue?.toLocaleString() || 'N/A'}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                    <p className="text-2xl font-bold">
                      ${metrics.expense?.toLocaleString() || 'N/A'}
                    </p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Net Profit</p>
                    <p className="text-2xl font-bold">
                      ${metrics.profit_proxy?.toLocaleString() || 'N/A'}
                    </p>
                  </div>
                  <div className={`h-8 w-8 ${metrics.profit_proxy >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {metrics.profit_proxy >= 0 ? <TrendingUp /> : <TrendingDown />}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Net Margin</p>
                  <p className="text-2xl font-bold">
                    {metrics.net_margin_percent?.toFixed(1) || 'N/A'}%
                  </p>
                  <Progress 
                    value={metrics.net_margin_percent || 0} 
                    className="mt-2" 
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">EMI Burden</p>
                  <p className="text-2xl font-bold">
                    {metrics.emi_burden_percent?.toFixed(1) || 'N/A'}%
                  </p>
                  <Progress 
                    value={Math.min(metrics.emi_burden_percent || 0, 100)} 
                    className="mt-2" 
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Revenue Trend</p>
                  <p className="text-2xl font-bold flex items-center">
                    {metrics.revenue_trend_percent?.toFixed(1) || 'N/A'}%
                    {metrics.revenue_trend_percent >= 0 ? (
                      <ArrowUpRight className="ml-2 h-5 w-5 text-green-600" />
                    ) : (
                      <ArrowDownRight className="ml-2 h-5 w-5 text-red-600" />
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue vs Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `$${(value/1000).toFixed(0)}K`} />
                      <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#2563eb" 
                        strokeWidth={2}
                        name="Revenue"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="expense" 
                        stroke="#dc2626" 
                        strokeWidth={2}
                        name="Expenses"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No chart data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Profit Trend</CardTitle>
              </CardHeader>
              <CardContent>
                {barChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={barChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `$${(value/1000).toFixed(0)}K`} />
                      <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                      <Bar 
                        dataKey="profit" 
                        fill={metrics.profit_proxy >= 0 ? '#16a34a' : '#dc2626'}
                        name="Profit"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No profit data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Risk Flags */}
          {dashboardData.risk_flags && dashboardData.risk_flags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="mr-2 h-5 w-5 text-yellow-600" />
                  Risk Flags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.risk_flags.map((flag, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{flag}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="mr-2 h-5 w-5 text-primary" />
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <select
                  value={insightLanguage}
                  onChange={(e) => setInsightLanguage(e.target.value)}
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="en">English</option>
                  <option value="hi">हिंदी</option>
                </select>
                
                <Button 
                  onClick={generateInsights}
                  disabled={insightLoading}
                  className="min-w-[140px]"
                >
                  {insightLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </div>
                  ) : (
                    <>
                      <Brain className="mr-2 h-4 w-4" />
                      Generate Insights
                    </>
                  )}
                </Button>

                <Button 
                  onClick={downloadPDFReport}
                  variant="outline"
                  className="min-w-[140px]"
                >
                  <Download className="mr-2 h-4 w-4" />
                  PDF Report
                </Button>
              </div>
              
              {insights ? (
                <div className="mt-4 p-4 bg-muted/50 rounded-lg border">
                  <div className="whitespace-pre-line text-sm leading-relaxed">
                    {insights}
                  </div>
                </div>
              ) : (
                <div className="mt-4 text-center text-muted-foreground">
                  <Brain className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p>Click "Generate Insights" to get AI-powered analysis and recommendations</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Forecast Section */}
          <Forecast businessId={businessId} language={language} />
        </div>
      </main>
    </div>
  )
}
