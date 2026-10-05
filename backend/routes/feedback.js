const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Transaction = require('../models/Transaction');
const Feedback = require('../models/Feedback');

const VALID_VERDICTS = ['confirmed', 'not_fraud'];

// GET /api/feedback  ->  the logged-in user's own answers
router.get('/', auth, async (req, res) => {
  try {
    const mine = await Feedback.find({ user: req.user.id });

    res.json({
      feedback: mine.map((f) => ({
        id: f.id,
        transactionId: String(f.transactionId),
        verdict: f.verdict,
        createdAt: f.createdAt,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not load your feedback' });
  }
});

// POST /api/feedback   body: { transactionId, verdict }
router.post('/', auth, async (req, res) => {
  try {
    const { transactionId, verdict } = req.body;

    if (!transactionId || !VALID_VERDICTS.includes(verdict)) {
      return res.status(400).json({ message: 'transactionId and a valid verdict are required' });
    }

    // Only allow feedback on the user's own transactions
    const mine = await Transaction.find({ user: req.user.id });
    const tx = mine.find((t) => String(t.id) === String(transactionId));
    if (!tx) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Feedback is only collected for flagged alerts
    if (!tx.isFraud) {
      return res.status(400).json({ message: 'Feedback can only be given on flagged alerts' });
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