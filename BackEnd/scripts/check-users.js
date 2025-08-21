require('dotenv').config({ path: './env.local' });
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aarambhapp';

async function checkUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check all users
    const users = await User.find({}).select('name email role password');
    console.log('\nAll users in database:');
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - Role: ${user.role}`);
      console.log(`  Password hash: ${user.password ? user.password.substring(0, 20) + '...' : 'No password'}`);
    });

    // Check specific test users
    const teacher = await User.findOne({ email: 'teacher@test.com' });
    const student = await User.findOne({ email: 'student@test.com' });
    const admin = await User.findOne({ email: 'admin@aarambhapp.com' });

    console.log('\nTest user details:');
    if (teacher) {
      console.log(`Teacher: ${teacher.name} - Password: ${teacher.password ? 'Set' : 'Not set'}`);
    } else {
      console.log('Teacher: Not found');
    }

    if (student) {
      console.log(`Student: ${student.name} - Password: ${student.password ? 'Set' : 'Not set'}`);
    } else {
      console.log('Student: Not found');
    }

    if (admin) {
      console.log(`Admin: ${admin.name} - Password: ${admin.password ? 'Set' : 'Not set'}`);
    } else {
      console.log('Admin: Not found');
    }

  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
}

checkUsers();
