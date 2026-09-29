const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Transaction = require('../models/Transaction');

// GET /api/alerts?limit=8
router.get('/', auth, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 8, 50);
    const all = await Transaction.find({ user: req.user.id });

    const alerts = all
      .filter((t) => t.isFraud)
      .slice(0, limit)
      .map((t) => ({
        id: t.id,
        paymentType: t.paymentType,
        amount: `$${Number(t.amount || 0).toFixed(2)}`,
        fraudProbability: t.fraudProbability,
        createdAt: t.createdAt,
      }));

    res.json({ alerts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not load alerts' });
  }
});

module.exports = router;