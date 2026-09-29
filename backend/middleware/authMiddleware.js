const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('AUTH FAIL: no Bearer header ->', authHeader);
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
    req.user = { id: decoded.id };
    next();
  } catch (err) {
    console.log('AUTH FAIL:', err.message, '| token starts with:', String(token).slice(0, 15));
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};