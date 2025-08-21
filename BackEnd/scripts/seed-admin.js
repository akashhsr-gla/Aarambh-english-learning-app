const mongoose = require('mongoose');
const User = require('../models/User');
const Region = require('../models/Region');
require('dotenv').config({ path: './env.local' });

const adminUser = {
  name: 'Super Admin',
  email: 'admin@aarambhapp.com',
  phone: '+919999999999',
  password: 'admin123456',
  role: 'admin',
  adminInfo: {
    permissions: [
      'manage_users',
      'manage_content',
      'manage_plans',
      'view_analytics',
      'manage_teachers'
    ]
  }
};

const seedAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get first region for admin
    const region = await Region.findOne();
    if (!region) {
      console.error('No regions found. Please run seed-regions.js first.');
      process.exit(1);
    }

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists. Skipping...');
      process.exit(0);
    }

    // Create admin user
    const admin = new User({
      ...adminUser,
      region: region._id
    });

    await admin.save();
    console.log('Admin user created successfully!');
    console.log(`Email: ${admin.email}`);
    console.log(`Password: ${adminUser.password}`);
    console.log(`Role: ${admin.role}`);
    console.log(`Region: ${region.name}`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
