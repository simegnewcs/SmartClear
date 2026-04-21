const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

// GET /api/v1/notifications/:userId
router.get('/:userId', notificationController.getUserNotifications);
// Add route in backend/src/routes/notificationRoutes.js
router.post('/clearance-expired', notificationController.notifyClearanceExpired);
module.exports = router;