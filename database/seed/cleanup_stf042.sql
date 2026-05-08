-- ============================================
-- CLEANUP: Start Fresh for STF_042
-- Run this to remove all existing requests
-- ============================================

-- Step 1: Delete all nodes for STF_042's requests
DELETE FROM staff_clearance_nodes 
WHERE request_id IN (
    SELECT id FROM clearance_requests 
    WHERE user_id = (SELECT id FROM users WHERE identifier_id = 'STF_042')
);

-- Step 2: Delete all clearance requests for STF_042
DELETE FROM clearance_requests 
WHERE user_id = (SELECT id FROM users WHERE identifier_id = 'STF_042');

-- Step 3: Verify cleanup
SELECT 'STF_042 requests deleted' AS status;

-- Now when you login as STF_042, you'll see "Apply for Clearance" button
