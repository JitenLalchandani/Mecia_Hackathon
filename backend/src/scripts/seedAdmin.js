require('dotenv').config();
const connectDB = require('../config/database');
const User = require('../models/User.model');

const seedAdmin = async () => {
  await connectDB();

  const email = process.env.SEED_ADMIN_EMAIL || 'admin@local.test';
  const name = process.env.SEED_ADMIN_NAME || 'Administrator';
  const password = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!';

  try {
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ name, email, password, roles: ['admin'] });
      await user.save();
      console.log('✅ Admin user created:', email);
    } else {
      if (!Array.isArray(user.roles) || !user.roles.includes('admin')) {
        user.roles = Array.from(new Set([...(user.roles || []), 'admin']));
        await user.save();
        console.log('✅ Admin role added to existing user:', email);
      } else {
        console.log('ℹ️  Admin user already present:', email);
      }
    }
  } catch (err) {
    console.error('❌ Failed to seed admin user', err.message || err);
  } finally {
    process.exit(0);
  }
};

seedAdmin();
