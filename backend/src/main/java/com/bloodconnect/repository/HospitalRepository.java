package com.bloodconnect.repository;

import com.bloodconnect.model.Hospital;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface HospitalRepository extends JpaRepository<Hospital, Long> {
    Optional<Hospital> findByUserId(Long userId);
}
