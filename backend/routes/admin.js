const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/adminMiddleware');
const admin = require('../controllers/adminController');

// Every route below needs a valid login AND the admin role.
router.use(auth, requireAdmin);

router.get('/stats', admin.getStats);
router.get('/users', admin.listUsers);
router.patch('/users/:id', admin.updateUser);
router.get('/transactions', admin.listTransactions);
router.get('/feedback', admin.listFeedback);
router.get('/models', admin.getModels);
router.get('/audit-log', admin.getAuditLog);

module.exports = router;