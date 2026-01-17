package com.bloodconnect.service;

import com.bloodconnect.model.Hospital;
import com.bloodconnect.model.Inventory;
import com.bloodconnect.model.User;
import com.bloodconnect.repository.HospitalRepository;
import com.bloodconnect.repository.InventoryRepository;
import com.bloodconnect.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class InventoryService {

    @Autowired
    private InventoryRepository inventoryRepository;
    
    @Autowired
    private HospitalRepository hospitalRepository;
    
    @Autowired
    private UserRepository userRepository;

    public Inventory updateInventory(String firebaseUid, String bloodGroup, int units) {
        User user = userRepository.findByFirebaseUid(firebaseUid)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Hospital hospital = hospitalRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Hospital profile not found"));
                
        Optional<Inventory> existing = inventoryRepository.findByHospitalIdAndBloodGroup(hospital.getId(), bloodGroup);
        Inventory inv;
        if (existing.isPresent()) {
            inv = existing.get();
        } else {
            inv = new Inventory();
            inv.setHospital(hospital);
            inv.setBloodGroup(bloodGroup);
        }
        
        inv.setUnitsAvailable(units);
        return inventoryRepository.save(inv);
    }
}
