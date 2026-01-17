package com.bloodconnect.controller;

import com.bloodconnect.model.Donor;
import com.bloodconnect.service.DonorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/donors")
@CrossOrigin(origins = "http://localhost:5173")
public class DonorController {

    @Autowired
    private DonorService donorService;

    @PostMapping("/register")
    public ResponseEntity<Void> registerDonor(@RequestParam String uid, @RequestBody Donor donor) {
        donorService.registerDonor(uid, donor);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/nearby")
    public ResponseEntity<List<Donor>> findNearby(
            @RequestParam String bloodGroup,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng) {

        // Default radius 50km
        return ResponseEntity.ok(donorService.findNearbyDonors(bloodGroup, lat, lng, 50.0));
    }
}
