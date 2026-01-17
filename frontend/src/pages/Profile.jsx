import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { FiUser, FiMail, FiPhone, FiMapPin, FiCalendar, FiDroplet, FiEdit2, FiSave, FiX, FiCamera, FiShield, FiActivity } from 'react-icons/fi'
import { useAuth } from '../contexts/AuthContext'

const Profile = () => {
  const { currentUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [profileData, setProfileData] = useState(null)

  const userRole = localStorage.getItem('userRole') || 'donor'

  useEffect(() => {
    // Fetch user profile data
    const fetchProfile = async () => {
      setLoading(true)
      try {
        // Simulate API call
        const mockProfile = {
          fullName: currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User',
          email: currentUser?.email || 'user@example.com',
          phone: '+1 (555) 123-4567',
          bloodType: 'O+',
          dateOfBirth: '1990-05-15',
          address: '123 Medical Plaza',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          emergencyContact: '+1 (555) 987-6543',
          emergencyContactName: 'John Doe',
          medicalConditions: 'None',
          allergies: 'None',
          lastDonation: '2024-01-15',
          totalDonations: 12,
          weight: '70 kg',
          height: '175 cm',
          isVerified: true
        }
        setProfileData(mockProfile)
      } catch (error) {
        console.error('Error fetching profile:', error)
      } finally {
        setLoading(false)
      }
    }

    if (currentUser) {
      fetchProfile()
    }
  }, [currentUser])

  const [editData, setEditData] = useState({})

  const handleEdit = () => {
    setIsEditing(true)
    setEditData({ ...profileData })
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      // Simulate API update
      await new Promise(resolve => setTimeout(resolve, 800))
      setProfileData({ ...editData })
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setLoading(false)
    }
  }

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-2">Manage your personal information</p>
        </div>

        {/* Profile Card */}
        <div className="card-minimal overflow-hidden mb-8">
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
                  <button className="absolute bottom-0 right-0 p-1.5 rounded-full bg-white border border-gray-200 text-gray-600 hover:text-primary shadow-sm transition-colors">
                    <FiCamera className="text-xs" />
                  </button>
                </div>

                <div>
                  <h2 className="text-xl font-display font-bold text-gray-900">{profileData?.fullName}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium capitalize border border-gray-200">
                      {userRole}
                    </span>
                    {profileData?.isVerified && (
                      <span className="px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 text-xs font-medium flex items-center gap-1 border border-green-100">
                        <FiShield className="text-xs" />
                        Verified
                      </span>
                    )}
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

          {/* Quick Stats */}
          {userRole === 'donor' && (
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg bg-gray-50 border border-gray-100">
                  <div className="text-2xl font-display font-bold text-primary">{profileData?.bloodType}</div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-1">Blood Type</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-gray-50 border border-gray-100">
                  <div className="text-2xl font-display font-bold text-gray-900">{profileData?.totalDonations}</div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-1">Donations</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-gray-50 border border-gray-100">
                  <div className="text-2xl font-display font-bold text-gray-900">
                    {profileData?.lastDonation ? new Date(profileData.lastDonation).toLocaleDateString() : 'N/A'}
                  </div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-1">Last Date</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-gray-50 border border-gray-100">
                  <div className="text-2xl font-display font-bold text-gray-900">{profileData?.weight}</div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-1">Weight</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Profile Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="card-minimal p-6">
            <h3 className="text-lg font-display font-semibold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
              <FiUser className="text-primary" />
              Personal Information
            </h3>

            <div className="space-y-5">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 block">Full Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.fullName || ''}
                    onChange={(e) => handleChange('fullName', e.target.value)}
                    className="input-field py-2"
                  />
                ) : (
                  <p className="text-gray-900 text-sm">{profileData?.fullName}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 block">Email Address</label>
                <div className="flex items-center gap-2 text-gray-700 text-sm">
                  <FiMail className="text-gray-400" />
                  {profileData?.email}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 block">Phone Number</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editData.phone || ''}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="input-field py-2"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-gray-700 text-sm">
                    <FiPhone className="text-gray-400" />
                    {profileData?.phone}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 block">Date of Birth</label>
                {isEditing ? (
                  <input
                    type="date"
                    value={editData.dateOfBirth || ''}
                    onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                    className="input-field py-2"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-gray-700 text-sm">
                    <FiCalendar className="text-gray-400" />
                    {profileData?.dateOfBirth ? new Date(profileData.dateOfBirth).toLocaleDateString() : 'N/A'}
                  </div>
                )}
              </div>

              {userRole === 'donor' && (
                <>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 block">Blood Type</label>
                    {isEditing ? (
                      <select
                        value={editData.bloodType || ''}
                        onChange={(e) => handleChange('bloodType', e.target.value)}
                        className="input-field py-2"
                      >
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-700 text-sm">
                        <FiDroplet className="text-primary" />
                        {profileData?.bloodType}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 block">Weight</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.weight || ''}
                          onChange={(e) => handleChange('weight', e.target.value)}
                          className="input-field py-2"
                        />
                      ) : (
                        <p className="text-gray-900 text-sm">{profileData?.weight}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 block">Height</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.height || ''}
                          onChange={(e) => handleChange('height', e.target.value)}
                          className="input-field py-2"
                        />
                      ) : (
                        <p className="text-gray-900 text-sm">{profileData?.height}</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Address & Contact */}
          <div className="card-minimal p-6">
            <h3 className="text-lg font-display font-semibold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
              <FiMapPin className="text-primary" />
              Address & Contact
            </h3>

            <div className="space-y-5">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 block">Address</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.address || ''}
                    onChange={(e) => handleChange('address', e.target.value)}
                    className="input-field py-2"
                  />
                ) : (
                  <p className="text-gray-900 text-sm">{profileData?.address}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 block">City</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.city || ''}
                      onChange={(e) => handleChange('city', e.target.value)}
                      className="input-field py-2"
                    />
                  ) : (
                    <p className="text-gray-900 text-sm">{profileData?.city}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 block">State</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.state || ''}
                      onChange={(e) => handleChange('state', e.target.value)}
                      className="input-field py-2"
                    />
                  ) : (
                    <p className="text-gray-900 text-sm">{profileData?.state}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 block">ZIP Code</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.zipCode || ''}
                    onChange={(e) => handleChange('zipCode', e.target.value)}
                    className="input-field py-2"
                  />
                ) : (
                  <p className="text-gray-900 text-sm">{profileData?.zipCode}</p>
                )}
              </div>

              <div className="pt-6 border-t border-gray-100">
                <h4 className="text-sm font-semibold text-gray-900 mb-4">Emergency Contact</h4>

                <div className="space-y-5">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 block">Contact Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.emergencyContactName || ''}
                        onChange={(e) => handleChange('emergencyContactName', e.target.value)}
                        className="input-field py-2"
                      />
                    ) : (
                      <p className="text-gray-900 text-sm">{profileData?.emergencyContactName}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 block">Contact Phone</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editData.emergencyContact || ''}
                        onChange={(e) => handleChange('emergencyContact', e.target.value)}
                        className="input-field py-2"
                      />
                    ) : (
                      <p className="text-gray-900 text-sm">{profileData?.emergencyContact}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Medical Information (Donor only) */}
          {userRole === 'donor' && (
            <div className="card-minimal p-6 lg:col-span-2">
              <h3 className="text-lg font-display font-semibold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
                <FiActivity className="text-primary" />
                Medical Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 block">Medical Conditions</label>
                  {isEditing ? (
                    <textarea
                      value={editData.medicalConditions || ''}
                      onChange={(e) => handleChange('medicalConditions', e.target.value)}
                      rows={3}
                      className="input-field py-2 resize-none"
                    />
                  ) : (
                    <p className="text-gray-900 text-sm">{profileData?.medicalConditions}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 block">Allergies</label>
                  {isEditing ? (
                    <textarea
                      value={editData.allergies || ''}
                      onChange={(e) => handleChange('allergies', e.target.value)}
                      rows={3}
                      className="input-field py-2 resize-none"
                    />
                  ) : (
                    <p className="text-gray-900 text-sm">{profileData?.allergies}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default Profile