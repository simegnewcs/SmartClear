const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
// ለወደፊት ፕሮፋይል ቼክ ለማድረግ Middleware ካስፈለገ እዚህ ጋር ማስገባት ትችላለህ
// const { protect } = require('../middleware/authMiddleware');

/**
 * @route   POST /api/v1/auth/login
 * @desc    ተጠቃሚን በ Identifier ID እና በይለፍ ቃል ማረጋገጥ
 * @access  Public
 */
router.post('/login', authController.login);

/**
 * @route   GET /api/v1/auth/me
 * @desc    የገባውን ተጠቃሚ መረጃ በToken ማግኘት
 * @access  Private
 */
// router.get('/me', protect, authController.getMe); 

module.exports = router;