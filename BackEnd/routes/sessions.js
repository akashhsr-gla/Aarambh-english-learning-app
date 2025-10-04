const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Session = require('../models/Session');
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Validation middleware
const validateSessionQuery = [
  body('sessionType').optional().isIn(['video_call', 'voice_call', 'chat', 'group_video_call', 'group_voice_call', 'group_chat', 'group_discussion', 'game']).withMessage('Invalid session type'),
  body('status').optional().isIn(['active', 'completed', 'cancelled', 'paused', 'in_progress']).withMessage('Invalid session status'),
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

// 7. CREATE OR UPDATE GAME SESSION
router.post('/games/create-or-update', authenticateToken, async (req, res) => {
  try {
    const { 
      gameId, 
      gameType, 
      difficulty, 
      currentQuestionIndex, 
      timeLeft, 
      answers, 
      score,
      totalQuestions
    } = req.body;

    if (!gameId || !gameType) {
      return res.status(400).json({
        success: false,
        message: 'Game ID and game type are required'
      });
    }

    // Check if user has an active game session
    // Handle both ObjectId and string gameIds
    const gameQuery = {
      host: req.user._id,
      sessionType: 'game',
      status: { $in: ['active', 'scheduled'] }
    };
    
    // If gameId is a valid ObjectId, use it directly, otherwise use string comparison
    if (gameId.match(/^[0-9a-fA-F]{24}$/)) {
      gameQuery['gameSession.game'] = gameId;
    } else {
      gameQuery['gameSession.gameId'] = gameId; // Store as string for non-ObjectId gameIds
    }
    
    let session = await Session.findOne(gameQuery);

    if (session) {
      // Update existing session
      session.updateGameProgress(currentQuestionIndex, timeLeft, answers);
      if (score !== undefined) {
        session.gameSession.scores = session.gameSession.scores || [];
        // Update current user's score if exists, otherwise add new
        const existingScoreIndex = session.gameSession.scores.findIndex(s => 
          s.user.toString() === req.user._id.toString()
        );
        if (existingScoreIndex >= 0) {
          session.gameSession.scores[existingScoreIndex].score = score;
        }
      }
    } else {
      // Create new session
      console.log('Creating new game session with data:', {
        gameId,
        gameType,
        difficulty,
        currentQuestionIndex,
        score,
        totalQuestions
      });
      
      session = new Session({
        sessionId: `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sessionType: 'game',
        title: `Playing ${gameType} Game`,
        host: req.user._id,
        participants: [{
          user: req.user._id,
          role: 'player',
          joinedAt: new Date()
        }],
        gameSession: {
          game: gameId.match(/^[0-9a-fA-F]{24}$/) ? gameId : null,
          gameId: gameId.match(/^[0-9a-fA-F]{24}$/) ? null : gameId,
          gameType,
          difficulty,
          totalQuestions,
          currentQuestionIndex: currentQuestionIndex || 0,
          timeLeft: timeLeft || 0,
          answers: answers || [],
          gameStatus: 'in_progress',
          startTime: new Date()
        }
      });
      
      console.log('Session created, calling startSession...');
      session.startSession();
      console.log('Session started successfully');
    }

    console.log('Saving session to database...');
    await session.save();
    console.log('Session saved successfully with ID:', session._id);

    res.json({
      success: true,
      message: 'Game session saved successfully',
      data: {
        sessionId: session._id,
        gameSession: session.gameSession
      }
    });

  } catch (error) {
    console.error('Create/update game session error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// 8. GET ACTIVE GAME SESSION
router.get('/games/active', authenticateToken, async (req, res) => {
  try {
    const session = await Session.findOne({
      host: req.user._id,
      sessionType: 'game',
      status: { $in: ['active', 'scheduled'] },
      'gameSession.gameStatus': { $in: ['in_progress', 'paused'] }
    })
    .populate('gameSession.game', 'title gameType difficulty questions')
    .sort({ createdAt: -1 });

    if (!session) {
      return res.json({
        success: true,
        message: 'No active game session found',
        data: null
      });
    }

    res.json({
      success: true,
      message: 'Active game session retrieved',
      data: {
        sessionId: session._id,
        gameSession: session.gameSession,
        status: session.status,
        startedAt: session.startedAt
      }
    });

  } catch (error) {
    console.error('Get active game session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 9. PAUSE GAME SESSION
router.post('/games/:sessionId/pause', authenticateToken, async (req, res) => {
  try {
    const session = await Session.findOne({
      _id: req.params.sessionId,
      host: req.user._id,
      sessionType: 'game'
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Game session not found'
      });
    }

    session.pauseGame();
    await session.save();

    res.json({
      success: true,
      message: 'Game session paused successfully'
    });

  } catch (error) {
    console.error('Pause game session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 10. RESUME GAME SESSION
router.post('/games/:sessionId/resume', authenticateToken, async (req, res) => {
  try {
    const session = await Session.findOne({
      _id: req.params.sessionId,
      host: req.user._id,
      sessionType: 'game'
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Game session not found'
      });
    }

    session.resumeGame();
    await session.save();

    res.json({
      success: true,
      message: 'Game session resumed successfully'
    });

  } catch (error) {
    console.error('Resume game session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 11. CREATE OR UPDATE GROUP DISCUSSION SESSION
router.post('/groups/create-or-update', authenticateToken, async (req, res) => {
  try {
    const { 
      groupId, 
      groupName, 
      topic, 
      level, 
      discussionType,
      maxParticipants,
      isPrivate,
      joinCode
    } = req.body;

    if (!groupId) {
      return res.status(400).json({
        success: false,
        message: 'Group ID is required'
      });
    }

    // Check if user has an active group discussion session
    let session = await Session.findOne({
      host: req.user._id,
      sessionType: 'group_discussion',
      'groupSession.groupId': groupId,
      status: { $in: ['active', 'scheduled'] }
    });

    if (session) {
      // Update existing session
      if (discussionType) session.groupSession.discussionType = discussionType;
      if (maxParticipants) session.groupSession.maxParticipants = maxParticipants;
    } else {
      // Create new session
      session = new Session({
        sessionId: `group_discussion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sessionType: 'group_discussion',
        title: groupName || 'Group Discussion',
        description: topic || 'Group discussion session',
        host: req.user._id,
        participants: [{
          user: req.user._id,
          role: 'host',
          joinedAt: new Date()
        }],
        groupSession: {
          groupId,
          groupName,
          topic,
          level: level || 'beginner',
          discussionType: discussionType || 'chat',
          maxParticipants: maxParticipants || 10,
          currentParticipants: 1,
          isPrivate: isPrivate || false,
          joinCode: joinCode
        }
      });
      
      session.startSession();
    }

    await session.save();

    res.json({
      success: true,
      message: 'Group discussion session saved successfully',
      data: {
        sessionId: session._id,
        groupSession: session.groupSession
      }
    });

  } catch (error) {
    console.error('Create/update group discussion session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 12. GET ACTIVE GROUP DISCUSSION SESSION
router.get('/groups/active', authenticateToken, async (req, res) => {
  try {
    const session = await Session.findOne({
      $or: [
        { host: req.user._id },
        { 'participants.user': req.user._id }
      ],
      sessionType: 'group_discussion',
      status: { $in: ['active', 'scheduled'] }
    })
    .populate('host', 'name email')
    .populate('participants.user', 'name email')
    .populate('groupSession.groupId', 'title topic level participants')
    .sort({ createdAt: -1 });

    if (!session) {
      return res.json({
        success: true,
        message: 'No active group discussion session found',
        data: null
      });
    }

    res.json({
      success: true,
      message: 'Active group discussion session retrieved',
      data: {
        sessionId: session._id,
        groupSession: session.groupSession,
        status: session.status,
        startedAt: session.startedAt,
        participants: session.participants
      }
    });

  } catch (error) {
    console.error('Get active group discussion session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 13. GET USER'S RECENT SESSIONS (ALL TYPES)
router.get('/recent', authenticateToken, async (req, res) => {
  try {
    const { limit = 10, sessionType } = req.query;
    
    let query = {
      $or: [
        { host: req.user._id },
        { 'participants.user': req.user._id }
      ]
    };
    
    if (sessionType) {
      query.sessionType = sessionType;
    }

    const sessions = await Session.find(query)
      .populate('host', 'name email')
      .populate('participants.user', 'name email')
      .populate('gameSession.game', 'title gameType')
      .populate('groupSession.groupId', 'title topic level')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    const formattedSessions = sessions.map(session => ({
      _id: session._id,
      sessionId: session.sessionId,
      sessionType: session.sessionType,
      title: session.title,
      status: session.status,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      duration: session.duration,
      gameSession: session.gameSession,
      groupSession: session.groupSession,
      participantCount: session.participants.length,
      isHost: session.host._id.toString() === req.user._id.toString(),
      createdAt: session.createdAt
    }));

    res.json({
      success: true,
      message: 'Recent sessions retrieved successfully',
      data: {
        sessions: formattedSessions,
        count: formattedSessions.length
      }
    });

  } catch (error) {
    console.error('Get recent sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 12. CREATE OR UPDATE LECTURE SESSION
router.post('/lectures/create-or-update', authenticateToken, async (req, res) => {
  try {
    const { 
      lectureId, 
      totalDuration,
      position = 0,
      action = 'play'
    } = req.body;

    if (!lectureId) {
      return res.status(400).json({
        success: false,
        message: 'Lecture ID is required'
      });
    }

    // Check if lecture exists
    const VideoLecture = require('../models/VideoLecture');
    const lecture = await VideoLecture.findById(lectureId);
    if (!lecture) {
      return res.status(404).json({
        success: false,
        message: 'Lecture not found'
      });
    }

    // Look for existing lecture session
    const sessionQuery = {
      host: req.user._id,
      sessionType: 'lecture',
      'lectureSession.lecture': lectureId
    };
    
    let session = await Session.findOne(sessionQuery);

    if (session) {
      // Update existing session
      session.updateLectureProgress(position, action);
      if (totalDuration) {
        session.lectureSession.totalDuration = totalDuration;
      }
    } else {
      // Create new lecture session
      session = new Session({
        sessionId: `lecture_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sessionType: 'lecture',
        title: `Watching: ${lecture.title}`,
        host: req.user._id,
        participants: [{
          user: req.user._id,
          role: 'viewer',
          joinedAt: new Date()
        }],
        lectureSession: {
          lecture: lectureId,
          totalDuration: totalDuration || lecture.duration,
          watchTime: position,
          completionPercentage: 0,
          isCompleted: false,
          lastWatchedAt: new Date(),
          watchHistory: [],
          bookmarks: []
        }
      });
      
      session.startLecture(lectureId, totalDuration || lecture.duration);
      if (position > 0) {
        session.updateLectureProgress(position, action);
      }
    }

    await session.save();

    res.json({
      success: true,
      message: 'Lecture session saved successfully',
      data: {
        sessionId: session._id,
        lectureId: lectureId,
        watchTime: session.lectureSession.watchTime,
        completionPercentage: session.lectureSession.completionPercentage,
        isCompleted: session.lectureSession.isCompleted
      }
    });

  } catch (error) {
    console.error('Create/update lecture session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 13. GET ACTIVE LECTURE SESSION
router.get('/lectures/active', authenticateToken, async (req, res) => {
  try {
    const session = await Session.findOne({
      host: req.user._id,
      sessionType: 'lecture',
      status: { $in: ['active', 'scheduled'] }
    })
    .populate('lectureSession.lecture', 'title description duration videoUrl thumbnailUrl')
    .sort({ createdAt: -1 });

    if (!session) {
      return res.json({
        success: true,
        message: 'No active lecture session found',
        data: null
      });
    }

    res.json({
      success: true,
      message: 'Active lecture session retrieved',
      data: {
        sessionId: session._id,
        lectureSession: session.lectureSession,
        status: session.status,
        startedAt: session.startedAt
      }
    });

  } catch (error) {
    console.error('Get active lecture session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 14. UPDATE LECTURE PROGRESS
router.post('/lectures/:sessionId/progress', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { position, action = 'play' } = req.body;

    const session = await Session.findOne({
      _id: sessionId,
      host: req.user._id,
      sessionType: 'lecture'
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Lecture session not found'
      });
    }

    session.updateLectureProgress(position, action);
    await session.save();

    res.json({
      success: true,
      message: 'Lecture progress updated successfully',
      data: {
        watchTime: session.lectureSession.watchTime,
        completionPercentage: session.lectureSession.completionPercentage,
        isCompleted: session.lectureSession.isCompleted
      }
    });

  } catch (error) {
    console.error('Update lecture progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 15. ADD LECTURE BOOKMARK
router.post('/lectures/:sessionId/bookmark', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { position, title, note } = req.body;

    const session = await Session.findOne({
      _id: sessionId,
      host: req.user._id,
      sessionType: 'lecture'
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Lecture session not found'
      });
    }

    session.addLectureBookmark(position, title, note);
    await session.save();

    res.json({
      success: true,
      message: 'Bookmark added successfully',
      data: {
        bookmarks: session.lectureSession.bookmarks
      }
    });

  } catch (error) {
    console.error('Add lecture bookmark error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 16. UPDATE LECTURE NOTES
router.post('/lectures/:sessionId/notes', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { notes } = req.body;

    const session = await Session.findOne({
      _id: sessionId,
      host: req.user._id,
      sessionType: 'lecture'
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Lecture session not found'
      });
    }

    session.updateLectureNotes(notes);
    await session.save();

    res.json({
      success: true,
      message: 'Lecture notes updated successfully',
      data: {
        notes: session.lectureSession.notes
      }
    });

  } catch (error) {
    console.error('Update lecture notes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
