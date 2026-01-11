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

async function getAllFeatures() {
  try {
    await connectDB();

    // Get all features sorted by category and order
    const features = await Feature.find().sort({ category: 1, order: 1 }).lean();

    if (!features || features.length === 0) {
      console.log('\n❌ No features found in database.\n');
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log('\n📋 ALL FEATURES IN SYSTEM\n');
    console.log('='.repeat(80));

    // Group by category
    const categories = ['games', 'communication', 'learning', 'social', 'premium'];
    const categoryNames = {
      games: '🎮 GAMES',
      communication: '💬 COMMUNICATION',
      learning: '📚 LEARNING',
      social: '👥 SOCIAL',
      premium: '⭐ PREMIUM'
    };

    let totalFeatures = 0;
    let paidFeatures = 0;
    let freeFeatures = 0;
    let activeFeatures = 0;
    let inactiveFeatures = 0;

    categories.forEach(category => {
      const categoryFeatures = features.filter(f => f.category === category);
      if (categoryFeatures.length > 0) {
        console.log(`\n${categoryNames[category] || category.toUpperCase()}`);
        console.log('-'.repeat(80));
        
        categoryFeatures.forEach((feature, index) => {
          const status = feature.isActive ? '✅' : '❌';
          const accessType = feature.isPaid ? '💰 PAID' : '🆓 FREE';
          const planReq = feature.requiredPlan !== 'free' ? ` (Requires: ${feature.requiredPlan})` : '';
          const limit = feature.freeLimit > 0 ? ` [Limit: ${feature.freeLimit}/${feature.freeLimitType}]` : '';
          
          console.log(`  ${index + 1}. ${status} ${accessType} - ${feature.name}`);
          console.log(`     Key: ${feature.key}`);
          if (feature.description) {
            console.log(`     Description: ${feature.description}`);
          }
          console.log(`     Required Plan: ${feature.requiredPlan}${planReq}`);
          if (feature.freeLimit > 0) {
            console.log(`     Free Limit: ${feature.freeLimit} ${feature.freeLimitType}`);
          }
          console.log(`     Show in Menu: ${feature.showInMenu ? 'Yes' : 'No'}`);
          console.log(`     Order: ${feature.order}`);
          console.log('');
          
          totalFeatures++;
          if (feature.isPaid) paidFeatures++;
          else freeFeatures++;
          if (feature.isActive) activeFeatures++;
          else inactiveFeatures++;
        });
      }
    });

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total Features: ${totalFeatures}`);
    console.log(`  ✅ Active: ${activeFeatures}`);
    console.log(`  ❌ Inactive: ${inactiveFeatures}`);
    console.log(`  🆓 Free: ${freeFeatures}`);
    console.log(`  💰 Paid: ${paidFeatures}`);
    
    // Category breakdown
    console.log('\n📊 BY CATEGORY:');
    categories.forEach(category => {
      const catFeatures = features.filter(f => f.category === category);
      if (catFeatures.length > 0) {
        const catPaid = catFeatures.filter(f => f.isPaid).length;
        const catFree = catFeatures.filter(f => !f.isPaid).length;
        const catActive = catFeatures.filter(f => f.isActive).length;
        console.log(`  ${categoryNames[category] || category}: ${catFeatures.length} total (${catActive} active, ${catFree} free, ${catPaid} paid)`);
      }
    });

    // Required plan breakdown
    console.log('\n📊 BY REQUIRED PLAN:');
    const planBreakdown = {};
    features.forEach(f => {
      const plan = f.requiredPlan || 'free';
      if (!planBreakdown[plan]) {
        planBreakdown[plan] = { total: 0, paid: 0, free: 0 };
      }
      planBreakdown[plan].total++;
      if (f.isPaid) planBreakdown[plan].paid++;
      else planBreakdown[plan].free++;
    });
    Object.keys(planBreakdown).sort().forEach(plan => {
      console.log(`  ${plan}: ${planBreakdown[plan].total} features (${planBreakdown[plan].free} free, ${planBreakdown[plan].paid} paid)`);
    });

    console.log('\n' + '='.repeat(80) + '\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

getAllFeatures();

