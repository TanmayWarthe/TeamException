import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { FiDroplet, FiClock, FiCheckCircle, FiHeart, FiCalendar, FiUser, FiMapPin, FiActivity } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api.service';

const DONOR_ID = 1;

const DonorDashboard = () => {
  const { currentUser } = useAuth();
  const [availability, setAvailability] = useState('available');
  const [requests, setRequests] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    livesImpacted: 0,
    totalDonations: 0,
    eligibilityDays: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [donationsRes, requestsRes] = await Promise.allSettled([
        // History endpoint not yet implemented, using empty array for now or mock
        // apiService.get(`/donors/history/${DONOR_ID}`),
        Promise.resolve({ data: [] }),
        apiService.get('/requests/pending'),
      ]);

      if (donationsRes.status === 'fulfilled') {
        const rawHistory = donationsRes.value.data || [];
        // ... (Mapping logic remains, though data is empty)
        setHistory([]); // Set empty for now

        setStats({
          livesImpacted: 0,
          totalDonations: 0,
          eligibilityDays: 0,
        });
      }

      if (requestsRes.status === 'fulfilled') {
        const rawRequests = requestsRes.value.data || [];
        const mappedRequests = rawRequests.map((req) => ({
          id: req.id,
          bloodGroup: req.bloodGroup,
          quantity: req.quantity || req.unitsRequired, // Backend uses unitsRequired
          urgency: req.urgency,
          hospitalName: req.hospitalName || 'Local Hospital', // Backend Request has hospitalName
        }));
        setRequests(mappedRequests);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvailabilityChange = async (newStatus) => {
    try {
      setAvailability(newStatus);
      await apiService.put(`/donors/availability/${DONOR_ID}`, null, {
        params: { status: newStatus },
      });
    } catch (error) {
      console.error('Error updating availability:', error);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await apiService.patch(`/blood/requests/${requestId}/status`, { status: 'MATCHED' });
      alert('Request accepted! The hospital will contact you shortly.');
      fetchDashboardData();
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-bg-soft">
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
        {/* Header */}
        <div className="max-w-7xl mx-auto mb-8">
          <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">Donor Dashboard</h1>
          <p className="text-gray-600">
            Welcome back, {currentUser?.name || currentUser?.email || 'Donor'}!
          </p>

          <div className="mt-6 card-minimal p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-50 text-primary">
                <FiDroplet className="text-xl" />
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Blood Type</span>
                <p className="font-display font-bold text-lg text-gray-900">{currentUser?.bloodType || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${availability === 'available' ? 'bg-green-50 text-green-600' :
                availability === 'busy' ? 'bg-yellow-50 text-yellow-600' : 'bg-gray-50 text-gray-600'
                }`}>
                <FiActivity className="text-xl" />
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</span>
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-lg capitalize text-gray-900">{availability}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-50 text-blue-600">
                <FiClock className="text-xl" />
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Next Eligible</span>
                <p className="font-display font-bold text-lg text-gray-900">
                  {stats.eligibilityDays > 0 ? `${stats.eligibilityDays} days` : 'Now'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card-minimal p-6 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-4 rounded-xl bg-red-50 text-red-600">
              <FiHeart className="text-2xl" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Lives Impacted</p>
              <p className="text-3xl font-display font-bold text-gray-900 mt-1">{stats.livesImpacted}</p>
            </div>
          </div>

          <div className="card-minimal p-6 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-4 rounded-xl bg-blue-50 text-blue-600">
              <FiDroplet className="text-2xl" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Donations</p>
              <p className="text-3xl font-display font-bold text-gray-900 mt-1">{stats.totalDonations}</p>
            </div>
          </div>

          <div className="card-minimal p-6 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-4 rounded-xl bg-green-50 text-green-600">
              <FiCalendar className="text-2xl" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Eligibility</p>
              <p className="text-3xl font-display font-bold text-gray-900 mt-1">
                {stats.eligibilityDays > 0 ? `${stats.eligibilityDays}d` : 'Ready'}
              </p>
            </div>
          </div>
        </div>

        {/* Availability */}
        <div className="max-w-7xl mx-auto card-minimal p-6 mb-8">
          <h2 className="text-lg font-display font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Update Availability</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => handleAvailabilityChange('available')}
              className={`p-4 rounded-xl border flex items-center justify-center gap-3 transition-all duration-200 ${availability === 'available'
                ? 'bg-green-50/50 border-green-500 text-green-700'
                : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                }`}
            >
              <FiCheckCircle className={`text-xl ${availability === 'available' ? 'text-green-600' : 'text-gray-400'}`} />
              <span className="font-bold text-sm">Available</span>
            </button>

            <button
              onClick={() => handleAvailabilityChange('busy')}
              className={`p-4 rounded-xl border flex items-center justify-center gap-3 transition-all duration-200 ${availability === 'busy'
                ? 'bg-yellow-50/50 border-yellow-500 text-yellow-700'
                : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                }`}
            >
              <FiClock className={`text-xl ${availability === 'busy' ? 'text-yellow-600' : 'text-gray-400'}`} />
              <span className="font-bold text-sm">Busy</span>
            </button>

            <button
              onClick={() => handleAvailabilityChange('unavailable')}
              className={`p-4 rounded-xl border flex items-center justify-center gap-3 transition-all duration-200 ${availability === 'unavailable'
                ? 'bg-gray-100 border-gray-500 text-gray-700'
                : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                }`}
            >
              <FiClock className={`text-xl ${availability === 'unavailable' ? 'text-gray-600' : 'text-gray-400'}`} />
              <span className="font-bold text-sm">Unavailable</span>
            </button>
          </div>
        </div>

        {/* Content Grid */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Available Requests */}
          <div className="card-minimal h-full">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-display font-bold text-gray-900">Urgent Requests</h2>
            </div>

            <div className="p-6">
              {requests.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FiDroplet className="text-xl text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium text-sm">No urgent requests nearby</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {requests.slice(0, 3).map((req) => (
                    <div key={req.id} className="border border-gray-100 rounded-xl p-5 hover:border-gray-300 transition-colors">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <span className="font-display font-bold text-2xl text-gray-900">{req.bloodGroup}</span>
                          <span className={`ml-3 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${req.urgency === 'EMERGENCY'
                            ? 'bg-red-50 text-red-700 border-red-100'
                            : 'bg-blue-50 text-blue-700 border-blue-100'
                            }`}>
                            {req.urgency}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-gray-500 bg-gray-50 border border-gray-100 px-2 py-1 rounded">{req.quantity} units</span>
                      </div>

                      <div className="flex items-center text-sm text-gray-500 mb-5">
                        <FiMapPin className="mr-2 text-primary" />
                        {req.hospitalName || 'Local Hospital'}
                      </div>

                      <button
                        onClick={() => handleAcceptRequest(req.id)}
                        className="btn-primary w-full py-2 text-sm shadow-none"
                      >
                        Accept Request
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Donation History */}
          <div className="card-minimal h-full">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-display font-bold text-gray-900">History</h2>
            </div>

            <div className="p-6">
              {history.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FiHeart className="text-xl text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium text-sm">No donations yet</p>
                </div>
              ) : (
                <div className="space-y-0">
                  {history.map((donation) => (
                    <div key={donation.id} className="border-b border-gray-50 last:border-b-0 py-4 first:pt-0 last:pb-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-gray-900 text-sm">
                          {donation.hospitalName || 'Donation Center'}
                        </span>
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                          {new Date(donation.date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                        {donation.units} unit{donation.units > 1 ? 's' : ''} • <span className="font-semibold text-gray-700">{donation.bloodGroup}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DonorDashboard;
