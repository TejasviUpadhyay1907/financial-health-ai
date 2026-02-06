import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  FileText, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Brain,
  Building,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'

import Navbar from '../components/Navbar'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Progress } from '../components/ui/progress'
import { api } from '../lib/api'
import { storage } from '../lib/storage'

export default function ReportPage() {
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
      setInsightLanguage(insightsResponse.lang || 'en')
    } catch (err) {
      setError(err.message || 'Failed to load report data')
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

  const handlePrint = () => {
    window.print()
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

  const getScoreGrade = (score) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    return 'Poor'
  }

  const getRecommendedProducts = (score, riskFlags) => {
    const products = []
    
    if (score >= 70) {
      products.push({
        type: 'Business Expansion Loan',
        reason: 'Strong financial health supports growth financing',
        icon: <TrendingUp className="h-5 w-5 text-green-600" />
      })
      products.push({
        type: 'Working Capital Optimization',
        reason: 'Good cash flow management for operational efficiency',
        icon: <DollarSign className="h-5 w-5 text-blue-600" />
      })
    } else if (score >= 40) {
      products.push({
        type: 'Working Capital Loan',
        reason: 'Moderate risk requires working capital support',
        icon: <DollarSign className="h-5 w-5 text-yellow-600" />
      })
      products.push({
        type: 'Invoice Discounting',
        reason: 'Improve cash flow by leveraging receivables',
        icon: <FileText className="h-5 w-5 text-purple-600" />
      })
    } else {
      products.push({
        type: 'Debt Restructuring',
        reason: 'High risk indicates need for debt reorganization',
        icon: <AlertTriangle className="h-5 w-5 text-red-600" />
      })
      products.push({
        type: 'Emergency Working Capital',
        reason: 'Critical need for immediate liquidity support',
        icon: <Building className="h-5 w-5 text-red-600" />
      })
    }

    if (riskFlags.includes('high_emi_burden')) {
      products.push({
        type: 'Debt Consolidation',
        reason: 'High EMI burden suggests debt consolidation benefits',
        icon: <TrendingDown className="h-5 w-5 text-orange-600" />
      })
    }

    return products
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
                <h2 className="text-xl font-semibold text-destructive">Error Loading Report</h2>
                <p className="text-muted-foreground">{error}</p>
                <Button onClick={() => navigate(`/dashboard/${businessId}`)} className="mt-4">
                  Back to Dashboard
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
                <p className="text-muted-foreground">Please complete the analysis first.</p>
                <Button onClick={() => navigate(`/dashboard/${businessId}`)} className="mt-4">
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  const metrics = dashboardData.metrics_json || {}
  const recommendedProducts = getRecommendedProducts(dashboardData.health_score, dashboardData.risk_flags || [])

  return (
    <div className="min-h-screen bg-background">
      <Navbar currentLanguage={language} onLanguageChange={handleLanguageChange} />
      
      <main className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4 mb-8">
            <div className="flex items-center justify-center space-x-3">
              <FileText className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Financial Health Report</h1>
            </div>
            <p className="text-lg text-muted-foreground">
              Investor-ready analysis and recommendations for your SME business
            </p>
            <div className="flex items-center justify-center space-x-4">
              <Button onClick={() => navigate(`/dashboard/${businessId}`)} variant="outline">
                Back to Dashboard
              </Button>
              <Button onClick={handlePrint}>
                <Download className="mr-2 h-4 w-4" />
                Print / Save as PDF
              </Button>
            </div>
          </div>

          {/* Executive Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                Executive Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Overall Health Score</h3>
                  <div className="flex items-center space-x-4">
                    <div className="text-4xl font-bold">
                      <span className={getScoreColor(dashboardData.health_score)}>
                        {dashboardData.health_score}/100
                      </span>
                      <span className="text-lg text-muted-foreground">({getScoreGrade(dashboardData.health_score)})</span>
                    </div>
                    <div className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-medium ${getRiskLevelBg(dashboardData.risk_level)}`}>
                      {dashboardData.risk_level?.toUpperCase()} RISK
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Key Financial Metrics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Revenue:</span>
                      <span className="font-semibold">${metrics.revenue?.toLocaleString() || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Net Profit:</span>
                      <span className="font-semibold">${metrics.profit_proxy?.toLocaleString() || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Net Margin:</span>
                      <span className="font-semibold">{metrics.net_margin_percent?.toFixed(1) || 'N/A'}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">EMI Burden:</span>
                      <span className="font-semibold">{metrics.emi_burden_percent?.toFixed(1) || 'N/A'}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Revenue Trend:</span>
                      <span className="font-semibold flex items-center">
                        {metrics.revenue_trend_percent?.toFixed(1) || 'N/A'}%
                        {metrics.revenue_trend_percent >= 0 ? (
                          <ArrowUpRight className="ml-2 h-4 w-4 text-green-600" />
                        ) : (
                          <ArrowDownRight className="ml-2 h-4 w-4 text-red-600" />
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risk Analysis */}
          {dashboardData.risk_flags && dashboardData.risk_flags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="mr-2 h-5 w-5 text-yellow-600" />
                  Risk Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3 text-red-600">Identified Risk Factors</h4>
                      <div className="space-y-2">
                        {dashboardData.risk_flags.map((flag, index) => (
                          <div key={index} className="flex items-start space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{flag}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {dashboardData.top_negative_factors && dashboardData.top_negative_factors.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3 text-orange-600">Areas of Concern</h4>
                        <div className="space-y-2">
                          {dashboardData.top_negative_factors.map((factor, index) => (
                            <div key={index} className="flex items-start space-x-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                              <TrendingDown className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{factor}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Strengths */}
          {dashboardData.top_positive_factors && dashboardData.top_positive_factors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                  Business Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.top_positive_factors.map((factor, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{factor}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Insights & Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Brain className="mr-2 h-5 w-5 text-primary" />
                  AI-Powered Insights & Recommendations
                </div>
                <div className="flex items-center space-x-3">
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
                    size="sm"
                  >
                    {insightLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating...
                      </div>
                    ) : (
                      'Generate New Insights'
                    )}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {insights ? (
                <div className="space-y-6">
                  <div className="p-6 bg-muted/50 rounded-lg border">
                    <div className="whitespace-pre-line text-sm leading-relaxed">
                      {insights}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>Generate AI insights to get personalized recommendations and analysis</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recommended Financial Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="mr-2 h-5 w-5 text-green-600" />
                Recommended Financial Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground mb-4">
                  Based on your financial health score and risk profile, here are the financial products that may be suitable for your business:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recommendedProducts.map((product, index) => (
                    <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-start space-x-3">
                        <div className="mt-1">
                          {product.icon}
                        </div>
                        <div>
                          <h4 className="font-semibold text-lg">{product.type}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{product.reason}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Next Steps</h4>
                  <ul className="text-sm text-blue-700 space-y-2">
                    <li>• Contact your financial advisor to discuss these options</li>
                    <li>• Prepare necessary business documentation</li>
                    <li>• Consider improving financial metrics before applying</li>
                    <li>• Review terms and conditions carefully</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="mt-12 text-center space-y-4">
            <div className="border-t pt-8">
              <p className="text-sm text-muted-foreground mb-4">
                This report was generated using the Financial Health Assessment Tool. For questions or additional analysis, please contact your financial advisor.
              </p>
              <p className="text-xs text-muted-foreground">
                <strong>Disclaimer:</strong> This assessment is based on the provided financial data and should be considered along with other factors when making financial decisions. The recommendations provided are for informational purposes only.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
