const Anthropic = require('@anthropic-ai/sdk');
const Transaction = require('../models/Transaction');

const MODEL = 'claude-haiku-4-5-20251001'; // fastest model
const MAX_HISTORY = 10;      // last 10 messages sent to the model
const MAX_MESSAGE_LEN = 1000; // characters per message
const MAX_TOKENS = 600;       // cap on reply length

const PAYMENT_TYPE_LABELS = {
  creditcard: 'Credit / debit card',
  paysim: 'Mobile wallet / UPI',
  banksim: 'Banking',
};

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

// Turns the user's transactions into a short text summary for the model.
function buildDataSummary(transactions) {
  if (transactions.length === 0) {
    return 'The user has not checked any transactions yet.';
  }

  const total = transactions.length;
  const fraud = transactions.filter((t) => t.isFraud);
  const fraudRate = ((fraud.length / total) * 100).toFixed(1);

  const byType = {};
  transactions.forEach((t) => {
    const label = PAYMENT_TYPE_LABELS[t.paymentType] || t.paymentType;
    if (!byType[label]) byType[label] = { checked: 0, flagged: 0 };
    byType[label].checked += 1;
    if (t.isFraud) byType[label].flagged += 1;
  });

  const avgProb =
    transactions.reduce((sum, t) => sum + (t.fraudProbability || 0), 0) / total;

  const typeLines = Object.entries(byType)
    .map(([label, s]) => `- ${label}: ${s.checked} checked, ${s.flagged} flagged`)
    .join('\n');

  // Newest first (the model already returns them sorted); rawInput is left out on purpose.
  const recentLines = transactions
    .slice(0, 10)
    .map((t) => {
      const prob =
        t.fraudProbability != null ? `${(t.fraudProbability * 100).toFixed(1)}%` : 'n/a';
      return `- ID ${t.id} | ${PAYMENT_TYPE_LABELS[t.paymentType] || t.paymentType} | $${Number(
        t.amount || 0
      ).toFixed(2)} | fraud probability ${prob} | ${t.isFraud ? 'FLAGGED' : 'cleared'} | ${new Date(
        t.createdAt
      ).toLocaleString()}`;
    })
    .join('\n');

  return [
    `Total checked: ${total}`,
    `Total flagged as fraud: ${fraud.length} (${fraudRate}%)`,
    `Average fraud probability: ${(avgProb * 100).toFixed(1)}%`,
    '',
    'By payment type:',
    typeLines,
    '',
    'Most recent transactions (newest first, up to 10):',
    recentLines,
  ].join('\n');
}

function buildSystemPrompt(dataSummary) {
  return `You are the SecurePayX assistant, built into a payment fraud detection app.

You help the logged-in user with:
1. Understanding their own checked transactions and fraud alerts.
2. General payment fraud safety (phishing, OTP scams, card safety, what to do after a fraud alert).
3. Using the app: Overview (dashboard), Check transaction, Transactions, Fraud alerts, Batch upload, Reports, Profile.

Rules:
- For questions about the user's own transactions or numbers, use ONLY the data below. If the answer is not in the data, say you don't have that information. Never invent transactions, amounts, or statistics.
- A "fraud probability" comes from a machine-learning model. It is a risk score, not proof of fraud. Explain it that way.
- Stay on topic: payments, fraud, security, and this app. Politely decline anything else.
- Never ask for card numbers, PINs, OTPs, or passwords.
- Keep answers short and clear: usually 2 to 5 sentences. Use a short list only when it really helps.
- You are an AI assistant, not a bank or financial advisor. For serious fraud, advise contacting the bank directly.

USER'S TRANSACTION DATA:
${dataSummary}`;
}

// Cleans the history sent by the browser so it is safe to forward.
function cleanHistory(history) {
  if (!Array.isArray(history)) return [];

  const cleaned = history
    .filter(
      (m) =>
        m &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' &&
        m.content.trim() !== ''
    )
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_LEN) }))
    .slice(-MAX_HISTORY);

  // The conversation sent to the model must start with a user message.
  while (cleaned.length > 0 && cleaned[0].role !== 'user') cleaned.shift();
  return cleaned;
}

exports.chat = async (req, res) => {
  try {
    if (!client) {
      return res
        .status(500)
        .json({ message: 'Chatbot is not configured: ANTHROPIC_API_KEY is missing in backend/.env' });
    }

    const { message, history } = req.body;
    if (typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({ message: 'A message is required' });
    }

    const transactions = await Transaction.find({ user: req.user.id });
    const system = buildSystemPrompt(buildDataSummary(transactions));

    const messages = [
      ...cleanHistory(history),
      { role: 'user', content: message.trim().slice(0, MAX_MESSAGE_LEN) },
    ];

    // Stream the reply as plain text so words appear right away.
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system,
      messages,
    });

    stream.on('text', (text) => res.write(text));

    stream.on('error', (err) => {
      console.error('Chat stream error:', err.message);
      if (!res.writableEnded) {
        res.write('\n\nSorry, something went wrong. Please try again.');
        res.end();
      }
    });

    stream.on('end', () => {
      if (!res.writableEnded) res.end();
    });

    // Stop the AI call if the user closes the chat or the page mid-reply.
    res.on('close', () => {
      if (!res.writableEnded) stream.abort();
    });
  } catch (err) {
    console.error('Chat error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Chat failed. Please try again.' });
    } else if (!res.writableEnded) {
      res.end();
    }
  }
};