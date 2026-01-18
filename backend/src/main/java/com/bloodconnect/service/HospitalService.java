package com.bloodconnect.service;

import com.bloodconnect.model.Hospital;
import com.bloodconnect.model.User;
import com.bloodconnect.repository.HospitalRepository;
import com.bloodconnect.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class HospitalService {

    @Autowired
    private HospitalRepository hospitalRepository;

    @Autowired
    private UserRepository userRepository;

    public Hospital getHospitalByUid(String firebaseUid) {
        User user = userRepository.findByFirebaseUid(firebaseUid)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return hospitalRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Hospital profile not found"));
    }

    public void registerHospital(String firebaseUid, Hospital hospital) {
        User user = userRepository.findByFirebaseUid(firebaseUid)
                .orElseThrow(() -> new RuntimeException("User not found"));

        hospital.setUser(user);
        hospitalRepository.save(hospital);
    }
}
