const mongoose = require('mongoose');
const Plan = require('../models/Plan');
require('dotenv').config({ path: './env.local' });

const plans = [

  {
    name: 'Monthly Premium',
    description: 'Full access to all features with premium content',
    price: 999,
    duration: 1,
    durationType: 'months',
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
    name: '3 Months Premium',
    description: 'Best value for 3 months subscription',
    price: 2499,
    duration: 3,
    durationType: 'months',
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
    isPopular: true,
    priority: 4,
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
    duration: 12,
    durationType: 'months',
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
    priority: 3,
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
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    await Plan.deleteMany({});
    console.log('Cleared existing plans');

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
