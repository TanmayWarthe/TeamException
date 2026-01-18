package com.bloodconnect.controller;

import com.bloodconnect.model.User;
import com.bloodconnect.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {

    @Autowired
    private UserService userService;

    @PostMapping("/sync")
    public ResponseEntity<User> syncUser(@RequestBody UserSyncRequest request) {
        // In a real app, verify the Firebase Token here using
        // FirebaseAuth.getInstance().verifyIdToken(token)
        User user = userService.syncUser(request.getFirebaseUid(), request.getEmail(), request.getRole());
        return ResponseEntity.ok(user);
    }

    @GetMapping("/{uid}")
    public ResponseEntity<User> getUser(@PathVariable String uid) {
        return userService.findByFirebaseUid(uid)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get user's role from database
     */
    @GetMapping("/{uid}/role")
    public ResponseEntity<?> getUserRole(@PathVariable String uid) {
        return userService.findByFirebaseUid(uid)
                .map(user -> {
                    Map<String, String> response = new HashMap<>();
                    response.put("role", user.getRole().name().toLowerCase());
                    response.put("email", user.getEmail());
                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // DTO
    public static class UserSyncRequest {
        private String firebaseUid;
        private String email;
        private User.Role role;

        // Getters Setters
        public String getFirebaseUid() {
            return firebaseUid;
        }

        public void setFirebaseUid(String firebaseUid) {
            this.firebaseUid = firebaseUid;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public User.Role getRole() {
            return role;
        }

        public void setRole(User.Role role) {
            this.role = role;
        }
    }
}
