package com.bloodconnect.repository;

import com.bloodconnect.model.Donor;
import com.bloodconnect.model.Donor.AvailabilityStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface DonorRepository extends JpaRepository<Donor, Long> {
    Optional<Donor> findByUserId(Long userId);
    List<Donor> findByBloodGroupAndAvailabilityStatus(String bloodGroup, AvailabilityStatus status);
}
