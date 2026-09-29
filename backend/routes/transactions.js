const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { getTransactions } = require('../controllers/transactionController');

router.get('/', auth, getTransactions);

module.exports = router;