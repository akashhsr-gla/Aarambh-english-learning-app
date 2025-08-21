const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Session = require('../models/Session');
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Validation middleware
const validateSessionQuery = [
  body('sessionType').optional().isIn(['video_call', 'voice_call', 'chat', 'group_video_call', 'group_voice_call', 'group_chat', 'game']).withMessage('Invalid session type'),
  body('status').optional().isIn(['active', 'completed', 'cancelled']).withMessage('Invalid session status'),
  body('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  body('endDate').optional().isISO8601().withMessage('Invalid end date format')
];

// 1. GET ALL SESSIONS (Admin only)
router.get('/admin/all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { 
      sessionType, 
      status, 
      startDate, 
      endDate, 
      region,
      page = 1, 
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter
    let filter = {};
    if (sessionType) filter.sessionType = sessionType;
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    if (region) filter['participants.region'] = region;

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get sessions with pagination
    const sessions = await Session.find(filter)
      .populate('participants.user', 'name email role profilePicture')
      .populate('host', 'name email role profilePicture')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Session.countDocuments(filter);

    // Calculate statistics
    const stats = await Session.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$sessionType',
          count: { $sum: 1 },
          totalDuration: { $sum: '$duration' },
          avgDuration: { $avg: '$duration' }
        }
      }
    ]);

    res.json({
      success: true,
      message: 'All sessions retrieved successfully',
      data: {
        sessions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        statistics: stats,
        filters: {
          sessionType: sessionType || 'all',
          status: status || 'all',
          startDate: startDate || 'none',
          endDate: endDate || 'none',
          region: region || 'all'
        }
      }
    });

  } catch (error) {
    console.error('Get all sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 2. GET SESSIONS BY TYPE (Admin only)
router.get('/admin/type/:sessionType', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { sessionType } = req.params;
    const { status, startDate, endDate, page = 1, limit = 20 } = req.query;

    // Validate session type
    const validTypes = ['video_call', 'voice_call', 'chat', 'group_video_call', 'group_voice_call', 'group_chat', 'game'];
    if (!validTypes.includes(sessionType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session type'
      });
    }

    // Build filter
    let filter = { sessionType };
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get sessions
    const sessions = await Session.find(filter)
      .populate('participants.user', 'name email role profilePicture')
      .populate('host', 'name email role profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Session.countDocuments(filter);

    // Get type-specific statistics
    const typeStats = await Session.aggregate([
      { $match: { sessionType } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalDuration: { $sum: '$duration' },
          avgDuration: { $avg: '$duration' },
          avgParticipants: { $avg: { $size: '$participants' } }
        }
      }
    ]);

    res.json({
      success: true,
      message: `${sessionType} sessions retrieved successfully`,
      data: {
        sessionType,
        sessions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        statistics: typeStats,
        filters: {
          status: status || 'all',
          startDate: startDate || 'none',
          endDate: endDate || 'none'
        }
      }
    });

  } catch (error) {
    console.error('Get sessions by type error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 3. GET USER'S OWN SESSIONS
router.get('/my-sessions', authenticateToken, async (req, res) => {
  try {
    const { 
      sessionType, 
      status, 
      startDate, 
      endDate,
      page = 1, 
      limit = 20 
    } = req.query;

    // Build filter for user's sessions
    let filter = {
      'participants.user': req.user._id
    };

    if (sessionType) filter.sessionType = sessionType;
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get user's sessions
    const sessions = await Session.find(filter)
      .populate('participants.user', 'name email role profilePicture')
      .populate('host', 'name email role profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Session.countDocuments(filter);

    // Get user's session statistics
    const userStats = await Session.aggregate([
      { $match: { 'participants.user': req.user._id } },
      {
        $group: {
          _id: '$sessionType',
          count: { $sum: 1 },
          totalDuration: { $sum: '$duration' },
          avgDuration: { $avg: '$duration' }
        }
      }
    ]);

    res.json({
      success: true,
      message: 'User sessions retrieved successfully',
      data: {
        sessions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        statistics: userStats,
        filters: {
          sessionType: sessionType || 'all',
          status: status || 'all',
          startDate: startDate || 'none',
          endDate: endDate || 'none'
        }
      }
    });

  } catch (error) {
    console.error('Get user sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 4. GET SESSION BY ID (User can access if they participated, Admin can access all)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session ID format'
      });
    }

    const session = await Session.findById(id)
      .populate('participants.user', 'name email role profilePicture')
      .populate('host', 'name email role profilePicture');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if user can access this session
    const isParticipant = session.participants.some(p => p.user._id.toString() === req.user._id.toString());
    const isHost = session.host._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isParticipant && !isHost && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view sessions you participated in.'
      });
    }

    res.json({
      success: true,
      message: 'Session retrieved successfully',
      data: session
    });

  } catch (error) {
    console.error('Get session by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 5. GET SESSION STATISTICS (Admin only)
router.get('/admin/statistics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate, region } = req.query;

    // Build date filter
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Build region filter
    let regionFilter = {};
    if (region) {
      regionFilter['participants.region'] = region;
    }

    // Combine filters
    const filter = { ...dateFilter, ...regionFilter };

    // Get comprehensive statistics
    const stats = await Session.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            sessionType: '$sessionType',
            status: '$status'
          },
          count: { $sum: 1 },
          totalDuration: { $sum: '$duration' },
          avgDuration: { $avg: '$duration' },
          avgParticipants: { $avg: { $size: '$participants' } }
        }
      },
      {
        $group: {
          _id: '$_id.sessionType',
          statuses: {
            $push: {
              status: '$_id.status',
              count: '$count',
              totalDuration: '$totalDuration',
              avgDuration: '$avgDuration',
              avgParticipants: '$avgParticipants'
            }
          },
          totalCount: { $sum: '$count' },
          totalDuration: { $sum: '$totalDuration' }
        }
      }
    ]);

    // Get recent activity
    const recentSessions = await Session.find(filter)
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('participants.user', 'name email role')
      .populate('host', 'name email role')
      .select('sessionType status duration participants host createdAt');

    // Get top regions by session count
    const topRegions = await Session.aggregate([
      { $match: filter },
      { $unwind: '$participants' },
      {
        $group: {
          _id: '$participants.region',
          sessionCount: { $sum: 1 },
          totalDuration: { $sum: '$duration' }
        }
      },
      { $sort: { sessionCount: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      success: true,
      message: 'Session statistics retrieved successfully',
      data: {
        statistics: stats,
        recentSessions,
        topRegions,
        filters: {
          startDate: startDate || 'none',
          endDate: endDate || 'none',
          region: region || 'all'
        }
      }
    });

  } catch (error) {
    console.error('Get session statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 6. SEARCH SESSIONS (Admin only)
router.post('/admin/search', authenticateToken, requireAdmin, validateSessionQuery, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { 
      sessionType, 
      status, 
      startDate, 
      endDate, 
      region,
      participantEmail,
      hostEmail,
      page = 1, 
      limit = 20 
    } = req.body;

    // Build filter
    let filter = {};
    if (sessionType) filter.sessionType = sessionType;
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    if (region) filter['participants.region'] = region;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get sessions with filters
    let sessions = await Session.find(filter)
      .populate('participants.user', 'name email role profilePicture')
      .populate('host', 'name email role profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Filter by participant email if specified
    if (participantEmail) {
      sessions = sessions.filter(session => 
        session.participants.some(p => 
          p.user.email.toLowerCase().includes(participantEmail.toLowerCase())
        )
      );
    }

    // Filter by host email if specified
    if (hostEmail) {
      sessions = sessions.filter(session => 
        session.host.email.toLowerCase().includes(hostEmail.toLowerCase())
      );
    }

    // Get total count
    const total = await Session.countDocuments(filter);

    res.json({
      success: true,
      message: 'Sessions search completed successfully',
      data: {
        sessions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        searchCriteria: {
          sessionType: sessionType || 'all',
          status: status || 'all',
          startDate: startDate || 'none',
          endDate: endDate || 'none',
          region: region || 'all',
          participantEmail: participantEmail || 'none',
          hostEmail: hostEmail || 'none'
        }
      }
    });

  } catch (error) {
    console.error('Search sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
