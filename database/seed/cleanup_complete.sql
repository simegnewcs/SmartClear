-- ============================================
-- COMPLETE CLEANUP FOR STF_042
-- Run this in phpMyAdmin or MySQL directly
-- ============================================

-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- Get the user ID first
SET @staff_user_id = (SELECT id FROM users WHERE identifier_id = 'STF_042');

-- Delete approval logs for staff's requests
DELETE FROM approval_logs 
WHERE request_id IN (
    SELECT id FROM clearance_requests WHERE user_id = @staff_user_id
);

-- Delete staff clearance nodes
DELETE FROM staff_clearance_nodes 
WHERE request_id IN (
    SELECT id FROM clearance_requests WHERE user_id = @staff_user_id
);

-- Delete clearance requests
DELETE FROM clearance_requests 
WHERE user_id = @staff_user_id;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Verify - should return no rows
SELECT 'Cleanup complete for STF_042' AS status;
SELECT COUNT(*) as remaining_requests 
FROM clearance_requests 
WHERE user_id = (SELECT id FROM users WHERE identifier_id = 'STF_042');
