require('dotenv').config({ path: './env.local' });
const mongoose = require('mongoose');
const User = require('../models/User');

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

async function getTeacherCode() {
  try {
    await connectDB();

    // Find a teacher with a referral code
    const teacher = await User.findOne({
      role: 'teacher',
      'teacherInfo.referralCode': { $exists: true, $ne: null },
      isActive: true
    })
    .select('name email phone teacherInfo.referralCode teacherInfo.isApproved')
    .lean();

    if (!teacher) {
      console.log('\n❌ No active teacher with referral code found in database.');
      console.log('\n💡 To create a teacher with a code:');
      console.log('   1. Register a new user with role: "teacher"');
      console.log('   2. The system will auto-generate a 6-digit referral code');
      console.log('   3. The code will be stored in teacherInfo.referralCode\n');
      
      // Check if there are any teachers at all
      const anyTeacher = await User.findOne({ role: 'teacher' })
        .select('name email isActive teacherInfo')
        .lean();
      
      if (anyTeacher) {
        console.log('📋 Found teacher(s) but they may not have referral codes:');
        console.log(`   Name: ${anyTeacher.name}`);
        console.log(`   Email: ${anyTeacher.email}`);
        console.log(`   Active: ${anyTeacher.isActive}`);
        console.log(`   Has Code: ${anyTeacher.teacherInfo?.referralCode ? 'Yes' : 'No'}`);
        if (anyTeacher.teacherInfo?.referralCode) {
          console.log(`   Code: ${anyTeacher.teacherInfo.referralCode}`);
        }
      }
      
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log('\n✅ Found working teacher code:\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`👤 Teacher Name: ${teacher.name}`);
    console.log(`📧 Email: ${teacher.email}`);
    console.log(`📱 Phone: ${teacher.phone || 'N/A'}`);
    console.log(`🔑 Teacher Code: ${teacher.teacherInfo.referralCode}`);
    console.log(`✅ Approved: ${teacher.teacherInfo.isApproved ? 'Yes' : 'No'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('💡 You can use this code as a referral code when subscribing.\n');

    // Also show all teachers with codes
    const allTeachers = await User.find({
      role: 'teacher',
      'teacherInfo.referralCode': { $exists: true, $ne: null }
    })
    .select('name email teacherInfo.referralCode teacherInfo.isApproved isActive')
    .lean();

    if (allTeachers.length > 1) {
      console.log(`\n📋 Found ${allTeachers.length} teachers with codes:\n`);
      allTeachers.forEach((t, index) => {
        console.log(`${index + 1}. ${t.name} - Code: ${t.teacherInfo.referralCode} ${t.isActive ? '✅' : '❌'} ${t.teacherInfo.isApproved ? 'Approved' : 'Pending'}`);
      });
      console.log('');
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

getTeacherCode();

