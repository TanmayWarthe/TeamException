import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { FiDroplet, FiMail, FiLock, FiAlertCircle, FiArrowRight } from 'react-icons/fi'

const LoginPage = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { login } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!email || !password) {
            return setError("Please enter both email and password")
        }

        try {
            setError('')
            setLoading(true)
            const userCredential = await login(email, password)

            // Fetch role from database
            const uid = userCredential.user.uid
            const response = await fetch(`http://localhost:8080/api/users/${uid}/role`)

            if (response.ok) {
                const data = await response.json()
                const role = data.role // 'donor', 'hospital', or 'patient'

                // Navigate to correct dashboard based on database role
                navigate(`/${role}/dashboard`)
            } else {
                // Fallback if role fetch fails
                setError('Could not determine user role. Please contact support.')
            }

        } catch (err) {
            console.error(err)
            setError('Failed to log in. Please check your credentials.')
        } finally {
            setLoading(false)
        }
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
                    <h1 className="text-xl font-semibold text-gray-900">Welcome Back</h1>
                    <p className="text-sm text-gray-500 mt-1">Sign in to continue to your dashboard</p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-3 rounded-lg bg-red-50 text-red-600 text-sm flex items-center gap-2">
                        <FiAlertCircle /> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Email */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Email Address</label>
                        <div className="relative">
                            <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                                placeholder="you@email.com"
                                required
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
                        <div className="relative">
                            <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                                placeholder="Password"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn-primary py-2.5 rounded-lg mt-2 flex items-center justify-center gap-2"
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                        {!loading && <FiArrowRight />}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-500">
                    Don't have an account? <Link to="/register" className="text-primary font-medium">Create one</Link>
                </div>
            </div>
        </div>
    )
}

export default LoginPage
