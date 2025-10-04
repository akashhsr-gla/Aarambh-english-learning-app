/**
 * Test script to insert a lecture with Google Drive URLs
 * This will test the Google Drive URL conversion functionality
 */

const mongoose = require('mongoose');
const VideoLecture = require('./models/VideoLecture');
const User = require('./models/User');
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
const insertTestLecture = async () => {
  try {
    console.log('📝 Inserting test lecture...\n');
    
    // Find an admin user to be the instructor
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.error('❌ No admin user found. Please create an admin user first.');
      return;
    }
    
    console.log('👤 Using instructor:', adminUser.name, `(${adminUser.email})`);
    
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
    
  } catch (error) {
    console.error('❌ Error inserting test lecture:', error);
  }
};

// Main function
const main = async () => {
  console.log('🚀 Starting Google Drive Integration Test\n');
  
  // Test URL conversion
  testGoogleDriveUrls();
  
  // Connect to database
  await connectDB();
  
  // Insert test lecture
  await insertTestLecture();
  
  console.log('\n✅ Test completed! You can now test the functionality in your app.');
  console.log('\n📱 Next steps:');
  console.log('1. Start your backend server');
  console.log('2. Start your frontend app');
  console.log('3. Navigate to the Learn screen');
  console.log('4. Look for "Test Google Drive Integration - English Grammar Basics"');
  console.log('5. Click on it to test video playback and PDF notes');
  
  process.exit(0);
};

// Run the script
main().catch(console.error);
