require('dotenv').config({ path: './env.local' });
const mongoose = require('mongoose');
const Feature = require('../models/Feature');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

async function updateFeatureAccess() {
  try {
    await connectDB();

    console.log('\n🔄 Updating feature access settings...\n');

    // Features to make paid
    const paidFeatures = ['video_calls', 'voice_calls'];
    
    // First, set all features to free
    console.log('📝 Setting all features to FREE...');
    await Feature.updateMany({}, { isPaid: false });
    console.log('✅ All features set to FREE\n');

    // Then set specific features to paid
    console.log('💰 Setting specific features to PAID...');
    const results = [];
    
    for (const featureKey of paidFeatures) {
      const feature = await Feature.findOne({ key: featureKey });
      if (feature) {
        feature.isPaid = true;
        feature.lastModifiedAt = new Date();
        await feature.save();
        results.push({
          key: featureKey,
          name: feature.name,
          status: '✅ Updated to PAID'
        });
        console.log(`  ✅ ${feature.name} (${featureKey}) → PAID`);
      } else {
        results.push({
          key: featureKey,
          name: 'Not found',
          status: '❌ Feature not found'
        });
        console.log(`  ❌ Feature "${featureKey}" not found`);
      }
    }

    console.log('\n📊 Verifying changes...\n');
    
    // Get updated features
    const allFeatures = await Feature.find().sort({ category: 1, order: 1 }).lean();
    const paidCount = allFeatures.filter(f => f.isPaid).length;
    const freeCount = allFeatures.filter(f => !f.isPaid).length;

    console.log('='.repeat(80));
    console.log('📋 UPDATED FEATURE STATUS');
    console.log('='.repeat(80));
    console.log(`Total Features: ${allFeatures.length}`);
    console.log(`  🆓 Free: ${freeCount}`);
    console.log(`  💰 Paid: ${paidCount}\n`);

    console.log('💰 PAID FEATURES:');
    console.log('-'.repeat(80));
    const paidFeaturesList = allFeatures.filter(f => f.isPaid);
    if (paidFeaturesList.length > 0) {
      paidFeaturesList.forEach((feature, index) => {
        console.log(`  ${index + 1}. ${feature.name} (${feature.key})`);
        console.log(`     Category: ${feature.category}`);
        console.log(`     Required Plan: ${feature.requiredPlan}`);
        console.log('');
      });
    } else {
      console.log('  No paid features found.\n');
    }

    console.log('='.repeat(80));
    console.log('✅ Update completed successfully!\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

updateFeatureAccess();

