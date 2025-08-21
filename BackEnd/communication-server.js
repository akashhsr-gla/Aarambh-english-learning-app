const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config({ path: './env.local' });

const connectDB = require('./config/database');
const authRoutes = require('./routes/auth');
const communicationRoutes = require('./routes/communication');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Communication Server Running',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Communication Server is working!',
    endpoints: [
      'POST /api/auth/register - User registration',
      'POST /api/auth/login - User login',
      'POST /api/auth/logout - User logout',
      'GET /api/auth/me - Get current user',
      'PUT /api/auth/change-password - Change password',
      'POST /api/communication/call/initiate - Initiate one-to-one call',
      'POST /api/communication/call/group/initiate - Initiate group call',
      'POST /api/communication/call/:sessionId/join - Join call session',
      'POST /api/communication/call/:sessionId/leave - Leave call session',
      'PUT /api/communication/call/:sessionId/participant/state - Update participant state',
      'POST /api/communication/chat/:sessionId/message - Send chat message',
      'GET /api/communication/chat/:sessionId/messages - Get chat messages',
      'GET /api/communication/calls/active - Get active calls',
      'GET /api/communication/calls/history - Get call history',
      'POST /api/communication/call/:sessionId/end - End call session',
      'GET /api/communication/session/:sessionId - Get session details',
      'GET /api/communication/admin/sessions - Admin: Get all sessions'
    ]
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/communication', communicationRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`📞 Communication Server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/test`);
  console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth/*`);
  console.log(`📞 Communication endpoints: http://localhost:${PORT}/api/communication/*`);
  console.log(`📊 MongoDB: Connected to ${process.env.MONGODB_URI}`);
});

module.exports = app;
