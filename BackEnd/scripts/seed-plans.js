const mongoose = require('mongoose');
const Plan = require('../models/Plan');
require('dotenv').config({ path: './env.local' });

const plans = [
  {
    name: 'Free Plan',
    description: 'Basic access to essential features',
    price: 0,
    duration: 30,
    durationType: 'days',
    features: [
      { name: 'Basic Games', description: 'Access to limited games', isIncluded: true },
      { name: 'Basic Lectures', description: 'Access to free lectures', isIncluded: true },
      { name: 'Chat', description: 'Basic chat functionality', isIncluded: true },
      { name: 'Video Calls', description: 'Video calling feature', isIncluded: false },
      { name: 'Voice Calls', description: 'Voice calling feature', isIncluded: false },
      { name: 'Group Sessions', description: 'Group video/voice calls', isIncluded: false }
    ],
    isActive: true,
    isPopular: false,
    priority: 1,
    maxSessions: 5,
    maxGames: 10,
    maxLectures: 5
  },
  {
    name: 'Premium Plan',
    description: 'Full access to all features with premium content',
    price: 999,
    duration: 30,
    durationType: 'days',
    features: [
      { name: 'All Games', description: 'Access to all games', isIncluded: true },
      { name: 'All Lectures', description: 'Access to all lectures', isIncluded: true },
      { name: 'Chat', description: 'Full chat functionality', isIncluded: true },
      { name: 'Video Calls', description: 'Unlimited video calls', isIncluded: true },
      { name: 'Voice Calls', description: 'Unlimited voice calls', isIncluded: true },
      { name: 'Group Sessions', description: 'Unlimited group sessions', isIncluded: true }
    ],
    isActive: true,
    isPopular: true,
    priority: 3,
    maxSessions: -1,
    maxGames: -1,
    maxLectures: -1,
    includesVideoCalls: true,
    includesVoiceCalls: true,
    includesGroupCalls: true
  },
  {
    name: 'Annual Premium',
    description: 'Best value with annual subscription',
    price: 9999,
    duration: 365,
    durationType: 'days',
    features: [
      { name: 'All Games', description: 'Access to all games', isIncluded: true },
      { name: 'All Lectures', description: 'Access to all lectures', isIncluded: true },
      { name: 'Chat', description: 'Full chat functionality', isIncluded: true },
      { name: 'Video Calls', description: 'Unlimited video calls', isIncluded: true },
      { name: 'Voice Calls', description: 'Unlimited voice calls', isIncluded: true },
      { name: 'Group Sessions', description: 'Unlimited group sessions', isIncluded: true },
      { name: 'Priority Support', description: '24/7 priority support', isIncluded: true }
    ],
    isActive: true,
    isPopular: false,
    priority: 2,
    maxSessions: -1,
    maxGames: -1,
    maxLectures: -1,
    includesVideoCalls: true,
    includesVoiceCalls: true,
    includesGroupCalls: true
  }
];

const seedPlans = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing plans
    await Plan.deleteMany({});
    console.log('Cleared existing plans');

    // Insert new plans
    const createdPlans = await Plan.insertMany(plans);
    console.log(`Created ${createdPlans.length} plans:`);
    
    createdPlans.forEach(plan => {
      console.log(`- ${plan.name}: ₹${plan.price} for ${plan.duration} ${plan.durationType}`);
    });

    console.log('\nPlans seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding plans:', error);
    process.exit(1);
  }
};

seedPlans();
