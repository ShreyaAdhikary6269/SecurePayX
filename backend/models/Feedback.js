const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction', required: true },
    verdict: { type: String, enum: ['confirmed', 'not_fraud'], required: true },
  },
  { timestamps: true }
);

// One verdict per user per transaction
feedbackSchema.index({ user: 1, transactionId: 1 }, { unique: true });

module.exports = mongoose.model('Feedback', feedbackSchema);