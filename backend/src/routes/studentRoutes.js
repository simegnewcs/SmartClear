const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');

/**
 * @route   GET /api/v1/student/status/:id
 * @desc    የተማሪውን የክሊራንስ ሂደት በ ID መከታተል
 */
router.get('/status/:id', studentController.getStudentStatus);
router.post('/apply', studentController.applyForClearance);
module.exports = router;