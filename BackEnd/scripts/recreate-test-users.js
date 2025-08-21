require('dotenv').config({ path: './env.local' });
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aarambhapp';

async function recreateTestUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Delete existing test users
    const deleteResult = await User.deleteMany({
      email: { $in: ['teacher@test.com', 'student@test.com'] }
    });
    console.log(`Deleted ${deleteResult.deletedCount} existing test users`);

    // Get a region ID
    const Region = require('../models/Region');
    const region = await Region.findOne();
    if (!region) {
      throw new Error('No regions found. Please run seed-regions.js first.');
    }
    console.log(`Using region: ${region.name} (${region._id})`);

    // Create test teacher without password first
    const teacher = new User({
      name: 'Test Teacher',
      email: 'teacher@test.com',
      phone: '1234567891',
      role: 'teacher',
      region: region._id,
      teacherInfo: {
        specialization: 'English',
        experience: 5,
        referralCode: 'TESTREF123',
        isActive: true
      }
    });

    // Set password after creation to avoid double hashing
    teacher.password = 'teacher123';
    await teacher.save();
    console.log('Created test teacher:', teacher.email);

    // Create test student without password first
    const student = new User({
      name: 'Test Student',
      email: 'student@test.com',
      phone: '1234567892',
      role: 'student',
      region: region._id,
      studentInfo: {
        age: 20,
        subscriptionStatus: 'inactive',
        currentPlan: null,
        totalLecturesWatched: 0,
        totalGameSessions: 0,
        totalCommunicationSessions: 0,
        averageGameScore: 0
      }
    });

    // Set password after creation to avoid double hashing
    student.password = 'student123';
    await student.save();
    console.log('Created test student:', student.email);

    // Verify the passwords work
    const teacherVerify = await bcrypt.compare('teacher123', teacher.password);
    const studentVerify = await bcrypt.compare('student123', student.password);
    
    console.log('\nPassword verification:');
    console.log(`Teacher password correct: ${teacherVerify}`);
    console.log(`Student password correct: ${studentVerify}`);

    console.log('\nTest users recreated successfully!');
    console.log('Teacher:', teacher.email, '(password: teacher123)');
    console.log('Student:', student.email, '(password: student123)');

  } catch (error) {
    console.error('Error recreating test users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
}

recreateTestUsers();
