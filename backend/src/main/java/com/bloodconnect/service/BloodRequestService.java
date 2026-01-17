package com.bloodconnect.service;

import com.bloodconnect.model.BloodRequest;
import com.bloodconnect.model.BloodRequest.RequestStatus;
import com.bloodconnect.model.User;
import com.bloodconnect.repository.BloodRequestRepository;
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

    public BloodRequest createRequest(String firebaseUid, BloodRequest request) {
        User requester = userRepository.findByFirebaseUid(firebaseUid)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        request.setRequester(requester);
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
}
