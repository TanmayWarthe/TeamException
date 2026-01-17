import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { FiDroplet, FiTrendingUp, FiTrendingDown, FiUsers, FiActivity, FiAlertTriangle, FiPlus } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api.service';

const HOSPITAL_ID = 1;

const HospitalDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [inventory, setInventory] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUnits: 0,
    criticalItems: 0,
    activeRequests: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [inventoryRes, requestsRes, aiRes] = await Promise.allSettled([
        apiService.get(`/hospital/inventory/${HOSPITAL_ID}`),
        apiService.get(`/blood/requests/hospital/${HOSPITAL_ID}`),
        apiService.get(`/ai/predictions/${HOSPITAL_ID}`),
      ]);

      let totalUnits = 0;
      let criticalItems = 0;
      if (inventoryRes.status === 'fulfilled') {
        const invData = inventoryRes.value.data.map((inv) => {
          const isCritical = inv.quantity <= 5;
          if (isCritical) criticalItems++;
          totalUnits += inv.quantity;
          return { ...inv, units: inv.quantity, isCritical };
        });
        setInventory(invData);
      }

      if (requestsRes.status === 'fulfilled') {
        const rawRequests = requestsRes.value.data || [];
        setRequests(rawRequests);
        setStats((prev) => ({ ...prev, activeRequests: rawRequests.length }));
      }

      if (aiRes.status === 'fulfilled') {
        const rawPredictions = aiRes.value.data || [];
        const mappedPredictions = rawPredictions.map((pred) => ({
          id: pred.id,
          bloodGroup: pred.bloodGroup,
          riskLevel: pred.predictionType === 'DEMAND_SHORTAGE' ? 'HIGH' : 'MEDIUM',
          predictionText: pred.recommendation || 'AI prediction available',
          confidence: pred.confidence || 0,
        }));
        setPredictions(mappedPredictions);
      }

      setStats((prev) => ({ ...prev, totalUnits, criticalItems }));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setInventory([]);
      setPredictions([]);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend) => {
    if (trend > 0) return <FiTrendingUp className="text-green-500" />;
    if (trend < 0) return <FiTrendingDown className="text-red-500" />;
    return <FiActivity className="text-gray-400" />;
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
              <h1 className="text-3xl font-display font-bold text-gray-900">Hospital Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Overview for {currentUser?.hospitalName || currentUser?.email || 'Hospital'}
              </p>
            </div>
            <button
              onClick={() => navigate('/hospital/requests')}
              className="btn-primary flex items-center gap-2"
            >
              <FiPlus />
              <span>Manage Requests</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <StatCard
              icon={<FiDroplet className="text-2xl text-blue-600" />}
              label="Total Blood Units"
              value={stats.totalUnits}
              unit="units in stock"
              color="blue"
            />
            <StatCard
              icon={<FiAlertTriangle className="text-2xl text-red-600" />}
              label="Critical Inventory"
              value={stats.criticalItems}
              unit="blood types low"
              color="red"
            />
            <StatCard
              icon={<FiActivity className="text-2xl text-yellow-600" />}
              label="Active Requests"
              value={stats.activeRequests}
              unit="requests pending"
              color="yellow"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="card-minimal p-6">
                <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
                  <h2 className="text-lg font-display font-semibold text-gray-900">Inventory Status</h2>
                  <span className="text-sm text-primary font-medium cursor-pointer hover:underline">View All</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {inventory.length > 0 ? inventory.map((item) => (
                    <div key={item.bloodGroup} className={`rounded-xl p-4 border transition-all duration-200 hover:shadow-sm ${item.isCritical ? 'bg-red-50 border-red-100' : 'bg-white border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-display font-bold text-lg text-gray-900">{item.bloodGroup}</span>
                        {getTrendIcon(item.trend)}
                      </div>
                      <div className="flex items-baseline gap-1">
                        <p className={`text-2xl font-bold ${item.isCritical ? 'text-red-700' : 'text-gray-900'}`}>{item.units}</p>
                        <p className="text-xs text-gray-500">units</p>
                      </div>

                      {item.isCritical && (
                        <div className="flex items-center gap-1 mt-2 text-xs font-semibold text-red-600">
                          <FiAlertTriangle /> Low Stock
                        </div>
                      )}
                    </div>
                  )) : (
                    <div className="col-span-full text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                      <FiDroplet className="text-4xl text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">No inventory data available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="card-minimal p-6 h-full">
                <h2 className="text-lg font-display font-semibold text-gray-900 mb-6 border-b border-gray-100 pb-4">Active Requests</h2>
                <ul className="space-y-4">
                  {requests.length > 0 ? requests.map((req) => (
                    <li key={req.id} className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-gray-900 text-sm">{req.quantity} units of {req.bloodGroup}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${req.urgency === 'EMERGENCY'
                            ? 'bg-red-50 text-red-700 border-red-100'
                            : 'bg-blue-50 text-blue-700 border-blue-100'
                          }`}>
                          {req.urgency}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-gray-500">Status: <span className="font-medium text-gray-700">{req.status}</span></p>
                        <button className="text-xs font-medium text-primary hover:text-primary-dark hover:underline">Details</button>
                      </div>
                    </li>
                  )) : (
                    <div className="text-center py-10">
                      <p className="text-gray-400 text-sm">No active blood requests.</p>
                    </div>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {predictions.length > 0 && (
            <div className="mt-8 card-minimal p-6">
              <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                  <FiActivity className="text-xl" />
                </div>
                <div>
                  <h2 className="text-lg font-display font-semibold text-gray-900">AI Predictions</h2>
                  <p className="text-sm text-gray-500">Inventory optimization insights</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {predictions.map((pred) => (
                  <div key={pred.id} className={`rounded-xl p-5 border ${pred.riskLevel === 'HIGH' ? 'bg-orange-50/50 border-orange-100' : 'bg-yellow-50/50 border-yellow-100'}`}>
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-bold text-gray-800 text-lg">{pred.bloodGroup}</span>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${pred.riskLevel === 'HIGH' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {pred.riskLevel} Risk
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2 mb-3 leading-relaxed">{pred.predictionText}</p>
                    <div className="flex items-center gap-2 pt-2 border-t border-black/5">
                      <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${pred.confidence * 100}%` }}></div>
                      </div>
                      <span className="text-xs font-medium text-gray-500">{(pred.confidence * 100).toFixed(0)}% Conf.</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </Layout>
  );
};


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

export default HospitalDashboard;
