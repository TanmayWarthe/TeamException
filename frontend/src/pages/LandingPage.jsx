import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { FiDroplet, FiActivity, FiMapPin, FiShield, FiTrendingUp, FiClock, FiHeart, FiUsers, FiBarChart2 } from 'react-icons/fi'
import AuthModal from '../components/AuthModal'

function LandingPage() {
  const { currentUser } = useAuth()
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState('login') // 'login' or 'register'

  const getDashboardPath = () => {
    if (!currentUser) return '/login'

    const role = currentUser.role?.toLowerCase()
    const validRoles = ['donor', 'hospital', 'patient', 'admin']

    if (role && validRoles.includes(role)) {
      return `/${role}/dashboard`
    }

    return '/donor/dashboard' // default fallback
  }

  const openAuthModal = (mode) => {
    setAuthMode(mode)
    setAuthModalOpen(true)
  }

  const features = [
    {
      icon: <FiTrendingUp />,
      title: "Future Blood Shortage Radar",
      description: "AI predicts critical blood groups 3-7 days in advance.",
      color: "text-primary"
    },
    {
      icon: <FiShield />,
      title: "Donor Health & Safety Score",
      description: "Intelligent health monitoring prevents over-donation.",
      color: "text-primary"
    },
    {
      icon: <FiMapPin />,
      title: "Emergency Radius Expansion",
      description: "Dynamic search radius adjustment during emergencies.",
      color: "text-primary"
    },
    {
      icon: <FiActivity />,
      title: "Silent Pre-Matching",
      description: "Non-emergency donor matching happens in background.",
      color: "text-primary"
    },
    {
      icon: <FiClock />,
      title: "Recurring Patient Planner",
      description: "AI learns individual patient transfusion patterns.",
      color: "text-primary"
    },
    {
      icon: <FiBarChart2 />,
      title: "Wastage Prevention",
      description: "Identify blood units nearing expiry to minimize loss.",
      color: "text-primary"
    }
  ]

  const stats = [
    { value: "12K+", label: "Lives Impacted" },
    { value: "98%", label: "Match Accuracy" },
    { value: "24/7", label: "Real-time Ops" },
    { value: "<1min", label: "Response" }
  ]

  return (
    <div className="min-h-screen bg-bg-soft font-sans selection:bg-primary/10 selection:text-primary">
      {/* Header */}
      <header className="fixed w-full top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <FiDroplet className="text-white text-xl" />
              </div>
              <span className="text-2xl font-display font-bold text-gray-900 tracking-tight">
                BloodConnect
              </span>
            </div>

            <div className="flex items-center gap-4">
              {currentUser ? (
                <Link
                  to={getDashboardPath()}
                  className="btn-primary py-2 px-5 text-sm"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <button
                    onClick={() => openAuthModal('login')}
                    className="text-gray-600 hover:text-gray-900 font-medium px-4 py-2 transition-colors duration-200"
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => openAuthModal('register')}
                    className="btn-primary py-2 px-6 text-sm"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Subtle geometric background instead of blobs */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]"></div>

        <div className="max-w-6xl mx-auto px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-50 border border-red-100 mb-8 animate-fade-in-up">
            <FiHeart className="text-primary text-sm" />
            <span className="text-sm font-medium text-primary tracking-wide">AI-Powered Blood Management</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-display font-bold mb-8 leading-[1.1] text-gray-900 tracking-tight">
            Save Lives with <br />
            <span className="text-primary">
              Smart Donation
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed font-light">
            Streamline blood donation with predictive analytics. Intelligent matching for a healthier future.
          </p>

          {!currentUser && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => openAuthModal('register')}
                className="btn-primary text-lg px-8 py-3.5 shadow-xl shadow-primary/10"
              >
                Get Started
              </button>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-24 pt-12 border-t border-gray-100 max-w-4xl mx-auto">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center group">
                <div className="text-4xl font-display font-bold text-gray-900 mb-1 group-hover:text-primary transition-colors">{stat.value}</div>
                <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">
              Intelligent Features
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Advanced technology meeting compassionate care.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div key={idx} className="card-minimal p-8 group hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                  <div className={`text-2xl text-primary group-hover:text-white transition-colors duration-300`}>
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-xl font-display font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden bg-gray-900">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6 tracking-tight">
            Ready to save a life?
          </h2>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto font-light">
            Join the network of heroes. Smart solutions for critical moments.
          </p>

          {!currentUser && (
            <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
              <button
                onClick={() => openAuthModal('register')}
                className="px-8 py-3.5 bg-primary text-white font-bold rounded-lg shadow-lg hover:bg-primary-dark transition-all duration-300 flex items-center gap-2"
              >
                <FiUsers className="text-lg" />
                Join Community
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <FiDroplet className="text-white text-sm" />
              </div>
              <span className="text-xl font-display font-bold text-gray-900">
                BloodConnect
              </span>
            </div>

            <div className="text-gray-500 text-sm md:text-right">
              <p>&copy; 2024 BloodConnect AI. Designed for Humanity.</p>
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />
    </div>
  )
}

export default LandingPage