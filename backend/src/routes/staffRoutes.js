// backend/src/routes/staffRoutes.js
const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const { authenticate, authorize } = require('../middlewares/auth');

// Public routes (no auth required)
router.get('/officers', staffController.getApprovingOfficers);

// All staff routes below require authentication
router.use(authenticate);

// Staff Clearance Application Routes (for staff applying for clearance)
router.post('/initiate', authorize('staff', 'department_head'), staffController.initiateStaffClearance);
router.get('/progress/:user_id', staffController.getStaffClearanceProgress);

// Initial Approval Routes (for supervisors/approving officers)
router.patch('/initial-approval', authorize('admin', 'department_head', 'supervisor', 'staff'), staffController.processInitialApproval);
router.get('/pending-initial', authorize('admin', 'department_head', 'supervisor', 'staff'), staffController.getPendingInitialApprovals);

// ============================================================
// ROLE-BASED APPROVAL DASHBOARD ROUTES
// For Student Approval Team (8 staff) and Additional Team (21 staff)
// ============================================================

// Staff Dashboard - Shows summary for the logged-in staff
router.get('/dashboard', authorize('staff', 'department_head', 'admin'), staffController.getStaffDashboard);

// My Pending Approvals - Only shows requests for the staff's assigned node
router.get('/my-pending-approvals', authorize('staff', 'department_head'), staffController.getMyPendingApprovals);

// Approve/Reject Request - Staff can only act on their assigned node
router.post('/approve-request', authorize('staff', 'department_head'), staffController.approveRequest);

// Get Approval History for a request
router.get('/approval-history/:request_id', authorize('staff', 'department_head', 'admin', 'student'), staffController.getApprovalHistory);

// Legacy Node Approval Routes (can be accessed by admin or staff with node access)
router.get('/pending', authorize('staff', 'department_head', 'admin'), staffController.getPendingStaffApprovals);
router.patch('/update-node', authorize('staff', 'department_head', 'admin'), staffController.updateStaffNodeStatus);
router.get('/final-qr/:request_id', authorize('staff', 'department_head', 'admin'), staffController.generateStaffFinalQR);

module.exports = router;