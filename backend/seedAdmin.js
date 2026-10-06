const User = require('./models/User');

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';

  if (!email || !password) {
    console.log('Admin seeding skipped: set ADMIN_EMAIL and ADMIN_PASSWORD in backend/.env to get an admin account.');
    return;
  }
  if (password.length < 8) {
    console.error('ADMIN_PASSWORD must be at least 8 characters. Admin account was not created.');
    return;
  }

  const existing = await User.findOne({ email }).select('_id role isActive');

  if (existing) {
    // Make sure this account is an active admin (the password is left as it is)
    if (existing.role !== 'admin' || existing.isActive === false) {
      await User.updateOne({ _id: existing._id }, { $set: { role: 'admin', isActive: true } });
    }
    console.log(`Admin account ready: ${email}`);
    return;
  }

  await User.create({ email, password, role: 'admin' });
  console.log(`Admin account created: ${email}`);
}

module.exports = seedAdmin;