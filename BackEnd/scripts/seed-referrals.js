require('dotenv').config({ path: './env.local' });
const mongoose = require('mongoose');
const Referral = require('../models/Referral');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aarambhapp';

async function seedReferrals() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing referrals
    await Referral.deleteMany({});
    console.log('Cleared existing referrals');

    // Get the test teacher
    const teacher = await User.findOne({ email: 'teacher@test.com', role: 'teacher' });
    if (!teacher) {
      throw new Error('Test teacher not found. Please run seed-test-users.js first.');
    }

    // Create referral record
    const referral = new Referral({
      teacher: teacher._id,
      referralCode: 'TESTREF123',
      discountPercentage: 25,
      isActive: true,
      totalUses: 0,
      usedBy: []
    });

    await referral.save();
    console.log('Created referral record:', referral.referralCode);
    console.log(`Teacher: ${teacher.name} (${teacher.email})`);
    console.log(`Discount: ${referral.discountPercentage}%`);

    console.log('\nReferrals seeded successfully!');

  } catch (error) {
    console.error('Error seeding referrals:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
}

seedReferrals();
