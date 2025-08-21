require('dotenv').config({ path: './env.local' });
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aarambhapp';

async function seedTestUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing test users
    await User.deleteMany({
      email: { $in: ['teacher@test.com', 'student@test.com'] }
    });
    console.log('Cleared existing test users');

    // Get a region ID first
    const Region = require('../models/Region');
    const region = await Region.findOne();
    if (!region) {
      throw new Error('No regions found. Please run seed-regions.js first.');
    }
    console.log(`Using region: ${region.name} (${region._id})`);

    // Create test teacher
    const teacherPassword = await bcrypt.hash('teacher123', 12);
    const teacher = new User({
      name: 'Test Teacher',
      email: 'teacher@test.com',
      password: teacherPassword,
      phone: '1234567891',
      role: 'teacher',
      region: region._id, // Set region at root level
      teacherInfo: {
        specialization: 'English',
        experience: 5,
        referralCode: 'TESTREF123',
        isActive: true
      }
    });

    await teacher.save();
    console.log('Created test teacher:', teacher.email);

    // Create test student with region at root level
    const studentPassword = await bcrypt.hash('student123', 12);
    const student = new User({
      name: 'Test Student',
      email: 'student@test.com',
      password: studentPassword,
      phone: '1234567892',
      role: 'student',
      region: region._id, // Set region at root level
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

    await student.save();
    console.log('Created test student:', student.email);
    console.log(`Assigned student to region: ${region.name}`);

    console.log('\nTest users seeded successfully!');
    console.log('Teacher:', teacher.email, '(password: teacher123)');
    console.log('Student:', student.email, '(password: student123)');

  } catch (error) {
    console.error('Error seeding test users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
}

seedTestUsers();
