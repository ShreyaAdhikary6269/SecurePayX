const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { chat } = require('../controllers/chatController');

// POST /api/chat   body: { message, history }
router.post('/', auth, chat);

module.exports = router;