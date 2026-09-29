const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Transaction = require('../models/Transaction');
const Feedback = require('../models/Feedback');

const VALID_VERDICTS = ['confirmed', 'not_fraud'];

// POST /api/feedback   body: { transactionId, verdict }
router.post('/', auth, async (req, res) => {
  try {
    const { transactionId, verdict } = req.body;

    if (!transactionId || !VALID_VERDICTS.includes(verdict)) {
      return res.status(400).json({ message: 'transactionId and a valid verdict are required' });
    }

    const mine = await Transaction.find({ user: req.user.id });
    const tx = mine.find((t) => String(t.id) === String(transactionId));
    if (!tx) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const saved = await new Feedback({
      user: req.user.id,
      transactionId: tx.id,
      verdict,
    }).save();

    res.status(201).json({ feedback: saved });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not save feedback' });
  }
});

module.exports = router;