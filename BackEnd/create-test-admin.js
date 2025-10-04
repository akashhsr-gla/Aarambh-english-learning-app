/**
 * Create a test admin user for testing purposes
 */

const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aarambh-app', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Create test admin user
const createTestAdmin = async () => {
  try {
    console.log('👤 Creating test admin user...\n');
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@test.com' });
    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.email);
      return existingAdmin;
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Create admin user
    const adminUser = new User({
      name: 'Test Admin',
      email: 'admin@test.com',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
      isEmailVerified: true,
      adminInfo: {
        permissions: ['all']
      }
    });
    
    await adminUser.save();
    console.log('✅ Test admin user created successfully!');
    console.log('📧 Email: admin@test.com');
    console.log('🔑 Password: admin123');
    console.log('🆔 User ID:', adminUser._id);
    
    return adminUser;
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  }
};

// Main function
const main = async () => {
  console.log('🚀 Creating Test Admin User\n');
  
  // Connect to database
  await connectDB();
  
  // Create test admin
  await createTestAdmin();
  
  console.log('\n✅ Admin user setup completed!');
  console.log('\n📱 You can now use these credentials:');
  console.log('Email: admin@test.com');
  console.log('Password: admin123');
  
  process.exit(0);
};

// Run the script
main().catch(console.error);
