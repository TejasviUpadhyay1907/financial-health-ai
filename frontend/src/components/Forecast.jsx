import { useState } from 'react'
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts'
import { 
  TrendingUp, 
  AlertTriangle, 
  Info, 
  Download,
  Calendar
} from 'lucide-react'

import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { api } from '../lib/api'

export default function Forecast({ businessId, language = 'en' }) {
  const [forecastData, setForecastData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [horizon, setHorizon] = useState(3)

  const generateForecast = async () => {
    if (!businessId) {
      setError('Business ID is required for forecasting')
      return
    }

    try {
      setLoading(true)
      setError('')
      
      const data = await api.generateForecast(businessId, horizon)
      setForecastData(data)
    } catch (err) {
      setError(err.message || 'Failed to generate forecast')
    } finally {
      setLoading(false)
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

  // Prepare chart data
  const prepareChartData = () => {
    if (!forecastData) return []

    const allData = [
      ...forecastData.history.map(item => ({
        ...item,
        type: 'historical'
      })),
      ...forecastData.forecast.map(item => ({
        ...item,
        type: 'forecast'
      }))
    ]

    return allData.map(item => ({
      month: new Date(item.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      revenue: item.revenue,
      operating_expense: item.operating_expense,
      profit_proxy: item.profit_proxy,
      type: item.type
    }))
  }

  const chartData = prepareChartData()

  const getMethodColor = (method) => {
    switch (method) {
      case 'linear_trend': return 'text-blue-600'
      case 'moving_average': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  const getMethodDescription = (method) => {
    switch (method) {
      case 'linear_trend': return 'Linear Trend (Least Squares)'
      case 'moving_average': return 'Moving Average (3 months)'
      default: return 'Unknown Method'
    }
  }

  if (!forecastData) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5 text-blue-600" />
            Financial Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">
              Generate a forecast to see future financial projections based on historical data
            </p>
            <div className="flex items-center justify-center space-x-4">
              <select
                value={horizon}
                onChange={(e) => setHorizon(parseInt(e.target.value))}
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value={3}>3 Months</option>
                <option value={6}>6 Months</option>
                <option value={12}>12 Months</option>
              </select>
              
              <Button 
                onClick={generateForecast}
                disabled={loading || !businessId}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </div>
                ) : (
                  <>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Generate Forecast
                  </>
                )}
              </Button>
            </div>
            
            {error && (
              <div className="flex items-center justify-center space-x-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-blue-600" />
              Financial Forecast
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={horizon}
                onChange={(e) => setHorizon(parseInt(e.target.value))}
                className="h-8 rounded-md border border-input bg-background px-2 py-1 text-sm"
                disabled={loading}
              >
                <option value={3}>3 Months</option>
                <option value={6}>6 Months</option>
                <option value={12}>12 Months</option>
              </select>
              
              <Button 
                onClick={generateForecast}
                disabled={loading}
                size="sm"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                    Generating...
                  </div>
                ) : (
                  'Regenerate'
                )}
              </Button>

              <Button 
                onClick={downloadPDFReport}
                variant="outline"
                size="sm"
              >
                <Download className="mr-2 h-3 w-3" />
                PDF Report
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Method Info */}
          <div className="mb-6 p-4 bg-muted/50 rounded-lg border">
            <div className="flex items-center space-x-2 mb-2">
              <Info className="h-4 w-4 text-blue-600" />
              <span className="font-semibold">Forecast Method:</span>
              <span className={`font-medium ${getMethodColor(forecastData.method)}`}>
                {getMethodDescription(forecastData.method)}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              Based on {forecastData.history.length} months of historical data
            </div>
          </div>

          {/* Revenue & Expense Chart */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Revenue vs Operating Expense</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#16a34a" 
                  strokeWidth={2}
                  name="Revenue"
                  connectNulls={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="operating_expense" 
                  stroke="#dc2626" 
                  strokeWidth={2}
                  name="Operating Expense"
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Profit Proxy Chart */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Profit Proxy</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                <Legend />
                <Bar 
                  dataKey="profit_proxy" 
                  fill="#3b82f6"
                  name="Profit Proxy"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Forecast Notes */}
          {forecastData.notes && forecastData.notes.length > 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2 flex items-center">
                <AlertTriangle className="mr-2 h-4 w-4" />
                Important Notes
              </h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                {forecastData.notes.map((note, index) => (
                  <li key={index}>• {note}</li>
                ))}
              </ul>
            </div>
          )}

          {error && (
            <div className="flex items-center space-x-2 text-destructive mt-4">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
