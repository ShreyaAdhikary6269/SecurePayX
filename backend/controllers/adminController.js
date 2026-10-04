const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Feedback = require('../models/Feedback');
const AuditLog = require('../models/AuditLog');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';
const PAYMENT_TYPES = ['creditcard', 'paysim', 'banksim'];

// ---------- helpers ----------

function toInt(value, fallback, min, max) {
  const n = parseInt(value, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

function paginate(items, req, defaultLimit) {
  const page = toInt(req.query.page, 1, 1, 100000);
  const limit = toInt(req.query.limit, defaultLimit, 1, 100);
  const total = items.length;
  const start = (page - 1) * limit;
  return {
    rows: items.slice(start, start + limit),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

function utcMidnight(daysAgo = 0) {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysAgo));
}

function dayKey(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function text(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

async function logAction(req, action, target, details) {
  try {
    await AuditLog.record({
      adminId: req.user.id,
      adminEmail: req.user.email,
      action,
      targetId: target ? target.id : undefined,
      targetEmail: target ? target.email : undefined,
      details,
      ip: req.ip,
    });
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
}

// Number of checked / flagged transactions per user id
function countByUser(transactions) {
  const map = new Map();
  transactions.forEach((t) => {
    const row = map.get(t.user) || { checked: 0, flagged: 0 };
    row.checked += 1;
    if (t.isFraud) row.flagged += 1;
    map.set(t.user, row);
  });
  return map;
}

function shapeUser(u, counts = {}) {
  return {
    id: u.id,
    email: u.email,
    role: u.role || 'user',
    isActive: u.isActive !== false,
    createdAt: u.createdAt,
    lastLoginAt: u.lastLoginAt || null,
    checked: counts.checked || 0,
    flagged: counts.flagged || 0,
  };
}

// ---------- overview ----------

exports.getStats = async (req, res) => {
  try {
    const [users, transactions] = await Promise.all([User.all(), Transaction.findAll()]);
    const todayStart = utcMidnight(0);

    const flagged = transactions.filter((t) => t.isFraud);
    const checksToday = transactions.filter((t) => t.createdAt >= todayStart);

    const byTypeMap = new Map();
    transactions.forEach((t) => {
      const row = byTypeMap.get(t.paymentType) || {
        paymentType: t.paymentType,
        checked: 0,
        flagged: 0,
        probSum: 0,
        probCount: 0,
      };
      row.checked += 1;
      if (t.isFraud) row.flagged += 1;
      if (t.fraudProbability != null) {
        row.probSum += t.fraudProbability;
        row.probCount += 1;
      }
      byTypeMap.set(t.paymentType, row);
    });

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const key = dayKey(utcMidnight(i));
      const dayRows = transactions.filter((t) => dayKey(t.createdAt) === key);
      last7Days.push({
        date: key,
        checked: dayRows.length,
        flagged: dayRows.filter((t) => t.isFraud).length,
      });
    }

    res.json({
      stats: {
        totalUsers: users.length,
        activeUsers: users.filter((u) => u.isActive !== false).length,
        adminCount: users.filter((u) => u.role === 'admin').length,
        totalTransactions: transactions.length,
        totalFlagged: flagged.length,
        fraudRate: transactions.length
          ? Number(((flagged.length / transactions.length) * 100).toFixed(2))
          : 0,
        checksToday: checksToday.length,
        flaggedToday: checksToday.filter((t) => t.isFraud).length,
        byType: [...byTypeMap.values()].map((r) => ({
          paymentType: r.paymentType,
          checked: r.checked,
          flagged: r.flagged,
          avgProbability: r.probCount ? Number((r.probSum / r.probCount).toFixed(4)) : null,
        })),
        last7Days,
        note: 'Days are in UTC.',
      },
    });
  } catch (err) {
    console.error('Admin stats error:', err.message);
    res.status(500).json({ message: 'Could not load statistics' });
  }
};

// ---------- users ----------

exports.listUsers = async (req, res) => {
  try {
    const [allUsers, transactions] = await Promise.all([User.all(), Transaction.findAll()]);

    const search = text(req.query.search);
    let users = allUsers;
    if (search) users = users.filter((u) => u.email.toLowerCase().includes(search));
    if (['user', 'admin'].includes(req.query.role)) users = users.filter((u) => (u.role || 'user') === req.query.role);
    if (req.query.status === 'active') users = users.filter((u) => u.isActive !== false);
    if (req.query.status === 'inactive') users = users.filter((u) => u.isActive === false);

    const counts = countByUser(transactions);
    const { rows, ...paging } = paginate(users, req, 20);

    res.json({ users: rows.map((u) => shapeUser(u, counts.get(u.id))), ...paging });
  } catch (err) {
    console.error('Admin users error:', err.message);
    res.status(500).json({ message: 'Could not load users' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'User not found' });

    const { isActive, role } = req.body || {};
    if (isActive === undefined && role === undefined) {
      return res.status(400).json({ message: 'Nothing to update' });
    }
    if (isActive !== undefined && typeof isActive !== 'boolean') {
      return res.status(400).json({ message: 'isActive must be true or false' });
    }
    if (role !== undefined && !['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: "role must be 'user' or 'admin'" });
    }

    const currentRole = target.role || 'user';
    const currentActive = target.isActive !== false;
    const isSelf = target.id === req.user.id;

    const wantsDeactivate = isActive === false && currentActive;
    const wantsDemote = role !== undefined && role !== 'admin' && currentRole === 'admin';

    // Safety rules
    if (isSelf && (wantsDeactivate || wantsDemote)) {
      return res.status(400).json({ message: 'You cannot deactivate or demote your own account' });
    }
    if (currentRole === 'admin' && (wantsDeactivate || wantsDemote)) {
      const allUsers = await User.all();
      const otherAdmins = allUsers.filter(
        (u) => u.role === 'admin' && u.isActive !== false && u.id !== target.id
      ).length;
      if (otherAdmins === 0) {
        return res.status(400).json({ message: 'At least one active admin must remain' });
      }
    }

    let changed = false;

    if (isActive !== undefined && isActive !== currentActive) {
      target.isActive = isActive;
      changed = true;
      await logAction(req, isActive ? 'user.reactivate' : 'user.deactivate', target, {
        from: currentActive,
        to: isActive,
      });
    }
    if (role !== undefined && role !== currentRole) {
      target.role = role;
      changed = true;
      await logAction(req, 'user.role_change', target, { from: currentRole, to: role });
    }

    const mine = await Transaction.find({ user: target.id });
    const counts = { checked: mine.length, flagged: mine.filter((t) => t.isFraud).length };

    res.json({ user: shapeUser(target, counts), message: changed ? 'User updated' : 'No changes needed' });
  } catch (err) {
    console.error('Admin update user error:', err.message);
    res.status(500).json({ message: 'Could not update user' });
  }
};

// ---------- transactions ----------

exports.listTransactions = async (req, res) => {
  try {
    const [users, allTransactions] = await Promise.all([User.all(), Transaction.findAll()]);
    const emailById = new Map(users.map((u) => [u.id, u.email]));

    let rows = allTransactions;

    if (PAYMENT_TYPES.includes(req.query.paymentType)) {
      rows = rows.filter((t) => t.paymentType === req.query.paymentType);
    }
    if (req.query.isFraud === 'true') rows = rows.filter((t) => t.isFraud === true);
    if (req.query.isFraud === 'false') rows = rows.filter((t) => t.isFraud === false);

    if (req.query.from) {
      const from = new Date(req.query.from);
      if (!Number.isNaN(from.getTime())) rows = rows.filter((t) => t.createdAt >= from);
    }
    if (req.query.to) {
      const to = new Date(req.query.to);
      if (!Number.isNaN(to.getTime())) {
        const endOfDay = new Date(to.getTime() + 24 * 60 * 60 * 1000 - 1);
        rows = rows.filter((t) => t.createdAt <= endOfDay);
      }
    }

    const min = parseFloat(req.query.minAmount);
    const max = parseFloat(req.query.maxAmount);
    if (!Number.isNaN(min)) rows = rows.filter((t) => Number(t.amount) >= min);
    if (!Number.isNaN(max)) rows = rows.filter((t) => Number(t.amount) <= max);

    const search = text(req.query.search);
    if (search) {
      rows = rows.filter((t) => (emailById.get(t.user) || '').toLowerCase().includes(search));
    }

    const { rows: pageRows, ...paging } = paginate(rows, req, 25);

    res.json({
      transactions: pageRows.map((t) => ({
        id: t.id,
        userEmail: emailById.get(t.user) || 'unknown user',
        paymentType: t.paymentType,
        amount: t.amount,
        fraudProbability: t.fraudProbability,
        isFraud: t.isFraud,
        thresholdUsed: t.thresholdUsed,
        createdAt: t.createdAt,
        // rawInput is deliberately not sent to the dashboard
      })),
      ...paging,
    });
  } catch (err) {
    console.error('Admin transactions error:', err.message);
    res.status(500).json({ message: 'Could not load transactions' });
  }
};

// ---------- feedback ----------

exports.listFeedback = async (req, res) => {
  try {
    const [feedbackList, users, transactions] = await Promise.all([
      Feedback.findAll(),
      User.all(),
      Transaction.findAll(),
    ]);
    const emailById = new Map(users.map((u) => [u.id, u.email]));
    const txById = new Map(transactions.map((t) => [t.id, t]));

    const confirmed = feedbackList.filter((f) => f.verdict === 'confirmed').length;
    const notFraud = feedbackList.filter((f) => f.verdict === 'not_fraud').length;
    const total = feedbackList.length;

    const { rows, ...paging } = paginate(feedbackList, req, 25);

    res.json({
      summary: {
        total,
        confirmed,
        notFraud,
        falseAlarmRate: total ? Number(((notFraud / total) * 100).toFixed(1)) : 0,
      },
      feedback: rows.map((f) => {
        const tx = txById.get(String(f.transactionId));
        return {
          id: f.id,
          userEmail: emailById.get(f.user) || 'unknown user',
          transactionId: String(f.transactionId),
          paymentType: tx ? tx.paymentType : null,
          fraudProbability: tx ? tx.fraudProbability : null,
          verdict: f.verdict,
          createdAt: f.createdAt,
        };
      }),
      ...paging,
    });
  } catch (err) {
    console.error('Admin feedback error:', err.message);
    res.status(500).json({ message: 'Could not load feedback' });
  }
};

// ---------- model status ----------

exports.getModels = async (req, res) => {
  try {
    const response = await fetch(`${AI_SERVICE_URL}/model-info`, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error(`Model service returned ${response.status}`);
    res.json(await response.json());
  } catch (err) {
    console.error('Admin model info error:', err.message);
    res.json({
      status: 'unreachable',
      message: 'The model service is not reachable. Is the Python API running on port 8000?',
      models: {},
    });
  }
};

// ---------- audit log ----------

exports.getAuditLog = async (req, res) => {
  try {
    const entries = await AuditLog.findAll();
    const { rows, ...paging } = paginate(entries, req, 30);

    res.json({
      entries: rows.map((e) => ({
        id: e.id,
        adminEmail: e.adminEmail,
        action: e.action,
        targetEmail: e.targetEmail || null,
        details: e.details || null,
        ip: e.ip || null,
        createdAt: e.createdAt,
      })),
      ...paging,
    });
  } catch (err) {
    console.error('Admin audit log error:', err.message);
    res.status(500).json({ message: 'Could not load the audit log' });
  }
};