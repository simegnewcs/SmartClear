// backend/src/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Existing routes
router.get('/stats', adminController.getDashboardStats);
router.get('/clearance-requests', adminController.getClearanceRequests);
router.patch('/update-status/:id', adminController.updateRequestStatus);
router.post('/users', adminController.createUser);

// NEW: Staff-specific admin routes
router.get('/staff-requests', adminController.getStaffClearanceRequests);
router.get('/staff-stats', adminController.getStaffDashboardStats);

module.exports = router;