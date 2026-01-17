import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { FiDroplet, FiTrendingUp, FiUsers, FiActivity, FiAlertTriangle, FiPlus, FiEdit, FiCheck, FiX } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api.service';

const HospitalDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [inventory, setInventory] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUnits: 0,
    criticalItems: 0,
    activeRequests: 0,
  });

  // Modals
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [editingInventory, setEditingInventory] = useState(null);

  // Form states
  const [inventoryForm, setInventoryForm] = useState({ bloodGroup: 'A+', units: 0 });
  const [requestForm, setRequestForm] = useState({
    bloodGroup: 'A+',
    unitsRequired: 1,
    urgency: 'NORMAL',
    patientName: ''
  });

  useEffect(() => {
    if (currentUser?.uid) {
      fetchDashboardData();
    }
  }, [currentUser]);

  const fetchDashboardData = async () => {
    if (!currentUser?.uid) {
      console.error('No user logged in');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const uid = currentUser.uid;
      const [inventoryRes, requestsRes] = await Promise.allSettled([
        apiService.get(`/inventory/hospital/${uid}`),
        apiService.get(`/requests/pending`),
      ]);

      let totalUnits = 0;
      let criticalItems = 0;

      if (inventoryRes.status === 'fulfilled') {
        const invData = inventoryRes.value.data.map((inv) => {
          const isCritical = inv.unitsAvailable <= 5;
          if (isCritical) criticalItems++;
          totalUnits += inv.unitsAvailable;
          return { ...inv, isCritical };
        });
        setInventory(invData);
      } else {
        setInventory([]);
      }

      if (requestsRes.status === 'fulfilled') {
        const rawRequests = requestsRes.value.data || [];
        setRequests(rawRequests);
        setStats((prev) => ({ ...prev, activeRequests: rawRequests.filter(r => r.status === 'PENDING').length }));
      } else {
        setRequests([]);
      }

      setStats((prev) => ({ ...prev, totalUnits, criticalItems }));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setInventory([]);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateInventory = async (e) => {
    e.preventDefault();
    try {
      await apiService.post(`/inventory/hospital/${currentUser.uid}/update`, null, {
        params: {
          bloodGroup: inventoryForm.bloodGroup,
          units: parseInt(inventoryForm.units)
        }
      });
      setShowInventoryModal(false);
      setInventoryForm({ bloodGroup: 'A+', units: 0 });
      fetchDashboardData();
      alert('Inventory updated successfully!');
    } catch (error) {
      console.error('Error updating inventory:', error);
      alert(error.response?.data?.message || 'Failed to update inventory');
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    try {
      await apiService.post(`/requests/hospital/${currentUser.uid}`, {
        bloodGroup: requestForm.bloodGroup,
        unitsRequired: parseInt(requestForm.unitsRequired),
        urgency: requestForm.urgency,
        patientName: requestForm.patientName || 'Hospital Request'
      });
      setShowRequestModal(false);
      setRequestForm({ bloodGroup: 'A+', unitsRequired: 1, urgency: 'NORMAL', patientName: '' });
      fetchDashboardData();
      alert('Blood request created successfully!');
    } catch (error) {
      console.error('Error creating request:', error);
      alert('Failed to create request');
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await apiService.post(`/donations/hospital/${currentUser.uid}/accept/${requestId}`);
      alert('Request fulfilled successfully!');
      fetchDashboardData();
    } catch (error) {
      console.error('Error accepting request:', error);
      alert(error.response?.data?.message || 'Failed to fulfill request');
    }
  };

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const urgencyLevels = ['NORMAL', 'CRITICAL', 'EMERGENCY'];

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
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-gray-900">Hospital Dashboard</h1>
            <p className="text-gray-500 mt-1">Manage inventory and blood requests</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowInventoryModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <FiPlus /> Update Inventory
            </button>
            <button
              onClick={() => setShowRequestModal(true)}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <FiDroplet /> Create Request
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Blood Units</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUnits}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <FiDroplet className="text-2xl text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Critical Items</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{stats.criticalItems}</p>
              </div>
              <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                <FiAlertTriangle className="text-2xl text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Active Requests</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeRequests}</p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <FiActivity className="text-2xl text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Blood Inventory</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Blood Group</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Units Available</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {inventory.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                      No inventory data. Click "Update Inventory" to add blood units.
                    </td>
                  </tr>
                ) : (
                  inventory.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{item.bloodGroup}</td>
                      <td className="px-6 py-4 text-gray-700">{item.unitsAvailable} units</td>
                      <td className="px-6 py-4">
                        {item.isCritical ? (
                          <span className="px-3 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                            Critical
                          </span>
                        ) : (
                          <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                            Available
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Blood Requests</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Blood Group</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Units</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Urgency</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      No requests yet.
                    </td>
                  </tr>
                ) : (
                  requests.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{req.patientName || 'N/A'}</td>
                      <td className="px-6 py-4 text-gray-700">{req.bloodGroup}</td>
                      <td className="px-6 py-4 text-gray-700">{req.unitsRequired}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${req.urgency === 'EMERGENCY' ? 'bg-red-100 text-red-700' :
                          req.urgency === 'CRITICAL' ? 'bg-orange-100 text-orange-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                          {req.urgency}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${req.status === 'FULFILLED' ? 'bg-green-100 text-green-700' :
                          req.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                          {req.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Inventory Modal */}
        {showInventoryModal && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Update Inventory</h3>
              <form onSubmit={handleUpdateInventory}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Blood Group</label>
                  <select
                    value={inventoryForm.bloodGroup}
                    onChange={(e) => setInventoryForm({ ...inventoryForm, bloodGroup: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    {bloodGroups.map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Units to Add</label>
                  <input
                    type="number"
                    min="1"
                    value={inventoryForm.units}
                    onChange={(e) => setInventoryForm({ ...inventoryForm, units: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowInventoryModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 btn-primary"
                  >
                    Update
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Request Modal */}
        {showRequestModal && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Create Blood Request</h3>
              <form onSubmit={handleCreateRequest}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Blood Group</label>
                  <select
                    value={requestForm.bloodGroup}
                    onChange={(e) => setRequestForm({ ...requestForm, bloodGroup: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    {bloodGroups.map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Units Required</label>
                  <input
                    type="number"
                    min="1"
                    value={requestForm.unitsRequired}
                    onChange={(e) => setRequestForm({ ...requestForm, unitsRequired: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Urgency</label>
                  <select
                    value={requestForm.urgency}
                    onChange={(e) => setRequestForm({ ...requestForm, urgency: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    {urgencyLevels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Patient Name (Optional)</label>
                  <input
                    type="text"
                    value={requestForm.patientName}
                    onChange={(e) => setRequestForm({ ...requestForm, patientName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Enter patient name"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowRequestModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                  >
                    Create Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default HospitalDashboard;
