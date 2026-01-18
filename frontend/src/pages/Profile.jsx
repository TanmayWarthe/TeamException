import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { FiUser, FiMail, FiPhone, FiMapPin, FiCalendar, FiDroplet, FiEdit2, FiSave, FiX, FiCamera, FiShield, FiActivity } from 'react-icons/fi'
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
        endpoint = `/hospitals/${currentUser.uid}`
      }

      const response = await apiService.get(endpoint)
      const profile = response.data

      // Transform backend data to frontend format
      const transformedProfile = {
        fullName: profile.name || currentUser.displayName || currentUser.email?.split('@')[0] || '',
        email: currentUser.email || '',
        phone: profile.phoneNumber || profile.contactNumber || '',
        bloodType: profile.bloodGroup || '',
        dateOfBirth: profile.dateOfBirth || '',
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        zipCode: profile.zipCode || '',
        emergencyContact: profile.emergencyContact || '',
        emergencyContactName: profile.emergencyContactName || '',
        medicalConditions: profile.medicalConditions || '',
        allergies: profile.allergies || '',
        weight: profile.weight || '',
        height: profile.height || '',
        // Donor specific
        lastDonation: profile.lastDonationDate || null,
        totalDonations: profile.totalDonations || 0,
        // Hospital specific
        hospitalName: profile.hospitalName || '',
        licenseNumber: profile.licenseNumber || '',
        // Patient specific
        patientId: profile.id || null,
      }

      setProfileData(transformedProfile)
    } catch (error) {
      console.error('Error fetching profile:', error)
      // If profile doesn't exist, set empty profile
      setProfileData({
        fullName: currentUser.displayName || currentUser.email?.split('@')[0] || '',
        email: currentUser.email || '',
        phone: '',
        bloodType: '',
        dateOfBirth: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        emergencyContact: '',
        emergencyContactName: '',
        medicalConditions: '',
        allergies: '',
        weight: '',
        height: '',
        hospitalName: '',
        licenseNumber: '',
      })
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
    if (!currentUser?.uid) return

    setLoading(true)
    try {
      let endpoint = ''
      let payload = {}

      if (userRole === 'donor') {
        endpoint = `/donors/${currentUser.uid}`
        payload = {
          name: editData.fullName,
          phoneNumber: editData.phone,
          bloodGroup: editData.bloodType,
          dateOfBirth: editData.dateOfBirth,
          address: editData.address,
          city: editData.city,
          state: editData.state,
          zipCode: editData.zipCode,
          emergencyContact: editData.emergencyContact,
          emergencyContactName: editData.emergencyContactName,
          medicalConditions: editData.medicalConditions,
          allergies: editData.allergies,
          weight: editData.weight,
          height: editData.height,
        }
      } else if (userRole === 'patient') {
        endpoint = `/patients/${currentUser.uid}`
        payload = {
          name: editData.fullName,
          phoneNumber: editData.phone,
          bloodGroup: editData.bloodType,
          dateOfBirth: editData.dateOfBirth,
          address: editData.address,
          city: editData.city,
          state: editData.state,
          zipCode: editData.zipCode,
          emergencyContact: editData.emergencyContact,
          emergencyContactName: editData.emergencyContactName,
          medicalConditions: editData.medicalConditions,
          allergies: editData.allergies,
        }
      } else if (userRole === 'hospital') {
        endpoint = `/hospitals/${currentUser.uid}`
        payload = {
          hospitalName: editData.hospitalName,
          contactNumber: editData.phone,
          address: editData.address,
          city: editData.city,
          state: editData.state,
          zipCode: editData.zipCode,
          licenseNumber: editData.licenseNumber,
        }
      }

      await apiService.put(endpoint, payload)
      setProfileData({ ...editData })
      setIsEditing(false)
      alert('Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile. Please try again.')
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

          {/* Quick Stats - Donor Only */}
          {userRole === 'donor' && profileData?.bloodType && (
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg bg-gray-50 border border-gray-100">
                  <div className="text-2xl font-display font-bold text-primary">{profileData?.bloodType}</div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-1">Blood Type</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-gray-50 border border-gray-100">
                  <div className="text-2xl font-display font-bold text-gray-900">{profileData?.totalDonations || 0}</div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-1">Donations</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-gray-50 border border-gray-100">
                  <div className="text-sm font-display font-bold text-gray-900">
                    {profileData?.lastDonation ? new Date(profileData.lastDonation).toLocaleDateString() : 'Never'}
                  </div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-1">Last Date</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-gray-50 border border-gray-100">
                  <div className="text-2xl font-display font-bold text-gray-900">{profileData?.weight || 'N/A'}</div>
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
              {userRole === 'hospital' ? (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 block">Hospital Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.hospitalName || ''}
                      onChange={(e) => handleChange('hospitalName', e.target.value)}
                      className="input-field py-2"
                      placeholder="Enter hospital name"
                    />
                  ) : (
                    <p className="text-gray-900 text-sm">{profileData?.hospitalName || 'Not provided'}</p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 block">Full Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.fullName || ''}
                      onChange={(e) => handleChange('fullName', e.target.value)}
                      className="input-field py-2"
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <p className="text-gray-900 text-sm">{profileData?.fullName || 'Not provided'}</p>
                  )}
                </div>
              )}

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
                    placeholder="Enter phone number"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-gray-700 text-sm">
                    <FiPhone className="text-gray-400" />
                    {profileData?.phone || 'Not provided'}
                  </div>
                )}
              </div>

              {userRole !== 'hospital' && (
                <>
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
                        {profileData?.dateOfBirth ? new Date(profileData.dateOfBirth).toLocaleDateString() : 'Not provided'}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 block">Blood Type</label>
                    {isEditing ? (
                      <select
                        value={editData.bloodType || ''}
                        onChange={(e) => handleChange('bloodType', e.target.value)}
                        className="input-field py-2"
                      >
                        <option value="">Select blood type</option>
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
                        {profileData?.bloodType || 'Not provided'}
                      </div>
                    )}
                  </div>

                  {userRole === 'donor' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 block">Weight</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editData.weight || ''}
                            onChange={(e) => handleChange('weight', e.target.value)}
                            className="input-field py-2"
                            placeholder="e.g., 70 kg"
                          />
                        ) : (
                          <p className="text-gray-900 text-sm">{profileData?.weight || 'Not provided'}</p>
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
                            placeholder="e.g., 175 cm"
                          />
                        ) : (
                          <p className="text-gray-900 text-sm">{profileData?.height || 'Not provided'}</p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {userRole === 'hospital' && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 block">License Number</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.licenseNumber || ''}
                      onChange={(e) => handleChange('licenseNumber', e.target.value)}
                      className="input-field py-2"
                      placeholder="Enter license number"
                    />
                  ) : (
                    <p className="text-gray-900 text-sm">{profileData?.licenseNumber || 'Not provided'}</p>
                  )}
                </div>
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
                    placeholder="Enter street address"
                  />
                ) : (
                  <p className="text-gray-900 text-sm">{profileData?.address || 'Not provided'}</p>
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
                      placeholder="City"
                    />
                  ) : (
                    <p className="text-gray-900 text-sm">{profileData?.city || 'Not provided'}</p>
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
                      placeholder="State"
                    />
                  ) : (
                    <p className="text-gray-900 text-sm">{profileData?.state || 'Not provided'}</p>
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
                    placeholder="ZIP code"
                  />
                ) : (
                  <p className="text-gray-900 text-sm">{profileData?.zipCode || 'Not provided'}</p>
                )}
              </div>

              {userRole !== 'hospital' && (
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
                          placeholder="Emergency contact name"
                        />
                      ) : (
                        <p className="text-gray-900 text-sm">{profileData?.emergencyContactName || 'Not provided'}</p>
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
                          placeholder="Emergency contact phone"
                        />
                      ) : (
                        <p className="text-gray-900 text-sm">{profileData?.emergencyContact || 'Not provided'}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Medical Information (Donor/Patient only) */}
          {userRole !== 'hospital' && (
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
                      placeholder="List any medical conditions"
                    />
                  ) : (
                    <p className="text-gray-900 text-sm">{profileData?.medicalConditions || 'None'}</p>
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
                      placeholder="List any allergies"
                    />
                  ) : (
                    <p className="text-gray-900 text-sm">{profileData?.allergies || 'None'}</p>
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