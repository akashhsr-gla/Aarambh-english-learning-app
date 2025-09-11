require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Region = require('../models/Region');
const connectDB = require('../config/database');

(async () => {
  try {
    await connectDB();

    const EMAIL = process.env.ADMIN_EMAIL || 'admin@aarambh.com';
    const PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
    const NAME = process.env.ADMIN_NAME || 'Aarambh Admin';

    // Ensure a default region exists
    let region = await Region.findOne({ code: 'DEF' });
    if (!region) {
      region = new Region({ name: 'Default', code: 'DEF', isActive: true });
      await region.save();
    }

    let user = await User.findOne({ email: EMAIL });
    if (user) {
      if (user.role !== 'admin') {
        user.role = 'admin';
      }
      if (PASSWORD) {
        user.password = PASSWORD;
      }
      if (!user.region) {
        user.region = region._id;
      }
      await user.save();
      console.log('Admin user updated:', EMAIL);
    } else {
      user = new User({
        name: NAME,
        email: EMAIL,
        phone: '0000000000',
        password: PASSWORD,
        role: 'admin',
        isActive: true,
        region: region._id,
      });
      await user.save();
      console.log('Admin user created:', EMAIL);
    }

    console.log('DONE');
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Create admin error:', err);
    process.exit(1);
  }
})();


