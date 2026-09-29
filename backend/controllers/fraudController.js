const Transaction = require('../models/Transaction');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

exports.predict = async (req, res) => {
  const { type } = req.params;
  const payload = req.body;

  try {
    const response = await fetch(`${AI_SERVICE_URL}/predict/${type}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    // Log this check so it shows up on Transactions / Dashboard
    const amount = Number(payload.Amount ?? payload.amount ?? 0);

    const tx = new Transaction({
      user: req.user.id,
      paymentType: type,
      amount,
      fraudProbability: data.fraud_probability,
      isFraud: data.is_fraud,
      thresholdUsed: data.threshold_used,
      rawInput: payload,
    });
    await tx.save();

    res.json(data);
  } catch (err) {
    console.error('Fraud service error:', err.message);
    res.status(500).json({
      message: 'Could not reach the fraud detection service. Is the Python API running on port 8000?',
    });
  }
};