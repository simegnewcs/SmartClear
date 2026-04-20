const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// 🛡️ Middleware ማሳሰቢያ፡ 
// እዚህ ጋር 'protect' እና 'restrictTo' (admin) የሚባሉ Middleware-ዎች ቢኖሩህ ይመከራል
// ለጊዜው ግን ያለምንም ገደብ እንዲሰራ እንዲህ አድርጌዋለሁ፡

/**
 * @route   GET /api/v1/admin/stats
 * @desc    የዳሽቦርድ አናት ላይ ያሉ ካርዶች ዳታ (Analytics)
 */
router.get('/stats', adminController.getDashboardStats);

/**
 * @route   GET /api/v1/admin/clearance-requests
 * @desc    ሁሉንም የክሊራንስ ጥያቄዎች ዝርዝር ማምጣት
 */
router.get('/clearance-requests', adminController.getClearanceRequests);

/**
 * @route   PATCH /api/v1/admin/update-status/:id
 * @desc    የአንድን ተማሪ ጥያቄ ማጽደቅ ወይም ውድቅ ማድረግ
 */
router.patch('/update-status/:id', adminController.updateRequestStatus);

/**
 * @route   POST /api/v1/admin/users
 * @desc    አዲስ አድሚን፣ ሰራተኛ ወይም ተማሪ መመዝገብ
 */
router.post('/users', adminController.createUser);

module.exports = router;