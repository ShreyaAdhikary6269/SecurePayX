const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Transaction = require('../models/Transaction');
const Feedback = require('../models/Feedback');

const VALID_VERDICTS = ['confirmed', 'not_fraud'];
const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

// GET /api/feedback  ->  the logged-in user's own answers
router.get('/', auth, async (req, res) => {
  try {
    const mine = await Feedback.find({ user: req.user.id }).sort({ createdAt: -1 }).lean();

    res.json({
      feedback: mine.map((f) => ({
        id: String(f._id),
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

    if (!OBJECT_ID_RE.test(String(transactionId)) || !VALID_VERDICTS.includes(verdict)) {
      return res.status(400).json({ message: 'transactionId and a valid verdict are required' });
    }

    // Only allow feedback on the user's own transactions
    const tx = await Transaction.findOne({ _id: transactionId, user: req.user.id }).select('_id isFraud');
    if (!tx) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Feedback is only collected for flagged alerts
    if (!tx.isFraud) {
      return res.status(400).json({ message: 'Feedback can only be given on flagged alerts' });
    }

    const saved = await Feedback.findOneAndUpdate(
      { user: req.user.id, transactionId: tx._id },
      { $set: { verdict } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({
      feedback: {
        id: String(saved._id),
        transactionId: String(saved.transactionId),
        verdict: saved.verdict,
        createdAt: saved.createdAt,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not save feedback' });
  }
});

module.exports = router;