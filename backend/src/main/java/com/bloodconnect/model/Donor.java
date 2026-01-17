package com.bloodconnect.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "donors")
@Data
@NoArgsConstructor
public class Donor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private User user;

    private String name;
    private String bloodGroup; // A+, B-, etc.
    private LocalDate dob;
    private String gender;
    private String phone;
    private String address;
    
    // For Location (Latitude/Longitude)
    private Double latitude;
    private Double longitude;

    private LocalDate lastDonationDate;
    
    @Enumerated(EnumType.STRING)
    private AvailabilityStatus availabilityStatus = AvailabilityStatus.AVAILABLE;

    public enum AvailabilityStatus {
        AVAILABLE, BUSY, UNAVAILABLE
    }
}
