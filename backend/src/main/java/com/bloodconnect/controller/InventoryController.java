package com.bloodconnect.controller;

import com.bloodconnect.model.Inventory;
import com.bloodconnect.service.InventoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")
@CrossOrigin(origins = "http://localhost:5173")
public class InventoryController {

    @Autowired
    private InventoryService inventoryService;

    @GetMapping("/hospital/{uid}")
    public ResponseEntity<List<Inventory>> getHospitalInventory(@PathVariable String uid) {
        List<Inventory> inventory = inventoryService.getInventoryByHospital(uid);
        return ResponseEntity.ok(inventory);
    }

    @PostMapping("/hospital/{uid}/update")
    public ResponseEntity<Inventory> updateInventory(
            @PathVariable String uid,
            @RequestParam String bloodGroup,
            @RequestParam int units) {
        Inventory updated = inventoryService.updateInventory(uid, bloodGroup, units);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/hospital/{uid}/add")
    public ResponseEntity<Inventory> addInventory(
            @PathVariable String uid,
            @RequestParam String bloodGroup,
            @RequestParam int units) {
        Inventory added = inventoryService.addInventory(uid, bloodGroup, units);
        return ResponseEntity.ok(added);
    }
}
