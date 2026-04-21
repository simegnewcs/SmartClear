const express = require('express');
const router = express.Router();
const guardController = require('../controllers/guardController');

// POST /api/v1/guard/verify-scan
router.post('/verify-scan', guardController.verifyExitQR);
// Add route in backend/src/routes/guardRoutes.js
router.get('/verify-student/:userId', guardController.verifyStudentById);
module.exports = router;