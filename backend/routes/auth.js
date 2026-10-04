const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/authMiddleware');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

function cleanEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

// Register Route (always creates a normal user; the admin comes from seedAdmin.js)
router.post('/register', async (req, res) => {
  const email = cleanEmail(req.body.email);
  const { password } = req.body;

  if (!EMAIL_RE.test(email) || email.length > 254) {
    return res.status(400).json({ message: 'Please enter a valid email address' });
  }
  if (
    typeof password !== 'string' ||
    password.length < MIN_PASSWORD_LENGTH ||
    password.length > MAX_PASSWORD_LENGTH
  ) {
    return res
      .status(400)
      .json({ message: `Password must be ${MIN_PASSWORD_LENGTH} to ${MAX_PASSWORD_LENGTH} characters` });
  }

  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    user = new User({ email, password });
    await user.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  const email = cleanEmail(req.body.email);
  const { password } = req.body;

  if (!email || typeof password !== 'string' || password.length > MAX_PASSWORD_LENGTH) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    // Only people with the right password learn that the account is switched off
    if (user.isActive === false) {
      return res.status(403).json({ message: 'This account has been deactivated. Contact an administrator.' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '8h',
    });

    user.lastLoginAt = new Date();

    res.json({
      token,
      user: { id: user._id, email: user.email, role: user.role || 'user' },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Who am I? The frontend uses this to confirm the role with the server.
router.get('/me', auth, (req, res) => {
  res.json({ user: { id: req.user.id, email: req.user.email, role: req.user.role } });
});

module.exports = router;