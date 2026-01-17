package com.bloodconnect.controller;

import com.bloodconnect.model.Inventory;
import com.bloodconnect.service.InventoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/inventory")
@CrossOrigin(origins = "http://localhost:5173")
public class InventoryController {

    @Autowired
    private InventoryService inventoryService;

    @PostMapping("/update")
    public ResponseEntity<Inventory> updateInventory(
            @RequestParam String uid,
            @RequestParam String bloodGroup,
            @RequestParam int units) {
        return ResponseEntity.ok(inventoryService.updateInventory(uid, bloodGroup, units));
    }
}
