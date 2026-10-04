require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Refuse to start with a missing login secret instead of using a weak default
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET is missing or too short (use at least 32 characters). Set it in backend/.env.');
  process.exit(1);
}

const seedAdmin = require('./seedAdmin');
const { apiLimiter, loginLimiter, registerLimiter, chatLimiter } = require('./middleware/rateLimiters');

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const transactionRoutes = require('./routes/transactions');
const fraudRoutes = require('./routes/fraud');
const alertRoutes = require('./routes/alerts');
const feedbackRoutes = require('./routes/feedback');
const chatRoutes = require('./routes/chat');
const adminRoutes = require('./routes/admin');

const app = express();

// No database connection - using in-memory storage in models/.
// Data resets when this server restarts.

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '2mb' }));

// Log every request, except the alert polling (it runs every few seconds)
app.use((req, res, next) => {
  const isAlertPolling = req.method === 'GET' && req.originalUrl.startsWith('/api/alerts');
  if (!isAlertPolling) console.log(`${req.method} ${req.originalUrl}`);
  next();
});

// Rate limiting
app.use('/api', apiLimiter);
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', registerLimiter);
app.use('/api/chat', chatLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/fraud', fraudRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
  res.send('SecurePayX backend is running (in-memory mode, no database)');
});

const PORT = process.env.PORT || 5000;

seedAdmin()
  .catch((err) => console.error('Admin seeding failed:', err.message))
  .finally(() => app.listen(PORT, () => console.log(`Server running on port ${PORT}`)));