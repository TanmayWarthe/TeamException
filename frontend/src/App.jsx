import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import LandingPage from './pages/LandingPage'
import DonorDashboard from './pages/DonorDashboard'
import HospitalDashboard from './pages/HospitalDashboard'
import PatientDashboard from './pages/PatientDashboard'
import Profile from './pages/Profile'
import RegisterPage from './pages/RegisterPage'
import LoginPage from './pages/LoginPage'
import MapPage from './pages/MapPage'
import DonationHistory from './pages/DonationHistory'
import RequestHistory from './pages/RequestHistory'

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/history" element={<DonationHistory />} />
          <Route path="/requests" element={<RequestHistory />} />
          <Route path="/donor/dashboard" element={<DonorDashboard />} />
          <Route path="/hospital/dashboard" element={<HospitalDashboard />} />
          <Route path="/patient/dashboard" element={<PatientDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App

