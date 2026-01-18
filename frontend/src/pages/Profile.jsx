import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { FiUser, FiEdit2, FiSave, FiX } from 'react-icons/fi'
import { useAuth } from '../contexts/AuthContext'
import { apiService } from '../services/api.service'

const Profile = () => {
  const { currentUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [profileData, setProfileData] = useState(null)
  const [editData, setEditData] = useState({})

  const userRole = currentUser?.role || 'donor'

  useEffect(() => {
    fetchProfile()
  }, [currentUser])

  const fetchProfile = async () => {
    if (!currentUser?.uid) return

    setLoading(true)
    try {
      let endpoint = ''
      if (userRole === 'donor') {
        endpoint = `/donors/${currentUser.uid}`
      } else if (userRole === 'patient') {
        endpoint = `/patients/${currentUser.uid}`
      } else if (userRole === 'hospital') {
        endpoint = `/hospitals/profile/${currentUser.uid}`
      }

      const response = await apiService.get(endpoint)
      const profile = response.data

      const transformedProfile = {
        fullName: profile.name || profile.hospitalName || currentUser.displayName || currentUser.email?.split('@')[0] || '',
        email: currentUser.email || '',
        exists: true
      }

      setProfileData(transformedProfile)
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('Profile not found - enabling creation mode');
        const emptyProfile = {
          fullName: currentUser.displayName || currentUser.email?.split('@')[0] || '',
          email: currentUser.email || '',
          exists: false
        };
        setProfileData(emptyProfile);
        setEditData(emptyProfile);
        setIsEditing(true);
      } else {
        console.error('Error fetching profile:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
    setEditData({ ...profileData })
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  const handleSave = async () => {
    if (!currentUser?.uid) return;

    setLoading(true);
    try {
      let endpoint = '';
      let isNew = !profileData?.exists;
      let payload = {};

      if (userRole === 'donor') {
        endpoint = isNew ? `/donors/register?uid=${currentUser.uid}` : `/donors/${currentUser.uid}`;
        payload = {
          name: editData.fullName,
        };
      } else if (userRole === 'patient') {
        endpoint = isNew ? `/patients/register?uid=${currentUser.uid}` : `/patients/${currentUser.uid}`;
        payload = {
          name: editData.fullName,
        };
      } else if (userRole === 'hospital') {
        endpoint = isNew ? `/hospitals/register?uid=${currentUser.uid}` : `/hospitals/${currentUser.uid}`;
        payload = {
          hospitalName: editData.fullName,
        };
      }

      if (isNew) {
        await apiService.post(endpoint, payload);
      } else {
        await apiService.put(endpoint, payload);
      }

      await fetchProfile();
      setIsEditing(false);
      alert('Profile saved successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }))
  }

  if (loading && !profileData) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-primary rounded-full animate-spin"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-2">Manage your personal information</p>
        </div>

        {/* Profile Card */}
        <div className="card-minimal overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gray-50 border-b border-gray-100 p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                    <span className="text-2xl font-bold text-primary">
                      {profileData?.fullName?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-display font-bold text-gray-900">
                    {profileData?.fullName || 'Complete Your Profile'}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium capitalize border border-gray-200">
                      {userRole}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                {!isEditing ? (
                  <button
                    onClick={handleEdit}
                    className="btn-secondary py-2 px-4 text-sm flex items-center gap-2"
                  >
                    <FiEdit2 className="text-sm" />
                    Edit Profile
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="btn-primary py-2 px-4 text-sm flex items-center gap-2 disabled:opacity-50"
                    >
                      <FiSave className="text-sm" />
                      Save
                    </button>
                    <button
                      onClick={handleCancel}
                      className="btn-secondary py-2 px-4 text-sm flex items-center gap-2"
                    >
                      <FiX className="text-sm" />
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="p-6">
            <div className="card-minimal p-6">
              <h3 className="text-lg font-display font-semibold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
                <FiUser className="text-primary" />
                Personal Information
              </h3>

              <div className="space-y-5">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 block">
                    {userRole === 'hospital' ? 'Hospital Name' : 'Full Name'}
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.fullName || ''}
                      onChange={(e) => handleChange('fullName', e.target.value)}
                      className="input-field py-2"
                      placeholder={userRole === 'hospital' ? 'Enter hospital name' : 'Enter your full name'}
                    />
                  ) : (
                    <p className="text-gray-900 text-sm">{profileData?.fullName || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 block">Email Address</label>
                  <p className="text-gray-700 text-sm">{profileData?.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Profile