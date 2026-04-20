const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');

/**
 * @route   POST /api/v1/staff/initiate
 * @desc    አዲስ የክሊራንስ ጥያቄ ለማስጀመር
 * @access  Private (Student/Staff)
 */
router.post('/initiate', staffController.initiateStaffClearance);

/**
 * @route   PATCH /api/v1/staff/update-node
 * @desc    የአንድን ቢሮ ሁኔታ ለማዘመን (Approve/Reject)
 * @access  Private (Department Head)
 */
router.patch('/update-node', staffController.updateNodeStatus);

/**
 * @route   GET /api/v1/staff/progress/:user_id
 * @desc    የተጠቃሚውን የክሊራንስ ሂደት በፐርሰንት ለማየት
 * @access  Private (Student/Staff)
 */
router.get('/progress/:user_id', staffController.getClearanceProgress);

/**
 * @route   GET /api/v1/staff/final-qr/:request_id
 * @desc    21ዱም ቢሮዎች ሲያጸድቁ የ QR ኮድ ዳታ ለማመንጨት
 * @access  Private (Student/Staff)
 */
router.get('/final-qr/:request_id', staffController.generateFinalQR);

router.get('/pending', staffController.getPendingApprovals);
router.post('/approve', staffController.approveNode);

module.exports = router;