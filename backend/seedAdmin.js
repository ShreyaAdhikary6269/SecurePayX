const User = require('./models/User');

// Memory resets on every restart, so the admin account is recreated at startup
// from ADMIN_EMAIL and ADMIN_PASSWORD in backend/.env.
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

  const existing = await User.findOne({ email });
  if (existing) {
    existing.role = 'admin';
    existing.isActive = true;
    await existing.save();
    console.log(`Admin account updated: ${email}`);
    return;
  }

  const admin = new User({ email, password, role: 'admin' });
  await admin.save();
  console.log(`Admin account ready: ${email}`);
}

module.exports = seedAdmin;