const path = require('path');
const Transaction = require('../models/Transaction');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';
const ALLOWED_EXTENSIONS = ['.csv', '.txt', '.tsv', '.xlsx', '.xlsm'];
const PAYMENT_CHOICES = ['auto', 'creditcard', 'paysim', 'banksim'];
const MAX_SAVED_ALERTS = 200;

exports.analyzeFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please choose a file to upload' });
    }

    const originalName = path.basename(req.file.originalname || 'upload');
    const extension = path.extname(originalName).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return res.status(400).json({ message: 'Unsupported file type. Upload a .csv or .xlsx file' });
    }

    const paymentType = PAYMENT_CHOICES.includes(req.body.paymentType) ? req.body.paymentType : 'auto';

    const form = new FormData();
    form.append('file', new Blob([req.file.buffer]), originalName);
    form.append('payment_type', paymentType);

    let response;
    try {
      response = await fetch(`${AI_SERVICE_URL}/predict-file`, {
        method: 'POST',
        body: form,
        signal: AbortSignal.timeout(60000),
      });
    } catch (err) {
      console.error('Upload: model service error:', err.message);
      return res.status(502).json({
        message: 'Could not reach the fraud detection service. Is the Python API running on port 8000?',
      });
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 404 || response.status === 405) {
        console.error('Upload: the model service has no /predict-file route (old app.py is running)');
        return res.status(502).json({
          message:
            'The model service is out of date and cannot read files yet. Stop it and start it again with: python api\\app.py',
        });
      }
      const status = response.status >= 500 ? 502 : response.status;
      return res.status(status).json({ message: data.error || 'The model service could not analyse this file' });
    }

    // Optional: keep the flagged rows as alerts in the user's history
    let saved = 0;
    if (req.body.saveFlagged === 'true' && Array.isArray(data.rows)) {
      const threshold = data.summary ? data.summary.threshold : undefined;
      const docs = data.rows
        .filter((r) => r.valid && r.isFraud)
        .slice(0, MAX_SAVED_ALERTS)
        .map((r) => ({
          user: req.user.id,
          paymentType: data.dataset,
          amount: Number((r.fields && (r.fields.Amount ?? r.fields.amount)) || 0) || 0,
          fraudProbability: r.probability,
          isFraud: true,
          thresholdUsed: threshold,
        }));

      if (docs.length > 0) {
        await Transaction.insertMany(docs, { ordered: false });
        saved = docs.length;
      }
    }

    res.json({ ...data, saved, fileName: originalName });
  } catch (err) {
    console.error('Upload error:', err.message);
    res.status(500).json({ message: 'Could not analyse this file' });
  }
};