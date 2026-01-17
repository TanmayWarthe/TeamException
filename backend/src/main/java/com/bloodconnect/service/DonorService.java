package com.bloodconnect.service;

import com.bloodconnect.model.Donor;
import com.bloodconnect.model.Donor.AvailabilityStatus;
import com.bloodconnect.model.User;
import com.bloodconnect.repository.DonorRepository;
import com.bloodconnect.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class DonorService {

    @Autowired
    private DonorRepository donorRepository;
    
    @Autowired
    private UserRepository userRepository;

    public void registerDonor(String firebaseUid, Donor donorData) {
        User user = userRepository.findByFirebaseUid(firebaseUid)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        donorData.setUser(user);
        donorRepository.save(donorData);
    }
    
    // Simple Haversine approximation or just filtering by city could work. 
    // for now, returning all available donors of group.
    public List<Donor> findNearbyDonors(String bloodGroup, Double lat, Double lng, double radiusKm) {
        List<Donor> candidates = donorRepository.findByBloodGroupAndAvailabilityStatus(bloodGroup, AvailabilityStatus.AVAILABLE);
        
        // Filter by distance if lat/lng are present
        if (lat != null && lng != null) {
            return candidates.stream()
                .filter(d -> d.getLatitude() != null && d.getLongitude() != null)
                .filter(d -> calculateDistance(lat, lng, d.getLatitude(), d.getLongitude()) <= radiusKm)
                .collect(Collectors.toList());
        }
        return candidates;
    }

    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Radius of the earth
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; 
    }
}
