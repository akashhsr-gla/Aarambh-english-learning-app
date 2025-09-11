const mongoose = require('mongoose');
const Feature = require('../models/Feature');

// Default features configuration
const defaultFeatures = [
  // Games
  {
    key: 'word_game',
    name: 'Word Game',
    description: 'Interactive word learning game',
    category: 'games',
    isPaid: false,
    isActive: true,
    icon: 'gamepad',
    color: '#4CAF50',
    order: 1,
    requiredPlan: 'free',
    freeLimit: 10,
    freeLimitType: 'per_day',
    showInMenu: true,
    requiresAuth: true
  },
  {
    key: 'grammar_game',
    name: 'Grammar Game',
    description: 'Grammar practice and learning game',
    category: 'games',
    isPaid: true,
    isActive: true,
    icon: 'book',
    color: '#FF9800',
    order: 2,
    requiredPlan: 'basic',
    freeLimit: 3,
    freeLimitType: 'per_day',
    showInMenu: true,
    requiresAuth: true
  },
  {
    key: 'vocabulary_game',
    name: 'Vocabulary Game',
    description: 'Advanced vocabulary building game',
    category: 'games',
    isPaid: true,
    isActive: true,
    icon: 'graduation-cap',
    color: '#9C27B0',
    order: 3,
    requiredPlan: 'premium',
    freeLimit: 0,
    freeLimitType: 'per_day',
    showInMenu: true,
    requiresAuth: true
  },
  {
    key: 'daily_challenge',
    name: 'Daily Challenge',
    description: 'Daily language learning challenge',
    category: 'games',
    isPaid: false,
    isActive: true,
    icon: 'trophy',
    color: '#FFD700',
    order: 4,
    requiredPlan: 'free',
    freeLimit: 1,
    freeLimitType: 'per_day',
    showInMenu: true,
    requiresAuth: true
  },
  {
    key: 'speaking_game',
    name: 'Speaking Game',
    description: 'Pronunciation and speaking practice game',
    category: 'games',
    isPaid: true,
    isActive: true,
    icon: 'microphone',
    color: '#E91E63',
    order: 5,
    requiredPlan: 'premium',
    freeLimit: 0,
    freeLimitType: 'per_day',
    showInMenu: true,
    requiresAuth: true
  },

  // Communication
  {
    key: 'group_calls',
    name: 'Group Calls',
    description: 'Video and voice group discussions',
    category: 'communication',
    isPaid: true,
    isActive: true,
    icon: 'users',
    color: '#2196F3',
    order: 1,
    requiredPlan: 'basic',
    freeLimit: 2,
    freeLimitType: 'per_week',
    showInMenu: true,
    requiresAuth: true
  },
  {
    key: 'video_calls',
    name: 'Video Calls',
    description: 'One-on-one video calls with teachers',
    category: 'communication',
    isPaid: true,
    isActive: true,
    icon: 'video-camera',
    color: '#00BCD4',
    order: 2,
    requiredPlan: 'premium',
    freeLimit: 0,
    freeLimitType: 'per_day',
    showInMenu: true,
    requiresAuth: true
  },
  {
    key: 'voice_calls',
    name: 'Voice Calls',
    description: 'One-on-one voice calls with teachers',
    category: 'communication',
    isPaid: true,
    isActive: true,
    icon: 'phone',
    color: '#4CAF50',
    order: 3,
    requiredPlan: 'basic',
    freeLimit: 1,
    freeLimitType: 'per_week',
    showInMenu: true,
    requiresAuth: true
  },
  {
    key: 'group_chat',
    name: 'Group Chat',
    description: 'Text-based group discussions',
    category: 'communication',
    isPaid: false,
    isActive: true,
    icon: 'comments',
    color: '#8BC34A',
    order: 4,
    requiredPlan: 'free',
    freeLimit: -1,
    freeLimitType: 'per_day',
    showInMenu: true,
    requiresAuth: true
  },
  {
    key: 'private_chat',
    name: 'Private Chat',
    description: 'Private messaging with teachers',
    category: 'communication',
    isPaid: true,
    isActive: true,
    icon: 'envelope',
    color: '#FF5722',
    order: 5,
    requiredPlan: 'basic',
    freeLimit: 5,
    freeLimitType: 'per_day',
    showInMenu: true,
    requiresAuth: true
  },

  // Learning
  {
    key: 'lectures',
    name: 'Lectures',
    description: 'Educational video lectures',
    category: 'learning',
    isPaid: true,
    isActive: true,
    icon: 'play-circle',
    color: '#673AB7',
    order: 1,
    requiredPlan: 'basic',
    freeLimit: 3,
    freeLimitType: 'per_week',
    showInMenu: true,
    requiresAuth: true
  },
  {
    key: 'practice_exercises',
    name: 'Practice Exercises',
    description: 'Interactive practice exercises',
    category: 'learning',
    isPaid: false,
    isActive: true,
    icon: 'pencil',
    color: '#3F51B5',
    order: 2,
    requiredPlan: 'free',
    freeLimit: 20,
    freeLimitType: 'per_day',
    showInMenu: true,
    requiresAuth: true
  },
  {
    key: 'progress_tracking',
    name: 'Progress Tracking',
    description: 'Track your learning progress',
    category: 'learning',
    isPaid: true,
    isActive: true,
    icon: 'bar-chart',
    color: '#009688',
    order: 3,
    requiredPlan: 'premium',
    freeLimit: 0,
    freeLimitType: 'per_day',
    showInMenu: true,
    requiresAuth: true
  },
  {
    key: 'certificates',
    name: 'Certificates',
    description: 'Earn certificates for completed courses',
    category: 'learning',
    isPaid: true,
    isActive: true,
    icon: 'certificate',
    color: '#FFC107',
    order: 4,
    requiredPlan: 'premium',
    freeLimit: 0,
    freeLimitType: 'per_day',
    showInMenu: true,
    requiresAuth: true
  },

  // Social
  {
    key: 'leaderboard',
    name: 'Leaderboard',
    description: 'Compete with other learners',
    category: 'social',
    isPaid: false,
    isActive: true,
    icon: 'trophy',
    color: '#FF9800',
    order: 1,
    requiredPlan: 'free',
    freeLimit: -1,
    freeLimitType: 'per_day',
    showInMenu: true,
    requiresAuth: true
  },
  {
    key: 'achievements',
    name: 'Achievements',
    description: 'Unlock achievements and badges',
    category: 'social',
    isPaid: true,
    isActive: true,
    icon: 'star',
    color: '#E91E63',
    order: 2,
    requiredPlan: 'basic',
    freeLimit: 0,
    freeLimitType: 'per_day',
    showInMenu: true,
    requiresAuth: true
  },
  {
    key: 'community_forum',
    name: 'Community Forum',
    description: 'Connect with other learners',
    category: 'social',
    isPaid: true,
    isActive: true,
    icon: 'users',
    color: '#795548',
    order: 3,
    requiredPlan: 'premium',
    freeLimit: 0,
    freeLimitType: 'per_day',
    showInMenu: true,
    requiresAuth: true
  },

  // Premium
  {
    key: 'unlimited_access',
    name: 'Unlimited Access',
    description: 'Access to all features without limits',
    category: 'premium',
    isPaid: true,
    isActive: true,
    icon: 'crown',
    color: '#FFD700',
    order: 1,
    requiredPlan: 'pro',
    freeLimit: 0,
    freeLimitType: 'per_day',
    showInMenu: false,
    requiresAuth: true
  },
  {
    key: 'priority_support',
    name: 'Priority Support',
    description: '24/7 priority customer support',
    category: 'premium',
    isPaid: true,
    isActive: true,
    icon: 'headphones',
    color: '#607D8B',
    order: 2,
    requiredPlan: 'pro',
    freeLimit: 0,
    freeLimitType: 'per_day',
    showInMenu: false,
    requiresAuth: true
  }
];

// Seed features function
const seedFeatures = async () => {
  try {
    console.log('🌱 Seeding features...');

    // Clear existing features
    await Feature.deleteMany({});
    console.log('✅ Cleared existing features');

    // Insert default features
    const features = await Feature.insertMany(defaultFeatures);
    console.log(`✅ Inserted ${features.length} features`);

    // Log summary
    const paidCount = features.filter(f => f.isPaid).length;
    const freeCount = features.filter(f => !f.isPaid).length;
    const activeCount = features.filter(f => f.isActive).length;

    console.log('\n📊 Feature Summary:');
    console.log(`Total Features: ${features.length}`);
    console.log(`Active Features: ${activeCount}`);
    console.log(`Paid Features: ${paidCount}`);
    console.log(`Free Features: ${freeCount}`);

    console.log('\n🎯 Categories:');
    const categories = [...new Set(features.map(f => f.category))];
    categories.forEach(category => {
      const count = features.filter(f => f.category === category).length;
      console.log(`  ${category}: ${count} features`);
    });

    console.log('\n🎉 Features seeded successfully!');
    return true;

  } catch (error) {
    console.error('❌ Error seeding features:', error);
    return false;
  }
};

// Run if called directly
if (require.main === module) {
  // Connect to MongoDB
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aarambhapp', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('📡 Connected to MongoDB');
    return seedFeatures();
  })
  .then((success) => {
    if (success) {
      console.log('✅ Seeding completed successfully');
    } else {
      console.log('❌ Seeding failed');
    }
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  });
}

module.exports = { seedFeatures, defaultFeatures };
