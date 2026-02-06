import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Download, TrendingUp } from 'lucide-react'

import Navbar from '../components/Navbar'
import Stepper from '../components/Stepper'
import FileUpload from '../components/FileUpload'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Progress } from '../components/ui/progress'
import { api } from '../lib/api'
import { storage } from '../lib/storage'

const industries = [
  'Manufacturing',
  'Retail', 
  'Agriculture',
  'Services',
  'Logistics',
  'E-commerce'
]

export default function UploadPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [language, setLanguage] = useState(storage.getLanguage())
  const [formData, setFormData] = useState({
    businessName: '',
    industry: '',
  })
  const [selectedFile, setSelectedFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(0)
  const navigate = useNavigate()

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang)
    storage.setLanguage(newLang)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError('')
  }

  const handleFileSelect = (file) => {
    setSelectedFile(file)
    setCurrentStep(2)
    setError('')
  }

  const handleClearFile = () => {
    setSelectedFile(null)
    setCurrentStep(1)
    setError('')
  }

  const downloadSample = () => {
    const link = document.createElement('a')
    link.href = '/sample-data/sample.csv'
    link.download = 'sample-financial-data.csv'
    link.click()
  }

  const canProceed = () => {
  if (currentStep === 1) {
    return formData.businessName?.trim() !== "" && formData.industry !== ""
  }

  if (currentStep === 2) {
    return selectedFile !== null
  }

  if (currentStep === 3) {
    return true
  }

  return false
}


  const handleSubmit = async () => {
    if (!canProceed()) return

    setError('')
    setLoading(true)
    setProgress(0)

    try {
      // Step 1: Create business (25%)
      setProgress(25)
      const business = await api.createBusiness({
        name: formData.businessName,
        industry: formData.industry,
        language: language
      })

      // Step 2: Upload file (50%)
      setProgress(50)
      await api.uploadFile(business.id, selectedFile)

      // Step 3: Analyze (75%)
      setProgress(75)
      await api.analyzeBusiness(business.id)

      // Complete (100%)
      setProgress(100)
      storage.setBusinessId(business.id)

      // Navigate to dashboard
      setTimeout(() => {
        navigate(`/dashboard/${business.id}`)
      }, 1000)

    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.')
      setProgress(0)
      setLoading(false)
    }
  }

  const nextStep = () => {
    if (canProceed()) {
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1)
      }
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar currentLanguage={language} onLanguageChange={handleLanguageChange} />
      
      <main className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-3">
              <TrendingUp className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Financial Health Assessment</h1>
            </div>
            <p className="text-lg text-muted-foreground">
              Get a comprehensive analysis of your SME's financial health in minutes
            </p>
          </div>

          {/* Stepper */}
          <Stepper currentStep={currentStep} />

          {/* Error Display */}
          {error && (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <p className="text-destructive">{error}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Progress */}
          {loading && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Processing your financial data...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step Content */}
          {!loading && (
            <>
              {currentStep === 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Business Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Business Name *</label>
                        <input
                          type="text"
                          name="businessName"
                          value={formData.businessName}
                          onChange={handleInputChange}
                          placeholder="Enter your business name"
                          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Industry *</label>
                        <select
                          name="industry"
                          value={formData.industry}
                          onChange={handleInputChange}
                          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">Select industry</option>
                          {industries.map(industry => (
                            <option key={industry} value={industry}>
                              {industry}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {currentStep === 2 && (
                <FileUpload
                  onFileSelect={handleFileSelect}
                  selectedFile={selectedFile}
                  onClearFile={handleClearFile}
                />
              )}

              {currentStep === 3 && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center space-y-4">
                      <div className="flex items-center justify-center space-x-3">
                        <TrendingUp className="h-12 w-12 text-primary" />
                        <h3 className="text-2xl font-bold">Ready to Analyze</h3>
                      </div>
                      <p className="text-muted-foreground">
                        Your business information and financial data are ready for analysis.
                      </p>
                      <div className="space-y-2">
                        <p className="text-sm"><strong>Business:</strong> {formData.businessName}</p>
                        <p className="text-sm"><strong>Industry:</strong> {formData.industry}</p>
                        <p className="text-sm"><strong>File:</strong> {selectedFile?.name}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Navigation Buttons */}
          {!loading && (
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                Previous
              </Button>

              <div className="flex space-x-3">
                {currentStep === 2 && (
                  <Button variant="outline" onClick={downloadSample}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Sample
                  </Button>
                )}

                {currentStep < 3 ? (
                  <Button onClick={nextStep} disabled={!canProceed()}>
                    Next Step
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={!canProceed()}>
                    Upload & Analyze
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Help Section */}
          <Card>
            <CardHeader>
              <CardTitle>File Format Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Required Columns:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>• <strong>month:</strong> Date (YYYY-MM format)</div>
                  <div>• <strong>revenue:</strong> Total revenue</div>
                  <div>• <strong>cogs:</strong> Cost of goods sold</div>
                  <div>• <strong>operating_expense:</strong> Operating expenses</div>
                  <div>• <strong>ar:</strong> Accounts receivable</div>
                  <div>• <strong>ap:</strong> Accounts payable</div>
                  <div>• <strong>inventory:</strong> Inventory value</div>
                  <div>• <strong>loan_emi:</strong> Loan EMI payments</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Data Requirements:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Minimum 6 months of data recommended</li>
                  <li>• Maximum 24 months supported</li>
                  <li>• All monetary values in same currency</li>
                  <li>• No missing months in the sequence</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
