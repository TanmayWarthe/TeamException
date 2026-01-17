import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { apiService } from '../services/api.service' // Also needed apiService import which was missing
import Layout from '../components/Layout'
import { FiClock, FiActivity, FiFilter } from 'react-icons/fi'

const RequestHistory = () => {
    const { currentUser } = useAuth() // Need to import useAuth
    const [requests, setRequests] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchRequests = async () => {
            if (!currentUser?.uid) return

            setLoading(true)
            try {
                const response = await apiService.get(`/requests/my/${currentUser.uid}`)
                setRequests(response.data)
            } catch (error) {
                console.error('Error fetching request history:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchRequests()
    }, [currentUser])

    return (
        <Layout>
            <div className="max-w-5xl mx-auto p-4 md:p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">My Requests</h1>
                        <p className="text-gray-600">Track the status of your blood requirements.</p>
                    </div>
                    <button className="btn-secondary flex items-center gap-2">
                        <FiFilter /> Filter
                    </button>
                </div>

                <div className="card-minimal overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500 font-medium">
                                    <th className="px-6 py-4">Date Requested</th>
                                    <th className="px-6 py-4">Blood Group</th>
                                    <th className="px-6 py-4">Quantity</th>
                                    <th className="px-6 py-4">Urgency</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {requests.map((req) => (
                                    <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <FiClock className="text-gray-400" />
                                                <span className="font-semibold text-gray-900">{new Date(req.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-display font-bold text-lg text-gray-800">{req.bloodGroup}</span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {req.unitsRequired} Unit{req.unitsRequired > 1 ? 's' : ''}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded text-xs font-bold border ${req.urgency === 'EMERGENCY'
                                                ? 'bg-red-50 text-red-700 border-red-100'
                                                : 'bg-blue-50 text-blue-700 border-blue-100'
                                                }`}>
                                                {req.urgency}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${req.status === 'PENDING' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                                                req.status === 'FULFILLED' ? 'bg-green-50 text-green-700 border-green-100' :
                                                    'bg-gray-50 text-gray-600 border-gray-200'
                                                }`}>
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button className="text-sm font-medium text-primary hover:underline">View Details</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Layout>
    )
}

export default RequestHistory
