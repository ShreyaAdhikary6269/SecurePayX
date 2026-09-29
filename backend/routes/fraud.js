const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { predict } = require('../controllers/fraudController');

router.post('/predict/:type', auth, predict);

module.exports = router;