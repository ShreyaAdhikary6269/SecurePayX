const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Feedback = require('../models/Feedback');
const AuditLog = require('../models/AuditLog');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';
const PAYMENT_TYPES = ['creditcard', 'paysim', 'banksim'];
const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

// ---------- helpers ----------

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toInt(value, fallback, min, max) {
  const n = parseInt(value, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

function pageParams(req, defaultLimit) {
  const page = toInt(req.query.page, 1, 1, 100000);
  const limit = toInt(req.query.limit, defaultLimit, 1, 100);
  return { page, limit, skip: (page - 1) * limit };
}

function pagingInfo(total, page, limit) {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

function utcMidnight(daysAgo = 0) {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysAgo));
}

async function logAction(req, action, target, details) {
  try {
    await AuditLog.create({
      admin: req.user.id,
      adminEmail: req.user.email,
      action,
      targetUser: target ? target._id : undefined,
      targetEmail: target ? target.email : undefined,
      details,
      ip: req.ip,
    });
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
}

function shapeUser(u, counts = {}) {
  return {
    id: String(u._id),
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
    const todayStart = utcMidnight(0);
    const weekStart = utcMidnight(6);

    const [
      totalUsers,
      activeUsers,
      adminCount,
      totalTransactions,
      totalFlagged,
      checksToday,
      flaggedToday,
      byType,
      daily,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: { $ne: false } }),
      User.countDocuments({ role: 'admin' }),
      Transaction.countDocuments(),
      Transaction.countDocuments({ isFraud: true }),
      Transaction.countDocuments({ createdAt: { $gte: todayStart } }),
      Transaction.countDocuments({ isFraud: true, createdAt: { $gte: todayStart } }),
      Transaction.aggregate([
        {
          $group: {
            _id: '$paymentType',
            checked: { $sum: 1 },
            flagged: { $sum: { $cond: ['$isFraud', 1, 0] } },
            avgProbability: { $avg: '$fraudProbability' },
          },
        },
      ]),
      Transaction.aggregate([
        { $match: { createdAt: { $gte: weekStart } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            checked: { $sum: 1 },
            flagged: { $sum: { $cond: ['$isFraud', 1, 0] } },
          },
        },
      ]),
    ]);

    // One entry per day for the last 7 days (UTC), zero when nothing happened
    const dailyMap = new Map(daily.map((d) => [d._id, d]));
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const key = utcMidnight(i).toISOString().slice(0, 10);
      const row = dailyMap.get(key);
      last7Days.push({ date: key, checked: row ? row.checked : 0, flagged: row ? row.flagged : 0 });
    }

    res.json({
      stats: {
        totalUsers,
        activeUsers,
        adminCount,
        totalTransactions,
        totalFlagged,
        fraudRate: totalTransactions ? Number(((totalFlagged / totalTransactions) * 100).toFixed(2)) : 0,
        checksToday,
        flaggedToday,
        byType: byType.map((t) => ({
          paymentType: t._id,
          checked: t.checked,
          flagged: t.flagged,
          avgProbability: t.avgProbability != null ? Number(t.avgProbability.toFixed(4)) : null,
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
    const { page, limit, skip } = pageParams(req, 20);

    const filter = {};
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    if (search) filter.email = { $regex: escapeRegex(search), $options: 'i' };
    if (req.query.role === 'admin') filter.role = 'admin';
    if (req.query.role === 'user') filter.role = { $ne: 'admin' };
    if (req.query.status === 'active') filter.isActive = { $ne: false };
    if (req.query.status === 'inactive') filter.isActive = false;

    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .select('email role isActive createdAt lastLoginAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const ids = users.map((u) => u._id);
    const counts = ids.length
      ? await Transaction.aggregate([
          { $match: { user: { $in: ids } } },
          {
            $group: {
              _id: '$user',
              checked: { $sum: 1 },
              flagged: { $sum: { $cond: ['$isFraud', 1, 0] } },
            },
          },
        ])
      : [];
    const countMap = new Map(counts.map((c) => [String(c._id), c]));

    res.json({
      users: users.map((u) => shapeUser(u, countMap.get(String(u._id)))),
      ...pagingInfo(total, page, limit),
    });
  } catch (err) {
    console.error('Admin users error:', err.message);
    res.status(500).json({ message: 'Could not load users' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!OBJECT_ID_RE.test(id)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

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

    const target = await User.findById(id).select('email role isActive');
    if (!target) return res.status(404).json({ message: 'User not found' });

    const currentRole = target.role || 'user';
    const currentActive = target.isActive !== false;
    const isSelf = String(target._id) === req.user.id;

    const wantsDeactivate = isActive === false && currentActive;
    const wantsDemote = role !== undefined && role !== 'admin' && currentRole === 'admin';

    // Safety rules
    if (isSelf && (wantsDeactivate || wantsDemote)) {
      return res.status(400).json({ message: 'You cannot deactivate or demote your own account' });
    }
    if (currentRole === 'admin' && (wantsDeactivate || wantsDemote)) {
      const otherAdmins = await User.countDocuments({
        role: 'admin',
        isActive: { $ne: false },
        _id: { $ne: target._id },
      });
      if (otherAdmins === 0) {
        return res.status(400).json({ message: 'At least one active admin must remain' });
      }
    }

    const updates = {};
    const changes = {};
    if (isActive !== undefined && isActive !== currentActive) {
      updates.isActive = isActive;
      changes.isActive = { from: currentActive, to: isActive };
    }
    if (role !== undefined && role !== currentRole) {
      updates.role = role;
      changes.role = { from: currentRole, to: role };
    }

    if (Object.keys(updates).length > 0) {
      // updateOne is used on purpose, so the password hook never runs
      await User.updateOne({ _id: target._id }, { $set: updates });

      if (changes.isActive) {
        await logAction(req, isActive ? 'user.reactivate' : 'user.deactivate', target, changes.isActive);
      }
      if (changes.role) {
        await logAction(req, 'user.role_change', target, changes.role);
      }
    }

    const updated = await User.findById(target._id).select('email role isActive createdAt lastLoginAt').lean();
    const [checked, flagged] = await Promise.all([
      Transaction.countDocuments({ user: target._id }),
      Transaction.countDocuments({ user: target._id, isFraud: true }),
    ]);

    res.json({
      user: shapeUser(updated, { checked, flagged }),
      message: Object.keys(updates).length > 0 ? 'User updated' : 'No changes needed',
    });
  } catch (err) {
    console.error('Admin update user error:', err.message);
    res.status(500).json({ message: 'Could not update user' });
  }
};

// ---------- transactions ----------

exports.listTransactions = async (req, res) => {
  try {
    const { page, limit, skip } = pageParams(req, 25);
    const filter = {};

    if (PAYMENT_TYPES.includes(req.query.paymentType)) filter.paymentType = req.query.paymentType;
    if (req.query.isFraud === 'true') filter.isFraud = true;
    if (req.query.isFraud === 'false') filter.isFraud = false;

    const dateFilter = {};
    if (req.query.from) {
      const from = new Date(req.query.from);
      if (!Number.isNaN(from.getTime())) dateFilter.$gte = from;
    }
    if (req.query.to) {
      const to = new Date(req.query.to);
      if (!Number.isNaN(to.getTime())) dateFilter.$lte = new Date(to.getTime() + 24 * 60 * 60 * 1000 - 1);
    }
    if (Object.keys(dateFilter).length) filter.createdAt = dateFilter;

    const amountFilter = {};
    const min = parseFloat(req.query.minAmount);
    const max = parseFloat(req.query.maxAmount);
    if (!Number.isNaN(min)) amountFilter.$gte = min;
    if (!Number.isNaN(max)) amountFilter.$lte = max;
    if (Object.keys(amountFilter).length) filter.amount = amountFilter;

    // Search by user email
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    if (search) {
      const matches = await User.find({ email: { $regex: escapeRegex(search), $options: 'i' } })
        .select('_id')
        .lean();
      filter.user = { $in: matches.map((u) => u._id) };
    }

    const [total, rows] = await Promise.all([
      Transaction.countDocuments(filter),
      Transaction.find(filter)
        .select('-rawInput') // raw model inputs are never sent to the dashboard
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const userIds = [...new Set(rows.map((t) => String(t.user)))];
    const users = userIds.length ? await User.find({ _id: { $in: userIds } }).select('email').lean() : [];
    const emailById = new Map(users.map((u) => [String(u._id), u.email]));

    res.json({
      transactions: rows.map((t) => ({
        id: String(t._id),
        userEmail: emailById.get(String(t.user)) || 'unknown user',
        paymentType: t.paymentType,
        amount: t.amount,
        fraudProbability: t.fraudProbability,
        isFraud: t.isFraud,
        thresholdUsed: t.thresholdUsed,
        createdAt: t.createdAt,
      })),
      ...pagingInfo(total, page, limit),
    });
  } catch (err) {
    console.error('Admin transactions error:', err.message);
    res.status(500).json({ message: 'Could not load transactions' });
  }
};

// ---------- feedback ----------

exports.listFeedback = async (req, res) => {
  try {
    const { page, limit, skip } = pageParams(req, 25);

    const [total, summary, items] = await Promise.all([
      Feedback.countDocuments(),
      Feedback.aggregate([{ $group: { _id: '$verdict', count: { $sum: 1 } } }]),
      Feedback.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ]);

    const countOf = (verdict) => (summary.find((s) => s._id === verdict) || { count: 0 }).count;
    const confirmed = countOf('confirmed');
    const notFraud = countOf('not_fraud');
    const answered = confirmed + notFraud;

    const userIds = [...new Set(items.map((f) => String(f.user)))];
    const txIds = [...new Set(items.map((f) => String(f.transactionId)))];

    const [users, transactions] = await Promise.all([
      userIds.length ? User.find({ _id: { $in: userIds } }).select('email').lean() : [],
      txIds.length
        ? Transaction.find({ _id: { $in: txIds } }).select('paymentType fraudProbability').sort({ createdAt: -1 }).lean()
        : [],
    ]);
    const emailById = new Map(users.map((u) => [String(u._id), u.email]));
    const txById = new Map(transactions.map((t) => [String(t._id), t]));

    res.json({
      summary: {
        total: answered,
        confirmed,
        notFraud,
        falseAlarmRate: answered ? Number(((notFraud / answered) * 100).toFixed(1)) : 0,
      },
      feedback: items.map((f) => {
        const tx = txById.get(String(f.transactionId));
        return {
          id: String(f._id),
          userEmail: emailById.get(String(f.user)) || 'unknown user',
          transactionId: String(f.transactionId),
          paymentType: tx ? tx.paymentType : null,
          fraudProbability: tx ? tx.fraudProbability : null,
          verdict: f.verdict,
          createdAt: f.createdAt,
        };
      }),
      ...pagingInfo(total, page, limit),
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
    const { page, limit, skip } = pageParams(req, 30);
    const [total, entries] = await Promise.all([
      AuditLog.countDocuments(),
      AuditLog.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ]);

    res.json({
      entries: entries.map((e) => ({
        id: String(e._id),
        adminEmail: e.adminEmail,
        action: e.action,
        targetEmail: e.targetEmail || null,
        details: e.details || null,
        ip: e.ip || null,
        createdAt: e.createdAt,
      })),
      ...pagingInfo(total, page, limit),
    });
  } catch (err) {
    console.error('Admin audit log error:', err.message);
    res.status(500).json({ message: 'Could not load the audit log' });
  }
};