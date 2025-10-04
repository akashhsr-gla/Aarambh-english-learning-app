/**
 * Create test data including regions, admin user, and lecture
 */

const mongoose = require('mongoose');
const User = require('./models/User');
const Region = require('./models/Region');
const VideoLecture = require('./models/VideoLecture');
const bcrypt = require('bcryptjs');
const { convertGoogleDriveUrl, validateGoogleDriveUrl } = require('./utils/googleDriveHelper');

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

// Create test region
const createTestRegion = async () => {
  try {
    console.log('🌍 Creating test region...\n');
    
    // Check if region already exists
    let region = await Region.findOne({ name: 'Test Region' });
    if (region) {
      console.log('✅ Test region already exists:', region.name);
      return region;
    }
    
    // Create test region
    region = new Region({
      name: 'Test Region',
      code: 'TEST',
      description: 'Test region for development and testing',
      isActive: true
    });
    
    await region.save();
    console.log('✅ Test region created successfully!');
    console.log('📍 Region ID:', region._id);
    
    return region;
    
  } catch (error) {
    console.error('❌ Error creating test region:', error);
    throw error;
  }
};

// Create test admin user
const createTestAdmin = async (region) => {
  try {
    console.log('👤 Creating test admin user...\n');
    
    // Check if admin already exists
    let adminUser = await User.findOne({ email: 'admin@test.com' });
    if (adminUser) {
      console.log('✅ Admin user already exists:', adminUser.email);
      return adminUser;
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Create admin user
    adminUser = new User({
      name: 'Test Admin',
      email: 'admin@test.com',
      phone: '+1234567890',
      password: hashedPassword,
      role: 'admin',
      region: region._id,
      isActive: true,
      isEmailVerified: true,
      adminInfo: {
        permissions: ['manage_users', 'manage_content', 'manage_plans', 'view_analytics', 'manage_teachers']
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

// Test Google Drive URL conversion
const testGoogleDriveUrls = () => {
  console.log('\n🔧 Testing Google Drive URL Conversion...\n');
  
  const videoUrl = 'https://drive.google.com/file/d/1eB7_1Lvax6PVnMIz4OMywQrsjvyDPAHK/view?usp=sharing';
  const pdfUrl = 'https://drive.google.com/file/d/1Ieg0z3E1-ZM8eNPggB5t7J89AiRN2gZB/view?usp=sharing';
  
  // Test video URL conversion
  console.log('📹 Video URL Conversion:');
  console.log('Original:', videoUrl);
  const videoValidation = validateGoogleDriveUrl(videoUrl);
  console.log('Validation:', videoValidation);
  
  if (videoValidation.isValid) {
    const convertedVideoUrl = convertGoogleDriveUrl(videoUrl, 'video');
    console.log('Converted:', convertedVideoUrl);
  }
  
  // Test PDF URL conversion
  console.log('\n📄 PDF URL Conversion:');
  console.log('Original:', pdfUrl);
  const pdfValidation = validateGoogleDriveUrl(pdfUrl);
  console.log('Validation:', pdfValidation);
  
  if (pdfValidation.isValid) {
    const convertedPdfUrl = convertGoogleDriveUrl(pdfUrl, 'pdf');
    console.log('Converted:', convertedPdfUrl);
  }
  
  console.log('\n✅ URL conversion test completed\n');
};

// Insert test lecture
const insertTestLecture = async (adminUser, region) => {
  try {
    console.log('📝 Inserting test lecture...\n');
    
    // Test URLs
    const videoUrl = 'https://drive.google.com/file/d/1eB7_1Lvax6PVnMIz4OMywQrsjvyDPAHK/view?usp=sharing';
    const pdfUrl = 'https://drive.google.com/file/d/1Ieg0z3E1-ZM8eNPggB5t7J89AiRN2gZB/view?usp=sharing';
    
    // Convert URLs using our helper
    const convertedVideoUrl = convertGoogleDriveUrl(videoUrl, 'video');
    const convertedPdfUrl = convertGoogleDriveUrl(pdfUrl, 'pdf');
    const convertedThumbnailUrl = convertGoogleDriveUrl(videoUrl, 'thumbnail');
    
    console.log('🔄 URL Conversions:');
    console.log('Video:', convertedVideoUrl);
    console.log('PDF:', convertedPdfUrl);
    console.log('Thumbnail:', convertedThumbnailUrl);
    
    // Create lecture data
    const lectureData = {
      title: 'Test Google Drive Integration - English Grammar Basics',
      description: 'This is a test lecture to demonstrate Google Drive video and PDF integration. Learn basic English grammar concepts with interactive examples and downloadable notes.',
      shortDescription: 'Test lecture for Google Drive integration',
      videoUrl: convertedVideoUrl,
      thumbnailUrl: convertedThumbnailUrl,
      duration: 1800, // 30 minutes in seconds
      notes: {
        pdfUrl: convertedPdfUrl,
        textContent: 'This is a test lecture covering:\n\n1. Basic English Grammar Rules\n2. Sentence Structure\n3. Parts of Speech\n4. Common Mistakes\n5. Practice Exercises\n\nDownload the PDF for detailed notes and exercises.'
      },
      instructor: adminUser._id,
      region: region._id,
      category: 'Grammar',
      subcategory: 'Basics',
      difficulty: 'beginner',
      level: 1,
      tags: ['grammar', 'basics', 'english', 'test', 'google-drive'],
      keywords: ['grammar', 'english', 'basics', 'learning'],
      isActive: true,
      isPremium: false,
      requiresSubscription: false,
      isPublished: true,
      language: 'English',
      publishedAt: new Date()
    };
    
    // Check if lecture already exists
    const existingLecture = await VideoLecture.findOne({
      title: { $regex: new RegExp(`^${lectureData.title}$`, 'i') }
    });
    
    if (existingLecture) {
      console.log('⚠️  Lecture with this title already exists. Updating...');
      existingLecture.videoUrl = convertedVideoUrl;
      existingLecture.thumbnailUrl = convertedThumbnailUrl;
      existingLecture.notes = lectureData.notes;
      existingLecture.updatedAt = new Date();
      await existingLecture.save();
      console.log('✅ Lecture updated successfully!');
      console.log('📋 Lecture ID:', existingLecture._id);
    } else {
      // Create new lecture
      const lecture = new VideoLecture(lectureData);
      await lecture.save();
      console.log('✅ Lecture created successfully!');
      console.log('📋 Lecture ID:', lecture._id);
    }
    
    console.log('\n🎯 Test Data Summary:');
    console.log('Title:', lectureData.title);
    console.log('Video URL:', convertedVideoUrl);
    console.log('PDF URL:', convertedPdfUrl);
    console.log('Thumbnail URL:', convertedThumbnailUrl);
    console.log('Duration:', Math.floor(lectureData.duration / 60), 'minutes');
    console.log('Difficulty:', lectureData.difficulty);
    console.log('Instructor:', adminUser.name);
    console.log('Region:', region.name);
    
  } catch (error) {
    console.error('❌ Error inserting test lecture:', error);
  }
};

// Main function
const main = async () => {
  console.log('🚀 Creating Complete Test Data\n');
  
  // Test URL conversion
  testGoogleDriveUrls();
  
  // Connect to database
  await connectDB();
  
  // Create test region
  const region = await createTestRegion();
  
  // Create test admin
  const adminUser = await createTestAdmin(region);
  
  // Insert test lecture
  await insertTestLecture(adminUser, region);
  
  console.log('\n✅ All test data created successfully!');
  console.log('\n📱 Next steps:');
  console.log('1. Start your backend server: npm start');
  console.log('2. Start your frontend app: npm start');
  console.log('3. Navigate to the Learn screen');
  console.log('4. Look for "Test Google Drive Integration - English Grammar Basics"');
  console.log('5. Click on it to test video playback and PDF notes');
  console.log('\n🔑 Admin credentials:');
  console.log('Email: admin@test.com');
  console.log('Password: admin123');
  
  process.exit(0);
};

// Run the script
main().catch(console.error);
