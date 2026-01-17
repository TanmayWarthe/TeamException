package com.bloodconnect.service;

import com.bloodconnect.model.*;
import com.bloodconnect.model.Donation.DonationType;
import com.bloodconnect.model.Donation.DonationStatus;
import com.bloodconnect.model.BloodRequest.RequestStatus;
import com.bloodconnect.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class DonationService {

        @Autowired
        private DonationRepository donationRepository;

        @Autowired
        private BloodRequestRepository requestRepository;

        @Autowired
        private DonorRepository donorRepository;

        @Autowired
        private HospitalRepository hospitalRepository;

        @Autowired
        private UserRepository userRepository;

        @Autowired
        private InventoryService inventoryService;

        @Autowired
        private AppointmentService appointmentService;

        /**
         * Donor accepts a blood request - Creates SCHEDULED donation with appointment
         */
        @Transactional
        public Donation donorAcceptRequest(String donorUid, Long requestId) {
                // Get donor
                User donorUser = userRepository.findByFirebaseUid(donorUid)
                                .orElseThrow(() -> new RuntimeException("Donor user not found"));
                Donor donor = donorRepository.findByUser(donorUser)
                                .orElseThrow(() -> new RuntimeException("Donor profile not found"));

                // Get request
                BloodRequest request = requestRepository.findById(requestId)
                                .orElseThrow(() -> new RuntimeException("Request not found"));

                // Check if already accepted
                if (request.getStatus() != RequestStatus.PENDING) {
                        throw new RuntimeException("Request already " + request.getStatus());
                }

                // Get hospital for appointment
                Hospital hospital = null;
                if (request.getHospitalName() != null && !request.getHospitalName().isEmpty()) {
                        // Try to find hospital by name (simplified - in production use better matching)
                        hospital = hospitalRepository.findAll().stream()
                                        .filter(h -> h.getHospitalName().equalsIgnoreCase(request.getHospitalName()))
                                        .findFirst()
                                        .orElse(null);
                }

                // Create appointment (scheduled for next day)
                Appointment appointment = null;
                if (hospital != null) {
                        appointment = appointmentService.createAppointment(
                                        donor,
                                        hospital,
                                        LocalDateTime.now().plusDays(1),
                                        "Blood donation for request #" + requestId);
                }

                // Create donation record with SCHEDULED status
                Donation donation = new Donation();
                donation.setDonor(donor);
                donation.setRequest(request);
                donation.setBloodGroup(request.getBloodGroup());
                donation.setUnits(request.getUnitsRequired());
                donation.setDonationType(DonationType.DIRECT_TO_PATIENT);
                donation.setStatus(DonationStatus.SCHEDULED); // ✅ Not completed yet!
                donation.setAppointment(appointment);

                // Update request status to MATCHED (not ACCEPTED yet)
                request.setStatus(RequestStatus.MATCHED);
                requestRepository.save(request);

                return donationRepository.save(donation);
        }

        /**
         * Hospital accepts a blood request - Validates inventory first
         */
        @Transactional
        public Donation hospitalAcceptRequest(String hospitalUid, Long requestId) {
                // Get hospital
                User hospitalUser = userRepository.findByFirebaseUid(hospitalUid)
                                .orElseThrow(() -> new RuntimeException("Hospital user not found"));
                Hospital hospital = hospitalRepository.findByUser(hospitalUser)
                                .orElseThrow(() -> new RuntimeException("Hospital profile not found"));

                // Get request
                BloodRequest request = requestRepository.findById(requestId)
                                .orElseThrow(() -> new RuntimeException("Request not found"));

                // Check if already accepted
                if (request.getStatus() != RequestStatus.PENDING) {
                        throw new RuntimeException("Request already " + request.getStatus());
                }

                // ✅ VALIDATE INVENTORY FIRST (before any state changes)
                inventoryService.validateInventory(hospitalUid, request.getBloodGroup(),
                                request.getUnitsRequired());

                // Create donation record
                Donation donation = new Donation();
                donation.setHospital(hospital);
                donation.setRequest(request);
                donation.setBloodGroup(request.getBloodGroup());
                donation.setUnits(request.getUnitsRequired());
                donation.setDonationType(DonationType.TO_HOSPITAL);
                donation.setStatus(DonationStatus.COMPLETED); // Hospital fulfillment is immediate
                donation.setCompletedDate(LocalDateTime.now());

                // Save donation first
                donation = donationRepository.save(donation);

                // Update request status
                request.setStatus(RequestStatus.FULFILLED);
                requestRepository.save(request);

                // Deduct from hospital inventory (last, so rollback works if this fails)
                inventoryService.updateInventory(hospitalUid, request.getBloodGroup(),
                                -request.getUnitsRequired());

                return donation;
        }

        /**
         * Complete a scheduled donation
         */
        @Transactional
        public Donation completeDonation(Long donationId) {
                Donation donation = donationRepository.findById(donationId)
                                .orElseThrow(() -> new RuntimeException("Donation not found"));

                if (donation.getStatus() != DonationStatus.SCHEDULED) {
                        throw new RuntimeException("Donation is not in SCHEDULED status");
                }

                // Update donation status
                donation.setStatus(DonationStatus.COMPLETED);
                donation.setCompletedDate(LocalDateTime.now());

                // Update request status
                BloodRequest request = donation.getRequest();
                if (request != null) {
                        request.setStatus(RequestStatus.FULFILLED);
                        requestRepository.save(request);
                }

                // Update donor last donation date
                Donor donor = donation.getDonor();
                if (donor != null) {
                        donor.setLastDonationDate(LocalDate.now());
                        donorRepository.save(donor);
                }

                // If donation is to hospital, add to inventory
                if (donation.getDonationType() == DonationType.TO_HOSPITAL && donation.getHospital() != null) {
                        Hospital hospital = donation.getHospital();
                        inventoryService.updateInventory(
                                        hospital.getUser().getFirebaseUid(),
                                        donation.getBloodGroup(),
                                        donation.getUnits());
                }

                // Complete appointment if exists
                if (donation.getAppointment() != null) {
                        appointmentService.completeAppointment(donation.getAppointment().getId());
                }

                return donationRepository.save(donation);
        }

        /**
         * Cancel a donation
         */
        @Transactional
        public Donation cancelDonation(Long donationId, String reason) {
                Donation donation = donationRepository.findById(donationId)
                                .orElseThrow(() -> new RuntimeException("Donation not found"));

                if (donation.getStatus() == DonationStatus.COMPLETED) {
                        throw new RuntimeException("Cannot cancel completed donation");
                }

                // Update donation status
                donation.setStatus(DonationStatus.CANCELLED);

                // Revert request to PENDING if it was matched
                BloodRequest request = donation.getRequest();
                if (request != null && request.getStatus() == RequestStatus.MATCHED) {
                        request.setStatus(RequestStatus.PENDING);
                        requestRepository.save(request);
                }

                // Cancel appointment if exists
                if (donation.getAppointment() != null) {
                        appointmentService.cancelAppointment(donation.getAppointment().getId(), reason);
                }

                return donationRepository.save(donation);
        }

        /**
         * Record a general donation (not linked to specific request)
         */
        @Transactional
        public Donation recordGeneralDonation(String donorUid, String hospitalUid,
                        String bloodGroup, int units) {
                // Get donor
                User donorUser = userRepository.findByFirebaseUid(donorUid)
                                .orElseThrow(() -> new RuntimeException("Donor user not found"));
                Donor donor = donorRepository.findByUser(donorUser)
                                .orElseThrow(() -> new RuntimeException("Donor profile not found"));

                // Get hospital
                User hospitalUser = userRepository.findByFirebaseUid(hospitalUid)
                                .orElseThrow(() -> new RuntimeException("Hospital user not found"));
                Hospital hospital = hospitalRepository.findByUser(hospitalUser)
                                .orElseThrow(() -> new RuntimeException("Hospital profile not found"));

                // Create donation record (no request)
                Donation donation = new Donation();
                donation.setDonor(donor);
                donation.setHospital(hospital);
                donation.setBloodGroup(bloodGroup);
                donation.setUnits(units);
                donation.setDonationType(DonationType.TO_HOSPITAL);
                donation.setStatus(DonationStatus.COMPLETED);
                donation.setCompletedDate(LocalDateTime.now());

                // Save donation
                donation = donationRepository.save(donation);

                // Add to hospital inventory
                inventoryService.updateInventory(hospitalUid, bloodGroup, units);

                // Update donor last donation date
                donor.setLastDonationDate(LocalDate.now());
                donorRepository.save(donor);

                return donation;
        }

        /**
         * Check if a request has been accepted
         */
        public boolean isRequestAccepted(Long requestId) {
                Optional<Donation> donation = donationRepository.findByRequestId(requestId).stream().findFirst();
                return donation.isPresent();
        }

        /**
         * Get acceptance details for a request
         */
        public Optional<Donation> getAcceptanceDetails(Long requestId) {
                return donationRepository.findByRequestId(requestId).stream().findFirst();
        }

        public java.util.List<Donation> getDonationsByDonor(String donorUid) {
                User donorUser = userRepository.findByFirebaseUid(donorUid)
                                .orElseThrow(() -> new RuntimeException("Donor user not found"));
                Donor donor = donorRepository.findByUser(donorUser)
                                .orElseThrow(() -> new RuntimeException("Donor profile not found"));
                return donationRepository.findByDonorId(donor.getId());
        }

        public java.util.List<Donation> getDonationsByHospital(String hospitalUid) {
                User hospitalUser = userRepository.findByFirebaseUid(hospitalUid)
                                .orElseThrow(() -> new RuntimeException("Hospital user not found"));
                Hospital hospital = hospitalRepository.findByUser(hospitalUser)
                                .orElseThrow(() -> new RuntimeException("Hospital profile not found"));
                return donationRepository.findByHospitalId(hospital.getId());
        }
}
