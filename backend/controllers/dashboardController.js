const Transaction = require('../models/Transaction');

exports.getStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // find() already returns newest-first (see Transaction.js) - no .sort() needed here
    const transactions = await Transaction.find({ user: userId });

    const totalChecked = transactions.length;
    const totalFraud = transactions.filter((t) => t.isFraud).length;
    const fraudRate = totalChecked > 0 ? (totalFraud / totalChecked) * 100 : 0;

    const byType = {};
    transactions.forEach((t) => {
      byType[t.paymentType] = (byType[t.paymentType] || 0) + 1;
    });

    const activeTypes = Object.keys(byType).length;

    const recentTransactions = transactions.slice(0, 8).map((t) => ({
      id: t._id,
      paymentType: t.paymentType,
      amount: `$${t.amount.toFixed(2)}`,
      isFraud: t.isFraud,
      checkedAt: t.createdAt.toLocaleString(),
    }));

    res.json({
      stats: { totalChecked, totalFraud, fraudRate, activeTypes, byType },
      recentTransactions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};