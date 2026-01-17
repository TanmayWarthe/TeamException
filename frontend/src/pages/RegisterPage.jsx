import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiUser,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiAlertCircle,
  FiCheckCircle,
  FiDroplet,
  FiHeart,
  FiActivity,
  FiUsers,
  FiArrowRight,
  FiArrowLeft
} from 'react-icons/fi'
import { FaGoogle } from 'react-icons/fa'

const RegisterPage = () => {
  const location = useLocation()
  const googleUser = location.state?.googleUser
  const continueRegistration = location.state?.continueRegistration

  const [step, setStep] = useState(continueRegistration ? 2 : 1)
  const [formData, setFormData] = useState({
    email: googleUser?.email || '',
    password: '',
    confirmPassword: '',
    name: googleUser?.displayName || '',
    role: 'donor',
    phone: '',
    bloodType: '',
    rhFactor: '',
    dateOfBirth: '',
    disease: '',
    address: '',
    city: '',
    state: '',
    hospitalName: '',
    licenseNumber: ''
  })
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const { register } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (formData.password) {
      calculatePasswordStrength(formData.password)
    }
  }, [formData.password])

  useEffect(() => { }, [])

  const calculatePasswordStrength = (password) => {
    let strength = 0
    if (password.length >= 8) strength += 25
    if (/[A-Z]/.test(password)) strength += 25
    if (/[0-9]/.test(password)) strength += 25
    if (/[^A-Za-z0-9]/.test(password)) strength += 25
    setPasswordStrength(strength)
  }

  const validateEmail = (email) => {
    if (!email.trim()) return 'Email is required'
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/
    if (!emailRegex.test(email)) return 'Please enter a valid email address'
    return ''
  }

  const validatePassword = (password) => {
    if (!password) return 'Password is required'
    if (password.length < 8) return 'Password must be at least 8 characters'
    if (passwordStrength < 50) return 'Password is too weak'
    return ''
  }

  const validatePhone = (phone) => {
    if (!phone.trim()) return 'Phone number is required'
    // Indian phone number: starts with 6-9, exactly 10 digits
    const phoneRegex = /^[6-9]\d{9}$/
    const cleanPhone = phone.replace(/[-() s]/g, '')
    if (!phoneRegex.test(cleanPhone)) return 'Enter valid Indian phone number (10 digits, starting with 6-9)'
    return ''
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    // Clear field error when user types
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }))
    }
    if (error) setError('')
  }

  const validateStep1 = () => {
    const errors = {}

    if (!googleUser) {
      const emailErr = validateEmail(formData.email)
      if (emailErr) errors.email = emailErr

      const passwordErr = validatePassword(formData.password)
      if (passwordErr) errors.password = passwordErr

      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match'
      }
    }

    if (!formData.name.trim()) errors.name = 'Name is required'

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validateStep2 = () => {
    const errors = {}

    // Phone validation for all roles
    const phoneErr = validatePhone(formData.phone)
    if (phoneErr) errors.phone = phoneErr

    if (formData.role === 'donor' || formData.role === 'patient') {
      if (!formData.bloodType) errors.bloodType = 'Blood type is required'
      if (!formData.dateOfBirth) errors.dateOfBirth = 'Date of birth is required'

      // Rh factor required for donors only
      if (formData.role === 'donor' && !formData.rhFactor) {
        errors.rhFactor = 'Rh factor is required'
      }

      // Disease required for patients only
      if (formData.role === 'patient' && !formData.disease) {
        errors.disease = 'Please select a disease'
      }
    }

    if (formData.role === 'hospital') {
      if (!formData.hospitalName.trim()) errors.hospitalName = 'Hospital name is required'
      if (!formData.licenseNumber.trim()) errors.licenseNumber = 'License number is required'
      if (!formData.address.trim()) errors.address = 'Address is required'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2)
    }
  }

  const handleBack = () => {
    setStep(1)
    setError('')
    setFieldErrors({})
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateStep2()) return

    setLoading(true)
    setError('')

    try {
      const userData = {
        name: formData.name,
        role: formData.role,
        phone: formData.phone
      }

      if (formData.role === 'donor' || formData.role === 'patient') {
        userData.bloodType = formData.bloodType
        userData.dateOfBirth = formData.dateOfBirth
        if (formData.role === 'donor' && formData.rhFactor) {
          userData.rhFactor = formData.rhFactor
        }
        if (formData.role === 'patient' && formData.disease) {
          userData.disease = formData.disease
        }
        if (formData.address) userData.address = formData.address
        if (formData.city) userData.city = formData.city
        if (formData.state) userData.state = formData.state
      }

      if (formData.role === 'hospital') {
        userData.hospitalName = formData.hospitalName
        userData.licenseNumber = formData.licenseNumber
        userData.address = formData.address
        if (formData.city) userData.city = formData.city
        if (formData.state) userData.state = formData.state
      }

      const userCred = await register(formData.email, formData.password, userData)
      localStorage.setItem('userRole', formData.role)

      // Post-Registration: Save detailed profile to backend
      const uid = userCred.user.uid;

      try {
        if (formData.role === 'donor') {
          await fetch(`http://localhost:8080/api/donors/register?uid=${uid}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: formData.name,
              bloodGroup: formData.bloodType, // Backend expects bloodGroup
              rhFactor: formData.rhFactor,
              dob: formData.dateOfBirth,
              phone: formData.phone,
              address: formData.address,
              // Location (lat/lng) would go here if we had it
            })
          });
        }
        // Similar calls for Patient/Hospital can be added here or handled by separate endpoints
      } catch (backendError) {
        console.error("Failed to save detailed profile", backendError);
        // Optionally warn user, but account is created
      }


      switch (formData.role) {
        case 'donor':
          navigate('/donor/dashboard')
          break
        case 'hospital':
          navigate('/hospital/dashboard')
          break
        case 'patient':
          navigate('/patient/dashboard')
          break
        default:
          navigate('/')
      }
    } catch (err) {
      console.error('Registration error:', err)

      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please login instead')
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address')
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak')
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error. Please check your internet connection')
      } else {
        setError(err.message || 'Registration failed. Please try again')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setLoading(false)
    setError('Google signup is not configured')
  }

  const getRoleIcon = (role) => {
    switch (role) {
      case 'donor': return <FiHeart className="text-xl" />
      case 'hospital': return <FiActivity className="text-xl" />
      case 'patient': return <FiUsers className="text-xl" />
      default: return <FiUser className="text-xl" />
    }
  }

  const getPasswordStrengthColor = () => {
    if (passwordStrength >= 75) return 'bg-green-500'
    if (passwordStrength >= 50) return 'bg-yellow-500'
    if (passwordStrength >= 25) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const getPasswordStrengthLabel = () => {
    if (passwordStrength >= 75) return 'Strong'
    if (passwordStrength >= 50) return 'Good'
    if (passwordStrength >= 25) return 'Weak'
    return 'Very Weak'
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center gap-2 mb-4">
            <FiDroplet className="text-primary text-2xl" />
            <span className="text-2xl font-bold text-gray-900">
              BloodConnect
            </span>
          </Link>
          <h1 className="text-xl font-semibold text-gray-900">Create Account</h1>
        </div>

        {/* Progress Steps - Simplified */}
        <div className="mb-8 flex justify-center">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className={step >= 1 ? "text-primary font-medium" : ""}>Account</span>
            <span>/</span>
            <span className={step >= 2 ? "text-primary font-medium" : ""}>Details</span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-50 text-red-600 text-sm flex items-center gap-2">
            <FiAlertCircle /> {error}
          </div>
        )}

        {/* Step 1: Account Info */}
        {step === 1 && (
          <div className="animate-fade-in">
            <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary ${fieldErrors.name ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="John Doe"
                />
                {fieldErrors.name && <p className="text-xs text-red-500 mt-1">{fieldErrors.name}</p>}
              </div>

              {!googleUser && (
                <>
                  {/* Email */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary ${fieldErrors.email ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="you@email.com"
                    />
                    {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary ${fieldErrors.password ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Password"
                    />
                    {fieldErrors.password && <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Confirm Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary ${fieldErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Confirm Password"
                    />
                    {fieldErrors.confirmPassword && <p className="text-xs text-red-500 mt-1">{fieldErrors.confirmPassword}</p>}
                  </div>
                </>
              )}

              <button type="submit" className="w-full btn-primary py-2.5 rounded-lg mt-6">Continue</button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500">
              Already have an account? <Link to="/login" className="text-primary font-medium">Log in</Link>
            </div>
          </div>
        )}


        {/* Step 2: Role & Details */}
        {step === 2 && (
          <div className="animate-fade-in">
            <button
              onClick={handleBack}
              className="mb-8 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              <FiArrowLeft /> Back to Account
            </button>

            <h2 className="text-2xl font-display font-bold text-gray-900 mb-6">Choose Your Role</h2>

            {/* Role Selection */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {['donor', 'hospital', 'patient'].map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleChange({ target: { name: 'role', value: role } })}
                  className={`p-4 rounded-xl border transition-all duration-300 ${formData.role === role
                    ? 'bg-primary/5 border-primary text-primary shadow-sm'
                    : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${formData.role === role ? 'bg-primary text-white' : 'bg-gray-100'
                      }`}>
                      {getRoleIcon(role)}
                    </div>
                    <span className="text-sm font-medium capitalize">{role}</span>
                  </div>
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Common Fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">
                  Phone Number *
                </label>
                <div className="relative">
                  <FiPhone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="9876543210"
                    maxLength="10"
                    pattern="[0-9]{10}"
                    onInput={(e) => e.target.value = e.target.value.replace(/[^0-9]/g, '')}
                    className={`input-field pl-11 ${fieldErrors.phone ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                  />
                  {fieldErrors.phone && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1 ml-1">
                      <FiAlertCircle className="text-xs" /> {fieldErrors.phone}
                    </p>
                  )}
                </div>
                <p className="mt-1.5 ml-1 text-xs text-gray-500">Enter 10-digit Indian mobile number</p>
              </div>

              {/* Donor/Patient Fields */}
              {(formData.role === 'donor' || formData.role === 'patient') && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">
                      Blood Type *
                    </label>
                    <select
                      name="bloodType"
                      value={formData.bloodType}
                      onChange={handleChange}
                      className={`input-field appearance-none ${fieldErrors.bloodType ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                    >
                      <option value="">Select Blood Type</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                    {fieldErrors.bloodType && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1 ml-1">
                        <FiAlertCircle className="text-xs" /> {fieldErrors.bloodType}
                      </p>
                    )}
                  </div>

                  {/* Rh Factor Selection - Only for Donors */}
                  {formData.role === 'donor' && (
                    <div className="p-5 bg-gray-50 border border-gray-100 rounded-xl">
                      <label className="block text-sm font-medium text-gray-900 mb-3">Rh Factor *</label>
                      <div className="flex gap-6 mb-3">
                        <label className="flex items-center cursor-pointer group">
                          <input
                            type="radio"
                            name="rhFactor"
                            value="positive"
                            checked={formData.rhFactor === 'positive'}
                            onChange={handleChange}
                            className="w-4 h-4 text-primary border-gray-300 focus:ring-primary cursor-pointer"
                          />
                          <span className="ml-2 text-sm text-gray-700 group-hover:text-primary transition-colors">Positive (Rh+)</span>
                        </label>
                        <label className="flex items-center cursor-pointer group">
                          <input
                            type="radio"
                            name="rhFactor"
                            value="negative"
                            checked={formData.rhFactor === 'negative'}
                            onChange={handleChange}
                            className="w-4 h-4 text-primary border-gray-300 focus:ring-primary cursor-pointer"
                          />
                          <span className="ml-2 text-sm text-gray-700 group-hover:text-primary transition-colors">Negative (Rh-)</span>
                        </label>
                      </div>
                      {fieldErrors.rhFactor && (
                        <p className="mb-2 text-sm text-red-600 flex items-center gap-1">
                          <FiAlertCircle className="text-xs" /> {fieldErrors.rhFactor}
                        </p>
                      )}
                      <div className="mt-2 text-xs text-gray-500 leading-relaxed">
                        <strong>Note:</strong> Rh blood group system consists of 49 defined blood group antigens.
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">
                      Date of Birth *
                    </label>
                    <div className="relative">
                      <FiCalendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleChange}
                        className={`input-field pl-11 ${fieldErrors.dateOfBirth ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                      />
                      {fieldErrors.dateOfBirth && (
                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1 ml-1">
                          <FiAlertCircle className="text-xs" /> {fieldErrors.dateOfBirth}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Disease Field - Only for Patients */}
                  {formData.role === 'patient' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">
                        Disease/Condition *
                      </label>
                      <select
                        name="disease"
                        value={formData.disease}
                        onChange={handleChange}
                        className={`input-field px-4 py-3 bg-white border ${fieldErrors.disease ? 'border-red-500 ring-1 ring-red-500' : ''
                          }`}
                      >
                        <option value="">Select Disease/Condition</option>
                        <option value="Thalassemia">Thalassemia</option>
                        <option value="Sickle Cell Disease">Sickle Cell Disease</option>
                        <option value="Hemophilia">Hemophilia</option>
                        <option value="Anemia">Anemia</option>
                        <option value="Cancer">Cancer</option>
                        <option value="Surgery">Surgery</option>
                        <option value="Accident/Trauma">Accident/Trauma</option>
                        <option value="Pregnancy Complications">Pregnancy Complications</option>
                        <option value="Liver Disease">Liver Disease</option>
                        <option value="Kidney Disease">Kidney Disease</option>
                        <option value="Other">Other</option>
                      </select>
                      {fieldErrors.disease && (
                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1 ml-1">
                          <FiAlertCircle className="text-xs" /> {fieldErrors.disease}
                        </p>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">
                      Address (Optional)
                    </label>
                    <div className="relative">
                      <FiMapPin className="absolute left-4 top-4 text-gray-400" />
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Enter your address"
                        rows="2"
                        className="input-field pl-11"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Hospital Fields */}
              {formData.role === 'hospital' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">
                      Hospital Name *
                    </label>
                    <input
                      type="text"
                      name="hospitalName"
                      value={formData.hospitalName}
                      onChange={handleChange}
                      placeholder="Hospital Name"
                      className={`input-field ${fieldErrors.hospitalName ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                    />
                    {fieldErrors.hospitalName && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1 ml-1">
                        <FiAlertCircle className="text-xs" /> {fieldErrors.hospitalName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">
                      License Number *
                    </label>
                    <input
                      type="text"
                      name="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={handleChange}
                      placeholder="License Number"
                      className={`input-field ${fieldErrors.licenseNumber ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                    />
                    {fieldErrors.licenseNumber && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1 ml-1">
                        <FiAlertCircle className="text-xs" /> {fieldErrors.licenseNumber}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">
                      Hospital Address *
                    </label>
                    <div className="relative">
                      <FiMapPin className="absolute left-4 top-4 text-gray-400" />
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Enter hospital address"
                        rows="2"
                        className={`input-field pl-11 ${fieldErrors.address ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                      />
                      {fieldErrors.address && (
                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1 ml-1">
                          <FiAlertCircle className="text-xs" /> {fieldErrors.address}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-4 mt-6 text-lg shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    Complete Registration
                    <FiCheckCircle />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

export default RegisterPage
