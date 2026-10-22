const express = require('express');
const { chat } = require('../controllers/aiController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// All AI endpoints require JWT authentication
router.use(protect);

/**
 * @route   POST /api/v1/ai/chat
 * @desc    Send a natural-language message to the AI financial assistant
 * @body    { message: string }
 * @returns { response: string, toolsUsed: string[] }
 * @access  Private (Protected)
 */
router.post('/chat', chat);

module.exports = router;
