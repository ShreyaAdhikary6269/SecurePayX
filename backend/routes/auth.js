const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const auth = require('../middleware/authMiddleware');
const { checkPassword, MAX_LENGTH } = require('../utils/passwordPolicy');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

// Used so that a login for an unknown email takes as long as a real one
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password-1', 12);

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

  const passwordProblem = checkPassword(password, email);
  if (passwordProblem) {
    return res.status(400).json({ message: passwordProblem });
  }

  try {
    const existing = await User.findOne({ email }).select('_id');
    if (existing) return res.status(400).json({ message: 'User already exists' });

    await new User({ email, password }).save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'User already exists' });
    }
    console.error('Register error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  const email = cleanEmail(req.body.email);
  const { password } = req.body;

  if (!email || typeof password !== 'string' || password.length > MAX_LENGTH) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      await bcrypt.compare(password, DUMMY_HASH); // same time cost as a real check
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Locked after too many wrong passwords
    if (user.lockUntil && user.lockUntil > new Date()) {
      const minutes = Math.ceil((user.lockUntil - new Date()) / 60000);
      return res.status(429).json({
        message: `Too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`,
      });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      const attempts = (user.failedLoginAttempts || 0) + 1;

      if (attempts >= MAX_FAILED_ATTEMPTS) {
        await User.updateOne(
          { _id: user._id },
          { $set: { failedLoginAttempts: 0, lockUntil: new Date(Date.now() + LOCK_MINUTES * 60000) } }
        );
        return res.status(429).json({
          message: `Too many failed attempts. This account is locked for ${LOCK_MINUTES} minutes.`,
        });
      }

      await User.updateOne({ _id: user._id }, { $set: { failedLoginAttempts: attempts } });
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Only people with the right password learn that the account is switched off
    if (user.isActive === false) {
      return res.status(403).json({ message: 'This account has been deactivated. Contact an administrator.' });
    }

    const token = jwt.sign({ id: String(user._id) }, process.env.JWT_SECRET, {
      expiresIn: '8h',
    });

    await User.updateOne(
      { _id: user._id },
      { $set: { failedLoginAttempts: 0, lastLoginAt: new Date() }, $unset: { lockUntil: 1 } }
    );

    res.json({
      token,
      user: { id: String(user._id), email: user.email, role: user.role || 'user' },
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