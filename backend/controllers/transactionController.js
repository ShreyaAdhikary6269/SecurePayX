const Transaction = require('../models/Transaction');

exports.getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id });

    const formatted = transactions.map((t) => ({
      id: t.id,
      paymentType: t.paymentType,
      amount: `$${Number(t.amount || 0).toFixed(2)}`,
      fraudProbability: t.fraudProbability,
      isFraud: t.isFraud,
      checkedAt: t.createdAt.toLocaleString(),
      createdAt: t.createdAt, // the time-of-day chart and date filters need this
    }));

    res.json({ transactions: formatted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};