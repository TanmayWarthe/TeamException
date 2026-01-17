import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { FiDroplet, FiClock, FiCheckCircle, FiPlus, FiActivity, FiX } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api.service';

const PatientDashboard = () => {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState([]);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    completedRequests: 0,
  });

  useEffect(() => {
    if (currentUser?.uid) {
      fetchRequests();
    }
  }, [currentUser]);

  const fetchRequests = async () => {
    if (!currentUser?.uid) return;

    setLoading(true);
    try {
      const response = await apiService.get(`/requests/my/${currentUser.uid}`);
      const apiData = response.data || [];
      setRequests(apiData);

      // Calculate stats from real data
      const total = apiData.length;
      const pending = apiData.filter(r => r.status === 'PENDING').length;
      const completed = apiData.filter(r => ['FULFILLED', 'MATCHED'].includes(r.status)).length;
      setStats({ totalRequests: total, pendingRequests: pending, completedRequests: completed });

    } catch (error) {
      console.error('Error fetching requests:', error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const RequestForm = ({ onSuccess }) => {
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
      bloodGroup: '',
      quantity: 1,
      urgency: 'NORMAL',
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!currentUser?.uid) {
        alert("You must be logged in");
        return;
      }

      setSubmitting(true);
      try {
        await apiService.post(`/requests?uid=${currentUser.uid}`, {
          bloodGroup: formData.bloodGroup,
          unitsRequired: Number(formData.quantity),
          urgency: formData.urgency,
        });
        alert('Request submitted successfully!');
        onSuccess();

      } catch (error) {
        console.error('Failed to submit request', error);
        alert('Error submitting request. Please try again.');
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-xs font-medium text-gray-700 uppercase tracking-wide mb-2">Blood Group *</label>
            <div className="relative">
              <select
                value={formData.bloodGroup}
                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                className="input-field w-full appearance-none"
                required
              >
                <option value="">Select Group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 uppercase tracking-wide mb-2">Quantity (Units) *</label>
            <input
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
              className="input-field w-full"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 uppercase tracking-wide mb-2">Urgency *</label>
            <div className="relative">
              <select
                value={formData.urgency}
                onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                className="input-field w-full appearance-none"
                required
              >
                <option value="NORMAL">Normal</option>
                <option value="EMERGENCY">Emergency</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary px-6"
          >
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[80vh] flex items-center justify-center bg-bg-soft">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-primary rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-500 font-medium mt-4">Loading Dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-bg-soft min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-display font-bold text-gray-900">Patient Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Welcome, {currentUser?.name || currentUser?.email || 'Patient'}!
              </p>
            </div>
            <button
              onClick={() => setShowRequestForm(!showRequestForm)}
              className={`btn-primary flex items-center gap-2 ${showRequestForm ? 'bg-gray-700 hover:bg-gray-800' : ''}`}
            >
              {showRequestForm ? <FiX /> : <FiPlus />}
              <span>{showRequestForm ? 'Cancel' : 'New Request'}</span>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <StatCard
              icon={<FiActivity className="text-2xl text-blue-600" />}
              label="Total Requests"
              value={stats.totalRequests}
              unit="requests made"
              color="blue"
            />
            <StatCard
              icon={<FiClock className="text-2xl text-yellow-600" />}
              label="Pending"
              value={stats.pendingRequests}
              unit="awaiting match"
              color="yellow"
            />
            <StatCard
              icon={<FiCheckCircle className="text-2xl text-green-600" />}
              label="Fulfilled"
              value={stats.completedRequests}
              unit="successful"
              color="green"
            />
          </div>

          {/* Request Form */}
          {showRequestForm && (
            <div className="card-minimal p-6 mb-8 animate-fade-in relative overflow-hidden bg-white/50 border-primary/20">
              <h2 className="text-xl font-display font-bold text-gray-900 mb-6">New Blood Request</h2>
              <RequestForm
                onSuccess={() => {
                  setShowRequestForm(false);
                  fetchRequests();
                }}
              />
            </div>
          )}

          {/* Request List */}
          <div className="card-minimal p-6">
            <h2 className="text-lg font-display font-semibold text-gray-900 mb-6 border-b border-gray-100 pb-4">My Requests</h2>
            <div className="space-y-4">
              {requests.length > 0 ? (
                requests.map(request => <RequestItem key={request.id} request={request} />)
              ) : (
                <div className="text-center py-12">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FiActivity className="text-xl text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">No requests yet</p>
                  <p className="text-xs text-gray-400 mt-1">Create a request to find donors.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

// --- Sub-components for better organization ---

const StatCard = ({ icon, label, value, unit, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    red: 'bg-red-50 text-red-600 border-red-100',
  };

  return (
    <div className="card-minimal p-6 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`p-3 rounded-xl border ${colorClasses[color]}`}>{icon}</div>
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-display font-bold text-gray-900">{value}</p>
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{unit}</span>
        </div>
      </div>
    </div>
  );
};

const RequestItem = ({ request }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2.5 py-1 text-xs font-bold text-yellow-700 bg-yellow-50 rounded-full border border-yellow-100">Pending</span>;
      case 'FULFILLED':
        return <span className="px-2.5 py-1 text-xs font-bold text-green-700 bg-green-50 rounded-full border border-green-100">Completed</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-1 text-xs font-bold text-red-700 bg-red-50 rounded-full border border-red-100">Cancelled</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-bold text-gray-700 bg-gray-50 rounded-full border border-gray-200">{status}</span>;
    }
  };

  return (
    <div className="border border-gray-100 rounded-lg p-5 hover:border-gray-300 transition-colors bg-white">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xl font-display font-bold text-gray-900">{request.bloodGroup}</span>
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded border border-gray-200">
              {request.quantity} Unit{request.quantity > 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-xs text-gray-500 flex items-center gap-2">
            <FiClock className="text-[10px]" />
            {new Date(request.requestedAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {getStatusBadge(request.status)}
          <span className={`text-xs font-bold px-2 py-1 rounded border ${request.urgency === 'EMERGENCY'
            ? 'text-red-600 border-red-200 bg-red-50'
            : 'text-gray-500 border-gray-200 bg-gray-50'
            }`}>
            {request.urgency}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
