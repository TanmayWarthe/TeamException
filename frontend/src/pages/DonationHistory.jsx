import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { FiClock, FiMapPin, FiCheckCircle, FiDroplet } from 'react-icons/fi'
import { apiService } from '../services/api.service'

const DonationHistory = () => {
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Determine user role and fetch appropriate history - mocking for now
        // apiService.get('/history')
        setLoading(false)
        setHistory([
            { id: 1, date: '2023-12-01', location: 'City Hospital', units: 1, bloodGroup: 'A+', status: 'Completed' },
            { id: 2, date: '2023-08-15', location: 'Red Cross Camp', units: 1, bloodGroup: 'A+', status: 'Completed' },
            { id: 3, date: '2023-04-20', location: 'Medical College', units: 1, bloodGroup: 'A+', status: 'Completed' },
        ])
    }, [])

    return (
        <Layout>
            <div className="max-w-5xl mx-auto p-4 md:p-8">
                <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">Donation History</h1>
                <p className="text-gray-600 mb-8">A complete log of your life-saving contributions.</p>

                <div className="card-minimal overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500 font-medium">
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Location</th>
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4">Units</th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {history.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <FiClock className="text-gray-400" />
                                                <span className="font-semibold text-gray-900">{new Date(item.date).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <FiMapPin className="text-gray-400" />
                                                {item.location}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-2 h-2 rounded-full bg-primary/20"></span>
                                                <span className="text-sm text-gray-700">Whole Blood</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded text-xs font-bold border border-gray-200">
                                                {item.units} Unit
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-100">
                                                <FiCheckCircle className="text-[10px]" />
                                                {item.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {history.length === 0 && (
                        <div className="p-12 text-center text-gray-500">
                            <p>No donation history found.</p>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    )
}

export default DonationHistory
