package com.bloodconnect.service;

import com.bloodconnect.model.BloodRequest;
import com.bloodconnect.model.BloodRequest.RequestStatus;
import com.bloodconnect.model.Hospital;
import com.bloodconnect.model.Patient;
import com.bloodconnect.model.User;
import com.bloodconnect.repository.BloodRequestRepository;
import com.bloodconnect.repository.HospitalRepository;
import com.bloodconnect.repository.PatientRepository;
import com.bloodconnect.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BloodRequestService {

    @Autowired
    private BloodRequestRepository requestRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private HospitalRepository hospitalRepository;

    @Autowired
    private PatientRepository patientRepository;

    /**
     * Create blood request from patient
     */
    public BloodRequest createRequest(String firebaseUid, BloodRequest request) {
        User requester = userRepository.findByFirebaseUid(firebaseUid)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Get patient entity
        Patient patient = patientRepository.findByUser(requester)
                .orElseThrow(() -> new RuntimeException("Patient profile not found"));

        request.setRequester(requester);
        request.setPatient(patient);
        request.setPatientName(patient.getName()); // Denormalized for performance
        request.setStatus(RequestStatus.PENDING);

        return requestRepository.save(request);
    }

    public List<BloodRequest> getPendingRequests() {
        return requestRepository.findByStatus(RequestStatus.PENDING);
    }

    public List<BloodRequest> getMyRequests(String firebaseUid) {
        User user = userRepository.findByFirebaseUid(firebaseUid)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return requestRepository.findByRequesterId(user.getId());
    }

    /**
     * Create blood request from hospital (for a patient)
     */
    public BloodRequest createHospitalRequest(String firebaseUid, BloodRequest request) {
        User user = userRepository.findByFirebaseUid(firebaseUid)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Hospital hospital = hospitalRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Hospital profile not found"));

        request.setRequester(user);

        // If patient ID is provided, link to patient entity
        if (request.getPatient() != null && request.getPatient().getId() != null) {
            Patient patient = patientRepository.findById(request.getPatient().getId())
                    .orElseThrow(() -> new RuntimeException("Patient not found"));
            request.setPatient(patient);
            request.setPatientName(patient.getName());
        }

        // Set hospital name if not provided
        if (request.getHospitalName() == null || request.getHospitalName().isEmpty()) {
            request.setHospitalName(hospital.getHospitalName());
        }

        request.setStatus(RequestStatus.PENDING);
        return requestRepository.save(request);
    }

    public List<BloodRequest> findRequestsByHospital(String firebaseUid) {
        User user = userRepository.findByFirebaseUid(firebaseUid)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return requestRepository.findByRequester(user);
    }

    public BloodRequest updateRequestStatus(Long requestId, RequestStatus status) {
        BloodRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        request.setStatus(status);
        return requestRepository.save(request);
    }
}
