import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

function UploadPage() {
  const [formData, setFormData] = useState({
    businessName: '',
    industry: '',
    language: 'en'
  })
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()

  const industries = [
    'Retail',
    'Manufacturing',
    'Services',
    'Technology',
    'Healthcare',
    'Construction',
    'Hospitality',
    'Transportation',
    'Agriculture',
    'Other'
  ]

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError('')
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
      if (!validTypes.includes(selectedFile.type)) {
        setError('Please upload a CSV or Excel file')
        return
      }
      setFile(selectedFile)
      setError('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!formData.businessName || !formData.industry || !file) {
      setError('Please fill in all fields and select a file')
      return
    }

    setLoading(true)

    try {
      // Step 1: Create business
      const business = await api.createBusiness({
        name: formData.businessName,
        industry: formData.industry,
        language: formData.language
      })

      // Step 2: Upload file
      await api.uploadFile(business.id, file)

      // Step 3: Analyze business
      await api.analyzeBusiness(business.id)

      setSuccess('Analysis complete! Redirecting to dashboard...')
      
      // Step 4: Navigate to dashboard
      setTimeout(() => {
        navigate(`/dashboard/${business.id}`)
      }, 1500)

    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h1>Financial Health Assessment</h1>
        <p>Upload your financial data to get a comprehensive health analysis for your SME business.</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="businessName">Business Name *</label>
            <input
              type="text"
              id="businessName"
              name="businessName"
              value={formData.businessName}
              onChange={handleInputChange}
              placeholder="Enter your business name"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="industry">Industry *</label>
            <select
              id="industry"
              name="industry"
              value={formData.industry}
              onChange={handleInputChange}
              disabled={loading}
            >
              <option value="">Select industry</option>
              {industries.map(industry => (
                <option key={industry} value={industry}>
                  {industry}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="language">Language</label>
            <select
              id="language"
              name="language"
              value={formData.language}
              onChange={handleInputChange}
              disabled={loading}
            >
              <option value="en">English</option>
              <option value="hi">हिंदी (Hindi)</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="file">Financial File (CSV/Excel) *</label>
            <input
              type="file"
              id="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              disabled={loading}
            />
            <small style={{ color: '#666', display: 'block', marginTop: '4px' }}>
              Upload a file with columns: month, revenue, cogs, operating_expense, ar, ap, inventory, loan_emi
            </small>
          </div>

          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}

          <button 
            type="submit" 
            className="btn" 
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? (
              <>
                <div className="loading" style={{ marginRight: '8px', display: 'inline-block' }}></div>
                Processing...
              </>
            ) : (
              'Upload & Analyze'
            )}
          </button>
        </form>

        <div className="mt-6">
          <h3>File Format Requirements</h3>
          <p style={{ textAlign: 'left', fontSize: '14px', color: '#666' }}>
            Your file should contain monthly financial data with the following columns:
          </p>
          <ul style={{ textAlign: 'left', fontSize: '14px', color: '#666' }}>
            <li><strong>month:</strong> Date (YYYY-MM format)</li>
            <li><strong>revenue:</strong> Total revenue</li>
            <li><strong>cogs:</strong> Cost of goods sold</li>
            <li><strong>operating_expense:</strong> Operating expenses</li>
            <li><strong>ar:</strong> Accounts receivable</li>
            <li><strong>ap:</strong> Accounts payable</li>
            <li><strong>inventory:</strong> Inventory value</li>
            <li><strong>loan_emi:</strong> Loan EMI payments</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default UploadPage
