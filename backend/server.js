require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/Auth');
const dashboardRoutes = require('./routes/dashboard');
const transactionRoutes = require('./routes/transactions');
const fraudRoutes = require('./routes/fraud');
const alertRoutes = require('./routes/alerts');
const feedbackRoutes = require('./routes/feedback');
const chatRoutes = require('./routes/chat');

const app = express();

// No database connection - using in-memory storage in models/.
// Data resets when this server restarts.

app.use(cors());
app.use(express.json());

// Log every request, except the alert polling (it runs every few seconds)
app.use((req, res, next) => {
  const isAlertPolling = req.method === 'GET' && req.originalUrl.startsWith('/api/alerts');
  if (!isAlertPolling) console.log(`${req.method} ${req.originalUrl}`);
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/fraud', fraudRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/chat', chatRoutes);

app.get('/', (req, res) => {
  res.send('SecurePayX backend is running (in-memory mode, no database)');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));