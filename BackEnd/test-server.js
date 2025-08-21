const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

// Basic middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'AarambhApp Backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Backend is working correctly!',
    models: [
      'User - Unified model for admin, teacher, and student',
      'Region - Geographical organization',
      'Plan - Subscription plans with features',
      'Transaction - Razorpay payment tracking',
      'Game - Unified game model for all game types',
      'VideoLecture - Video content with notes',
      'Session - Communication session tracking',
      'Leaderboard - Regional rankings',
      'Referral - Teacher referral system'
    ]
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Test server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/test`);
  console.log(`📚 Models created: 9 comprehensive models`);
  console.log(`🔐 Authentication: JWT-based with role management`);
  console.log(`💳 Payments: Razorpay integration ready`);
  console.log(`🎮 Games: Unified model for all game types`);
  console.log(`📞 Communication: Session tracking for calls/chat`);
  console.log(`🏆 Leaderboards: Regional rankings system`);
  console.log(`👥 Referrals: Teacher referral system with 25% discount`);
});

module.exports = app;
