require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/Auth');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

// No database connection for now - using in-memory storage in
// models/User.js and models/Transaction.js. Data resets on restart.

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/', (req, res) => {
  res.send('SecurePayX backend is running (in-memory mode, no database)');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));