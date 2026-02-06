import { Routes, Route, Navigate } from 'react-router-dom'
import UploadPage from './pages/UploadPage'
import DashboardPage from './pages/DashboardPage'
import ReportPage from './pages/ReportPage'

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<UploadPage />} />
        <Route path="/dashboard/:businessId" element={<DashboardPage />} />
        <Route path="/report/:businessId" element={<ReportPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App
