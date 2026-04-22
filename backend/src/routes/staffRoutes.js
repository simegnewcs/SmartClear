// backend/src/routes/staffRoutes.js
const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');

// Staff Clearance Routes (21 nodes)

// POST /api/v1/staff/initiate - Start staff clearance
router.post('/initiate', staffController.initiateStaffClearance);

// PATCH /api/v1/staff/update-node - Update a node status
router.patch('/update-node', staffController.updateStaffNodeStatus);

// GET /api/v1/staff/progress/:user_id - Get clearance progress
router.get('/progress/:user_id', staffController.getStaffClearanceProgress);

// GET /api/v1/staff/final-qr/:request_id - Generate final QR
router.get('/final-qr/:request_id', staffController.generateStaffFinalQR);

// GET /api/v1/staff/pending - Get pending approvals for a node
router.get('/pending', staffController.getPendingStaffApprovals);

// POST /api/v1/staff/approve - Approve a node
router.post('/approve', staffController.approveStaffNode);

// GET /api/v1/staff/summary - Get all staff clearance summary (Admin)
router.get('/summary', staffController.getStaffClearanceSummary);

module.exports = router;