const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function (req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch (err) {
    console.log('AUTH FAIL:', err.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  try {
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'This account no longer exists. Please log in again.' });
    }
    if (user.isActive === false) {
      return res.status(403).json({ message: 'This account has been deactivated' });
    }

    req.user = { id: user._id, email: user.email, role: user.role || 'user' };
    next();
  } catch (err) {
    console.error('Auth lookup error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
};