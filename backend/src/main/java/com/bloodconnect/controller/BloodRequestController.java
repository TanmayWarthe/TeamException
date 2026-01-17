package com.bloodconnect.controller;

import com.bloodconnect.model.BloodRequest;
import com.bloodconnect.service.BloodRequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/requests")
@CrossOrigin(origins = "http://localhost:5173")
public class BloodRequestController {

    @Autowired
    private BloodRequestService requestService;

    @PostMapping
    public ResponseEntity<BloodRequest> createRequest(@RequestParam String uid, @RequestBody BloodRequest request) {
        return ResponseEntity.ok(requestService.createRequest(uid, request));
    }

    @GetMapping("/pending")
    public ResponseEntity<List<BloodRequest>> getPendingRequests() {
        return ResponseEntity.ok(requestService.getPendingRequests());
    }

    @GetMapping("/my/{uid}")
    public ResponseEntity<List<BloodRequest>> getMyRequests(@PathVariable String uid) {
        return ResponseEntity.ok(requestService.getMyRequests(uid));
    }
}
