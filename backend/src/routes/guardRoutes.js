const express = require('express');
const router = express.Router();
const guardController = require('../controllers/guardController');

// POST /api/v1/guard/verify-scan
router.post('/verify-scan', guardController.verifyExitQR);

module.exports = router;