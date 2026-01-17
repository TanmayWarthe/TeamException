import React, { useState, useCallback, useEffect } from 'react'
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api'
import { FiMapPin, FiNavigation } from 'react-icons/fi'
import { apiService } from '../services/api.service'

const containerStyle = {
    width: '100%',
    height: '100%',
    minHeight: '500px',
    borderRadius: '0.75rem' // rounded-xl
}

const defaultCenter = {
    lat: 28.6139, // New Delhi
    lng: 77.2090
}

// Mock data - In real app, this comes from backend
const mockLocations = [
    { id: 1, type: 'hospital', name: 'City General Hospital', lat: 28.6129, lng: 77.2295, bloodAvailable: ['A+', 'O+'] },
    { id: 2, type: 'donor', name: 'Sarthak (A+)', lat: 28.6200, lng: 77.2100, lastDonation: '2023-12-01' },
    { id: 3, type: 'hospital', name: 'LifeCare Center', lat: 28.6000, lng: 77.2000, bloodAvailable: ['B-', 'AB+'] },
    { id: 4, type: 'donor', name: 'Priya (O-)', lat: 28.6250, lng: 77.1900, lastDonation: '2024-01-10' },
]

const BloodMap = () => {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    })

    const [map, setMap] = useState(null)
    const [locations, setLocations] = useState(mockLocations) // Start with mock, append real
    const [selectedLocation, setSelectedLocation] = useState(null)

    useEffect(() => {
        // Fetch real donors
        // For MVP, we fetch A+ donors or allow filter. Here we fetch one group as demo.
        apiService.get('/donors/nearby?bloodGroup=A+')
            .then(res => {
                const donors = res.data.map(d => ({
                    id: `real-${d.id}`,
                    type: 'donor',
                    name: `${d.name} (${d.bloodGroup})`,
                    lat: d.latitude || defaultCenter.lat, // Fallback if no lat
                    lng: d.longitude || defaultCenter.lng,
                    lastDonation: d.lastDonationDate || 'Never'
                })).filter(d => d.lat !== defaultCenter.lat); // Filter invalid

                setLocations(prev => [...prev, ...donors]);
            })
            .catch(err => console.error("Failed to fetch donors", err));
    }, [])

    const onLoad = useCallback(function callback(map) {
        const bounds = new window.google.maps.LatLngBounds(defaultCenter)
        // Extend bounds to include locations
        locations.forEach(loc => {
            bounds.extend({ lat: loc.lat, lng: loc.lng })
        })
        map.fitBounds(bounds)
        setMap(map)
    }, [locations])

    const onUnmount = useCallback(function callback(map) {
        setMap(null)
    }, [])

    if (!isLoaded) {
        return (
            <div className="flex items-center justify-center h-[500px] bg-gray-100 rounded-xl animate-pulse">
                <p className="text-gray-500">Loading Maps...</p>
            </div>
        )
    }

    return (
        <div className="card-minimal p-4 relative">
            <div className="absolute top-6 left-6 z-10 bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-md border border-gray-100 max-w-xs">
                <h3 className="font-display font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <FiMapPin className="text-primary" /> Blood Network
                </h3>
                <p className="text-xs text-gray-500 mb-3">
                    View nearby hospitals and active donors.
                </p>
                <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Hospital</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Donor</span>
                </div>
            </div>

            <GoogleMap
                mapContainerStyle={containerStyle}
                center={defaultCenter}
                zoom={12}
                onLoad={onLoad}
                onUnmount={onUnmount}
                options={{
                    styles: [
                        {
                            "featureType": "poi.medical",
                            "elementType": "geometry",
                            "stylers": [{ "color": "#fbd3d3" }]
                        }
                    ],
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: true,
                }}
            >
                {locations.map(loc => (
                    <Marker
                        key={loc.id}
                        position={{ lat: loc.lat, lng: loc.lng }}
                        onClick={() => setSelectedLocation(loc)}
                        icon={loc.type === 'hospital'
                            ? 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
                            : 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'}
                    />
                ))}

                {selectedLocation && (
                    <InfoWindow
                        position={{ lat: selectedLocation.lat, lng: selectedLocation.lng }}
                        onCloseClick={() => setSelectedLocation(null)}
                    >
                        <div className="p-2 min-w-[200px]">
                            <h4 className="font-bold text-gray-900 mb-1">{selectedLocation.name}</h4>
                            <p className="text-xs text-gray-500 capitalize mb-2">{selectedLocation.type}</p>

                            {selectedLocation.type === 'hospital' && (
                                <div>
                                    <p className="text-xs font-semibold text-gray-700 mb-1">Available Blood:</p>
                                    <div className="flex gap-1 flex-wrap">
                                        {selectedLocation.bloodAvailable.map(bg => (
                                            <span key={bg} className="px-1.5 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold rounded border border-red-100">
                                                {bg}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedLocation.type === 'donor' && (
                                <div>
                                    <p className="text-xs text-gray-500">Last Donation: {selectedLocation.lastDonation}</p>
                                    <button className="mt-2 w-full btn-primary py-1 text-xs">Request</button>
                                </div>
                            )}
                        </div>
                    </InfoWindow>
                )}
            </GoogleMap>
        </div>
    )
}

export default React.memo(BloodMap)
