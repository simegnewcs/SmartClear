const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authenticate, authorize } = require('../middlewares/auth');

/**
 * @route   GET /api/v1/student/status/:id
 * @desc    የተማሪውን የክሊራንስ ሂደት በ ID መከታተል
 */
router.get('/status/:id', studentController.getStudentStatus);
router.post('/apply', studentController.applyForClearance);

/**
 * @route   POST /api/v1/student/approve-node
 * @desc    Approve/reject student clearance node (Sequential workflow)
 *          Batch Advisor → Chair Holder → Others (Parallel)
 * @access  Staff only
 */
router.post('/approve-node', authenticate, authorize('staff', 'department_head', 'admin'), studentController.approveStudentNode);

module.exports = router;