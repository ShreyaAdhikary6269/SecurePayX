const rateLimit = require('express-rate-limit');

function makeLimiter({ windowMs, limit, message, skipSuccessfulRequests = false }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    message: { message },
  });
}

// Everything under /api. Generous, because the dashboard refreshes alerts every few seconds.
exports.apiLimiter = makeLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 1500,
  message: 'Too many requests. Please slow down and try again shortly.',
});

// Login: only failed attempts count, which stops password guessing.
exports.loginLimiter = makeLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  message: 'Too many failed login attempts. Please try again in 15 minutes.',
});

// Registration: stops bulk fake-account creation.
exports.registerLimiter = makeLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  message: 'Too many sign-ups from this address. Please try again later.',
});

// Chatbot: protects your free AI quota.
exports.chatLimiter = makeLimiter({
  windowMs: 60 * 1000,
  limit: 12,
  message: 'You are sending messages too quickly. Please wait a moment.',
});