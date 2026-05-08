// backend/src/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middlewares/auth');

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// Dashboard & Analytics
router.get('/stats', adminController.getDashboardStats);
router.get('/staff-stats', adminController.getStaffDashboardStats);

// Clearance Request Management
router.get('/clearance-requests', adminController.getClearanceRequests);
router.get('/clearance-requests/:id/details', adminController.getClearanceDetails);
router.get('/staff-requests', adminController.getStaffClearanceRequests);
router.patch('/update-status/:id', adminController.updateRequestStatus);

// User Management
router.post('/users', adminController.createUser);

// Department & Approver Management
router.get('/departments', adminController.getDepartments);
router.post('/assign-approver', adminController.assignApprover);

// Audit Logs
router.get('/audit-logs', adminController.getAuditLogs);

module.exports = router;