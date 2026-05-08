-- ============================================
-- STAFF CLEARANCE TEST DATA
-- ============================================
-- This creates a staff member who applies for clearance
-- and a supervisor who can approve the initial request
-- Run this after your 21 nodes are set up
-- ============================================

-- ============================================
-- 1. CREATE DEDICATED SUPERVISOR
-- ============================================
-- This user can ONLY approve staff initial clearance requests
-- Cannot approve individual offices (that's for 'staff' role)

INSERT IGNORE INTO users (full_name, identifier_id, email, password, role, department, created_at) 
VALUES (
    'Dr. Abebe Kebede',           -- Supervisor name
    'SUP_001',                    -- Supervisor ID
    'abebe.kebede@university.edu', -- Email
    '$2b$10$YourHashedPassword',  -- Password (change this)
    'supervisor',                 -- Role: dedicated supervisor
    'Human Resources',            -- Department
    NOW()
);

SET @supervisor_id = LAST_INSERT_ID();

-- ============================================
-- 2. CREATE STAFF MEMBER (Applicant)
-- ============================================
-- This staff member will apply for clearance

INSERT IGNORE INTO users (full_name, identifier_id, email, password, role, department, created_at)
VALUES (
    'Ato Girma Hailu',            -- Staff name (matches your form!)
    'STF_042',                    -- Staff ID
    'girma.hailu@university.edu',  -- Email
    '$2b$10$YourHashedPassword',  -- Password (change this)
    'staff',                      -- Role: regular staff
    'Book Store',                 -- Department
    NOW()
);

SET @staff_id = LAST_INSERT_ID();

-- ============================================
-- 3. CREATE CLEARANCE REQUEST
-- ============================================
-- Staff applies for clearance (reason: retirement)
-- Status: pending (waiting for supervisor approval)
-- All 21 nodes are initially INACTIVE

INSERT INTO clearance_requests (
    user_id,
    request_type,
    status,
    final_qr_code,
    started_at
)
VALUES (
    @staff_id,                    -- The staff member
    'retirement',                 -- Reason: retirement
    'pending',                    -- Request status
    NULL,                         -- No QR yet
    NOW()
);

SET @request_id = LAST_INSERT_ID();

-- ============================================
-- 4. INITIALIZE 21 STAFF CLEARANCE NODES
-- ============================================
-- All nodes start as 'pending' (will show as locked in UI until supervisor approves)
-- NOTE: To add true 'locked' state, alter table to include 'inactive' in ENUM

INSERT INTO staff_clearance_nodes (
    request_id,
    supervisor_status,
    regular_budget_status,
    project_income_status,
    fixed_asset_status,
    library_status,
    book_store_status,
    sports_status,
    credit_union_status,
    ethics_status,
    maintenance_status,
    registrar_status,
    housing_status,
    revenue_dir_status,
    lab_workshop_status,
    distance_edu_status,
    general_service_status,
    staff_assoc_status,
    central_property_status,
    research_status,
    hr_status,
    record_office_status
) VALUES (
    @request_id,
    'pending',   -- supervisor_status
    'pending',   -- regular_budget_status
    'pending',   -- project_income_status
    'pending',   -- fixed_asset_status
    'pending',   -- library_status
    'pending',   -- book_store_status
    'pending',   -- sports_status
    'pending',   -- credit_union_status
    'pending',   -- ethics_status
    'pending',   -- maintenance_status
    'pending',   -- registrar_status
    'pending',   -- housing_status
    'pending',   -- revenue_dir_status
    'pending',   -- lab_workshop_status
    'pending',   -- distance_edu_status
    'pending',   -- general_service_status
    'pending',   -- staff_assoc_status
    'pending',   -- central_property_status
    'pending',   -- research_status
    'pending',   -- hr_status
    'pending'    -- record_office_status
);

-- ============================================
-- 5. VERIFICATION QUERY
-- ============================================
-- Run this to confirm the data was inserted correctly

SELECT 
    cr.id AS request_id,
    u.full_name AS staff_name,
    u.identifier_id AS staff_id,
    cr.request_type AS reason,
    cr.status AS request_status,
    COUNT(CASE WHEN scn.supervisor_status = 'pending' THEN 1 END) +
    COUNT(CASE WHEN scn.regular_budget_status = 'pending' THEN 1 END) +
    COUNT(CASE WHEN scn.project_income_status = 'pending' THEN 1 END) AS pending_nodes_count,
    'All 21 nodes initialized (pending until offices approve)' AS note
FROM clearance_requests cr
JOIN users u ON cr.user_id = u.id
JOIN staff_clearance_nodes scn ON cr.id = scn.request_id
WHERE cr.id = @request_id
GROUP BY cr.id, u.full_name, u.identifier_id, cr.request_type, cr.status;

-- ============================================
-- EXPECTED RESULT:
-- request_id: [number]
-- staff_name: Ato Girma Hailu
-- staff_id: STF_042
-- reason: retirement
-- request_status: pending
-- pending_nodes_count: 21 (all nodes pending)
-- note: All 21 nodes initialized (pending until offices approve)
-- ============================================

-- NOTE: The initial approval workflow columns need to be added
-- to the database. Run this migration if needed:

/*
ALTER TABLE clearance_requests 
ADD COLUMN approving_officer_id INT,
ADD COLUMN approving_officer_name VARCHAR(255),
ADD COLUMN initial_approval_status ENUM('pending', 'approved', 'rejected') DEFAULT NULL,
ADD COLUMN initial_approval_at TIMESTAMP NULL,
ADD COLUMN initial_approval_comments TEXT,
ADD COLUMN reason_details TEXT;
*/

-- ============================================
-- CLEANUP: Remove existing requests for STF_042
-- Run this first if you want to start fresh
-- ============================================

-- Delete existing clearance requests for STF_042 (if any)
-- This allows the staff to start from "Apply for Clearance"
DELETE FROM staff_clearance_nodes WHERE request_id IN (
    SELECT id FROM clearance_requests WHERE user_id = 
    (SELECT id FROM users WHERE identifier_id = 'STF_042')
);
DELETE FROM clearance_requests WHERE user_id = 
    (SELECT id FROM users WHERE identifier_id = 'STF_042');

-- ============================================
-- 6. LOGIN CREDENTIALS FOR TESTING
-- ============================================

-- STAFF Login:
--   ID: STF_042
--   Password: (the one you set)

-- SUPERVISOR Login:
--   ID: SUP_001
--   Password: (the one you set)

-- ============================================
-- 7. UNLOCK ALL NODES (Simulate supervisor approval)
-- ============================================
-- Uncomment and run to activate all 21 offices

/*
-- Change status to in_progress and unlock all nodes
UPDATE clearance_requests 
SET status = 'in_progress'
WHERE id = @request_id;

UPDATE staff_clearance_nodes 
SET supervisor_status = 'pending',
    regular_budget_status = 'pending',
    project_income_status = 'pending',
    fixed_asset_status = 'pending',
    library_status = 'pending',
    book_store_status = 'pending',
    sports_status = 'pending',
    credit_union_status = 'pending',
    ethics_status = 'pending',
    maintenance_status = 'pending',
    registrar_status = 'pending',
    housing_status = 'pending',
    revenue_dir_status = 'pending',
    lab_workshop_status = 'pending',
    distance_edu_status = 'pending',
    general_service_status = 'pending',
    staff_assoc_status = 'pending',
    central_property_status = 'pending',
    research_status = 'pending',
    hr_status = 'pending',
    record_office_status = 'pending'
WHERE request_id = @request_id;
*/

-- ============================================
-- 8. APPROVE SPECIFIC NODES (for testing)
-- ============================================
-- Uncomment to simulate some offices approving

/*
-- Library approves
UPDATE staff_clearance_nodes SET library_status = 'approved' WHERE request_id = @request_id;

-- Sports approves
UPDATE staff_clearance_nodes SET sports_status = 'approved' WHERE request_id = @request_id;

-- HR approves
UPDATE staff_clearance_nodes SET hr_status = 'approved' WHERE request_id = @request_id;

-- Check progress
SELECT 
    SUM(CASE WHEN library_status = 'approved' THEN 1 ELSE 0 END) +
    SUM(CASE WHEN sports_status = 'approved' THEN 1 ELSE 0 END) +
    SUM(CASE WHEN hr_status = 'approved' THEN 1 ELSE 0 END) AS approved_count,
    21 AS total_nodes,
    CONCAT(ROUND((SUM(CASE WHEN library_status = 'approved' THEN 1 ELSE 0 END) +
                  SUM(CASE WHEN sports_status = 'approved' THEN 1 ELSE 0 END) +
                  SUM(CASE WHEN hr_status = 'approved' THEN 1 ELSE 0 END)) / 21 * 100, 1), '%') AS progress
FROM staff_clearance_nodes 
WHERE request_id = @request_id;
*/

