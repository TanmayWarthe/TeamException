package com.bloodconnect.controller;

import com.bloodconnect.model.Hospital;
import com.bloodconnect.service.HospitalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/hospitals")
@CrossOrigin(origins = "http://localhost:5173")
public class HospitalController {

    @Autowired
    private HospitalService hospitalService;

    @PostMapping("/register")
    public ResponseEntity<Void> registerHospital(@RequestParam String uid, @RequestBody Hospital hospital) {
        hospitalService.registerHospital(uid, hospital);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/profile/{uid}")
    public ResponseEntity<Hospital> getHospitalProfile(@PathVariable String uid) {
        Hospital hospital = hospitalService.getHospitalByUid(uid);
        return ResponseEntity.ok(hospital);
    }
}
