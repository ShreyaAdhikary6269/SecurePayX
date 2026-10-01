const { GoogleGenAI } = require('@google/genai');
const Transaction = require('../models/Transaction');

// Model name can be overridden in backend/.env with GEMINI_MODEL=...
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
const MAX_HISTORY = 10;       // last 10 messages sent to the model
const MAX_MESSAGE_LEN = 1000; // characters per message
const MAX_TOKENS = 600;       // cap on reply length

const PAYMENT_TYPE_LABELS = {
  creditcard: 'Credit / debit card',
  paysim: 'Mobile wallet / UPI',
  banksim: 'Banking',
};

const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
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

// Cleans the history sent by the browser and converts it to Gemini's format.
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

  // The conversation must start with a user message.
  while (cleaned.length > 0 && cleaned[0].role !== 'user') cleaned.shift();

  // Gemini calls the assistant role "model".
  return cleaned.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
}

exports.chat = async (req, res) => {
  try {
    if (!ai) {
      return res
        .status(500)
        .json({ message: 'Chatbot is not configured: GEMINI_API_KEY is missing in backend/.env' });
    }

    const { message, history } = req.body;
    if (typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({ message: 'A message is required' });
    }

    const transactions = await Transaction.find({ user: req.user.id });
    const system = buildSystemPrompt(buildDataSummary(transactions));

    const contents = [
      ...cleanHistory(history),
      { role: 'user', parts: [{ text: message.trim().slice(0, MAX_MESSAGE_LEN) }] },
    ];

    // Stream the reply as plain text so words appear right away.
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    let clientClosed = false;
    res.on('close', () => {
      if (!res.writableEnded) clientClosed = true;
    });

    try {
      const stream = await ai.models.generateContentStream({
        model: MODEL,
        contents,
        config: {
          systemInstruction: system,
          maxOutputTokens: MAX_TOKENS,
        },
      });

      for await (const chunk of stream) {
        if (clientClosed) break; // user closed the chat mid-reply
        if (chunk.text) res.write(chunk.text);
      }
    } catch (err) {
      console.error('Chat stream error:', err.message);
      const msg = err.message || '';
      let reply = '\n\nSorry, something went wrong. Please try again.';
      if (/429|quota|rate limit|RESOURCE_EXHAUSTED/i.test(msg)) {
        reply = '\n\nThe free AI limit was reached. Please wait a minute and try again.';
      } else if (/NOT_FOUND|no longer available|404/i.test(msg)) {
        reply = '\n\nThe AI model name is outdated. Update GEMINI_MODEL in the backend .env file.';
      }
      if (!res.writableEnded && !clientClosed) res.write(reply);
    }

    if (!res.writableEnded) res.end();
  } catch (err) {
    console.error('Chat error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Chat failed. Please try again.' });
    } else if (!res.writableEnded) {
      res.end();
    }
  }
};