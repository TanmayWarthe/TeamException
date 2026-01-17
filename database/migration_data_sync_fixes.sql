-- Database Migration Script for Data Synchronization Fixes
-- Run this script to update your database schema

-- 1. Add patient_id column to blood_requests table
ALTER TABLE blood_requests 
ADD COLUMN IF NOT EXISTS patient_id BIGINT;

-- Add foreign key constraint
ALTER TABLE blood_requests 
ADD CONSTRAINT IF NOT EXISTS fk_blood_request_patient 
FOREIGN KEY (patient_id) REFERENCES patients(id);

-- 2. Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id BIGSERIAL PRIMARY KEY,
    donor_id BIGINT NOT NULL,
    hospital_id BIGINT NOT NULL,
    scheduled_date TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED',
    notes TEXT,
    cancellation_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_appointment_donor FOREIGN KEY (donor_id) REFERENCES donors(id),
    CONSTRAINT fk_appointment_hospital FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
);

-- 3. Add completed_date and appointment_id to donations table
ALTER TABLE donations 
ADD COLUMN IF NOT EXISTS completed_date TIMESTAMP;

ALTER TABLE donations
ADD COLUMN IF NOT EXISTS appointment_id BIGINT;

-- Add foreign key for appointment
ALTER TABLE donations 
ADD CONSTRAINT IF NOT EXISTS fk_donation_appointment 
FOREIGN KEY (appointment_id) REFERENCES appointments(id);

-- 4. Verify donors table has last_donation_date (should already exist)
-- If not, add it:
-- ALTER TABLE donors 
-- ADD COLUMN IF NOT EXISTS last_donation_date DATE;

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blood_requests_patient_id ON blood_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_donor_id ON appointments(donor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_hospital_id ON appointments(hospital_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_donations_appointment_id ON donations(appointment_id);

-- 6. Backfill existing data (optional - link existing requests to patients if possible)
-- This is a best-effort migration for existing data
-- You may need to customize this based on your data

-- Update existing blood requests to link to patients where requester is a patient
UPDATE blood_requests br
SET patient_id = p.id
FROM patients p
WHERE br.requester_user_id = p.user_id
AND br.patient_id IS NULL;

-- 7. Verify migration
SELECT 'Migration completed successfully!' as status;

-- Check counts
SELECT 
    'blood_requests' as table_name,
    COUNT(*) as total_records,
    COUNT(patient_id) as records_with_patient
FROM blood_requests
UNION ALL
SELECT 
    'appointments' as table_name,
    COUNT(*) as total_records,
    0 as records_with_patient
FROM appointments
UNION ALL
SELECT 
    'donations' as table_name,
    COUNT(*) as total_records,
    COUNT(appointment_id) as records_with_appointment
FROM donations;
