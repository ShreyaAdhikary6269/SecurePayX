const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    paymentType: { type: String, enum: ['creditcard', 'paysim', 'banksim'], required: true },
    amount: { type: Number, default: 0 },
    fraudProbability: { type: Number },
    isFraud: { type: Boolean, default: false },
    thresholdUsed: { type: Number },
    rawInput: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

transactionSchema.index({ createdAt: -1 });

// Newest first unless a query asks for a different order
transactionSchema.pre('find', function () {
  if (!this.getOptions().sort) this.sort({ createdAt: -1 });
});

module.exports = mongoose.model('Transaction', transactionSchema);