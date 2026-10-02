const Transaction = require('../models/Transaction');

// Address of the Python model API. Override with AI_SERVICE_URL in backend/.env
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';
const AI_TIMEOUT_MS = 15000;

exports.predict = async (req, res) => {
  const { type } = req.params;
  const payload = req.body;

  try {
    const response = await fetch(`${AI_SERVICE_URL}/predict/${type}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(AI_TIMEOUT_MS),
    });

    const data = await response.json();

    if (!response.ok) {
      // The Python API reports errors as { error }, the frontend reads { message }
      return res.status(response.status).json({
        message: data.message || data.error || 'The fraud detection service returned an error',
      });
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