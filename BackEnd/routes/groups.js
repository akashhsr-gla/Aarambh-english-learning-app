const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Group = require('../models/Group');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

// Validation middleware
const validateGroupCreation = [
  body('title').trim().isLength({ min: 3, max: 100 }).withMessage('Title must be 3-100 characters'),
  body('topic').trim().isLength({ min: 5, max: 500 }).withMessage('Topic must be 5-500 characters'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description must be max 1000 characters'),
  body('level').isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid language level'),
  body('maxParticipants').isInt({ min: 2, max: 50 }).withMessage('Max participants must be 2-50'),
  body('isPrivate').isBoolean().withMessage('isPrivate must be boolean'),
  body('password').optional().isLength({ min: 4, max: 20 }).withMessage('Password must be 4-20 characters'),
  body('settings.allowVideo').isBoolean().withMessage('allowVideo must be boolean'),
  body('settings.allowVoice').isBoolean().withMessage('allowVoice must be boolean'),
  body('settings.allowChat').isBoolean().withMessage('allowChat must be boolean')
];

const validateJoinGroup = [
  body('groupId').isMongoId().withMessage('Invalid group ID'),
  body('password').optional().isLength({ min: 1, max: 20 }).withMessage('Password must be 1-20 characters')
];

// 1. CREATE GROUP
router.post('/create', authenticateToken, validateGroupCreation, async (req, res) => {
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
      title,
      topic,
      description,
      level,
      maxParticipants,
      isPrivate,
      password,
      settings
    } = req.body;

    // Validate password for private groups
    if (isPrivate && !password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required for private groups'
      });
    }

    // Check if user is already in an active group
    const existingGroup = await Group.findOne({
      'participants.user': req.user._id,
      status: { $in: ['active', 'waiting'] }
    });

    if (existingGroup) {
      return res.status(400).json({
        success: false,
        message: 'You are already in an active group'
      });
    }

    // Generate join code
    const joinCode = Math.random().toString(36).substr(2, 8).toUpperCase();

    // Create group
    const group = new Group({
      title,
      topic,
      description,
      level,
      maxParticipants,
      isPrivate,
      password: isPrivate ? password : null,
      joinCode,
      host: req.user._id,
      participants: [{
        user: req.user._id,
        role: 'host',
        joinedAt: new Date(),
        isActive: true
      }],
      status: 'waiting',
      settings: {
        allowVideo: settings.allowVideo,
        allowVoice: settings.allowVoice,
        allowChat: settings.allowChat
      },
      groupSession: {
        maxParticipants,
        currentParticipants: 1,
        sessionType: null, // Will be set when session starts
        isActive: false
      }
    });

    await group.save();

    // Populate host information
    await group.populate('host', 'name email profilePicture');

    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      data: {
        groupId: group._id,
        joinCode: group.joinCode,
        group: {
          id: group._id,
          title: group.title,
          topic: group.topic,
          level: group.level,
          maxParticipants: group.maxParticipants,
          isPrivate: group.isPrivate,
          joinCode: group.joinCode,
          host: {
            id: group.host._id,
            name: group.host.name,
            email: group.host.email,
            profilePicture: group.host.profilePicture
          },
          participants: group.participants.map(p => ({
            id: p.user,
            role: p.role,
            isActive: p.isActive,
            joinedAt: p.joinedAt
          })),
          status: group.status,
          settings: group.settings,
          createdAt: group.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 2. GET AVAILABLE GROUPS
router.get('/available', authenticateToken, async (req, res) => {
  try {
    const { level, status, search, page = 1, limit = 20 } = req.query;

    // Build query
    const query = {
      status: { $in: ['waiting', 'active'] },
      'participants.user': { $ne: req.user._id } // Exclude groups user is already in
    };

    if (level) {
      query.level = level;
    }

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { topic: { $regex: search, $options: 'i' } }
      ];
    }

    // Get groups with pagination
    const groups = await Group.find(query)
      .populate('host', 'name email profilePicture')
      .populate('participants.user', 'name email profilePicture')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Group.countDocuments(query);

    res.json({
      success: true,
      data: {
        groups: groups.map(group => ({
          id: group._id,
          title: group.title,
          topic: group.topic,
          description: group.description,
          level: group.level,
          maxParticipants: group.maxParticipants,
          isPrivate: group.isPrivate,
          status: group.status,
          host: {
            id: group.host._id,
            name: group.host.name,
            email: group.host.email,
            profilePicture: group.host.profilePicture
          },
          participants: group.participants.map(p => ({
            id: p.user._id,
            name: p.user.name,
            email: p.user.email,
            profilePicture: p.user.profilePicture,
            role: p.role,
            isActive: p.isActive
          })),
          settings: group.settings,
          createdAt: group.createdAt
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get available groups error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 3. JOIN GROUP BY ID
router.post('/join', authenticateToken, validateJoinGroup, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { groupId, password } = req.body;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if group is full
    if (group.participants.length >= group.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: 'Group is full'
      });
    }

    // Check if group is private and password is required
    if (group.isPrivate) {
      if (!password || group.password !== password) {
        return res.status(400).json({
          success: false,
          message: 'Invalid password for private group'
        });
      }
    }

    // Check if user is already in the group
    const existingParticipant = group.participants.find(p => 
      p.user.toString() === req.user._id.toString()
    );

    if (existingParticipant) {
      return res.status(400).json({
        success: false,
        message: 'You are already in this group'
      });
    }

    // Add user to group
    group.participants.push({
      user: req.user._id,
      role: 'participant',
      joinedAt: new Date(),
      isActive: true
    });

    group.groupSession.currentParticipants = group.participants.length;

    // Update group status if it reaches minimum participants
    if (group.participants.length >= 2 && group.status === 'waiting') {
      group.status = 'ready';
    }

    await group.save();

    // Populate participants
    await group.populate('participants.user', 'name email profilePicture');
    await group.populate('host', 'name email profilePicture');

    res.json({
      success: true,
      message: 'Successfully joined group',
      data: {
        groupId: group._id,
        participants: group.participants.map(p => ({
          id: p.user._id,
          name: p.user.name,
          email: p.user.email,
          profilePicture: p.user.profilePicture,
          role: p.role,
          isActive: p.isActive,
          joinedAt: p.joinedAt
        })),
        group: {
          id: group._id,
          title: group.title,
          topic: group.topic,
          level: group.level,
          maxParticipants: group.maxParticipants,
          isPrivate: group.isPrivate,
          status: group.status,
          settings: group.settings,
          groupSession: group.groupSession
        }
      }
    });

  } catch (error) {
    console.error('Join group error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 4. JOIN GROUP BY CODE
router.post('/join-by-code', authenticateToken, async (req, res) => {
  try {
    const { joinCode, password } = req.body;

    if (!joinCode) {
      return res.status(400).json({
        success: false,
        message: 'Join code is required'
      });
    }

    const group = await Group.findOne({ joinCode });
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found with this code'
      });
    }

    // Use the same logic as join by ID
    req.body.groupId = group._id;
    return router.handle(req, res, () => {});

  } catch (error) {
    console.error('Join group by code error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 5. GET GROUP DETAILS
router.get('/:groupId', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId)
      .populate('host', 'name email profilePicture')
      .populate('participants.user', 'name email profilePicture');

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is a participant
    const isParticipant = group.participants.some(p => 
      p.user._id.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this group'
      });
    }

    res.json({
      success: true,
      data: {
        group: {
          id: group._id,
          title: group.title,
          topic: group.topic,
          description: group.description,
          level: group.level,
          maxParticipants: group.maxParticipants,
          isPrivate: group.isPrivate,
          status: group.status,
          host: {
            id: group.host._id,
            name: group.host.name,
            email: group.host.email,
            profilePicture: group.host.profilePicture
          },
          participants: group.participants.map(p => ({
            id: p.user._id,
            name: p.user.name,
            email: p.user.email,
            profilePicture: p.user.profilePicture,
            role: p.role,
            isActive: p.isActive,
            joinedAt: p.joinedAt
          })),
          settings: group.settings,
          groupSession: group.groupSession,
          createdAt: group.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Get group details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 6. SEND MESSAGE TO GROUP
router.post('/:groupId/message', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { message, messageType = 'text' } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is a participant
    const isParticipant = group.participants.some(p => 
      p.user.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this group'
      });
    }

    // Add message to group
    const chatMessage = {
      sender: req.user._id,
      message: message.trim(),
      messageType,
      timestamp: new Date(),
      isEdited: false,
      isDeleted: false
    };

    if (!group.messages) {
      group.messages = [];
    }

    group.messages.push(chatMessage);
    await group.save();

    res.json({
      success: true,
      message: 'Message sent successfully',
      data: {
        message: {
          id: chatMessage._id || chatMessage.timestamp,
          sender: {
            id: req.user._id,
            name: req.user.name
          },
          message: chatMessage.message,
          messageType: chatMessage.messageType,
          timestamp: chatMessage.timestamp
        }
      }
    });

  } catch (error) {
    console.error('Send group message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 7. GET GROUP MESSAGES
router.get('/:groupId/messages', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is a participant
    const isParticipant = group.participants.some(p => 
      p.user.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this group'
      });
    }

    if (!group.messages || group.messages.length === 0) {
      return res.json({
        success: true,
        data: {
          messages: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            pages: 0
          }
        }
      });
    }

    // Paginate messages
    const messages = group.messages
      .filter(msg => !msg.isDeleted)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const total = messages.length;
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedMessages = messages.slice(startIndex, endIndex);

    // Populate sender information
    const populatedMessages = await Promise.all(
      paginatedMessages.map(async (msg) => {
        const sender = await User.findById(msg.sender).select('name email profilePicture');
        return {
          id: msg._id || msg.timestamp,
          sender: {
            id: sender._id,
            name: sender.name,
            email: sender.email,
            profilePicture: sender.profilePicture
          },
          message: msg.message,
          messageType: msg.messageType,
          timestamp: msg.timestamp,
          isEdited: msg.isEdited
        };
      })
    );

    res.json({
      success: true,
      data: {
        messages: populatedMessages.reverse(), // Show in chronological order
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get group messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 8. START GROUP SESSION
router.post('/:groupId/start', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { sessionType } = req.body;

    if (!['chat', 'voice', 'video'].includes(sessionType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session type'
      });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is the host
    const isHost = group.participants.some(p => 
      p.user.toString() === req.user._id.toString() && p.role === 'host'
    );

    if (!isHost) {
      return res.status(403).json({
        success: false,
        message: 'Only the host can start the session'
      });
    }

    // Check if group has enough participants
    if (group.participants.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Need at least 2 participants to start session'
      });
    }

    // Update group status and session info
    group.status = 'active';
    group.groupSession.sessionType = sessionType;
    group.groupSession.isActive = true;
    group.groupSession.startedAt = new Date();

    await group.save();

    res.json({
      success: true,
      message: 'Group session started successfully',
      data: {
        groupId: group._id,
        sessionType,
        status: group.status,
        startedAt: group.groupSession.startedAt
      }
    });

  } catch (error) {
    console.error('Start group session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 9. LEAVE GROUP
router.post('/:groupId/leave', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is a participant
    const participantIndex = group.participants.findIndex(p => 
      p.user.toString() === req.user._id.toString()
    );

    if (participantIndex === -1) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this group'
      });
    }

    const participant = group.participants[participantIndex];

    // If user is the host, disband the group
    if (participant.role === 'host') {
      group.status = 'disbanded';
      group.groupSession.isActive = false;
      group.groupSession.endedAt = new Date();
    } else {
      // Remove participant
      group.participants.splice(participantIndex, 1);
      group.groupSession.currentParticipants = group.participants.length;

      // If no participants left, disband group
      if (group.participants.length === 0) {
        group.status = 'disbanded';
        group.groupSession.isActive = false;
        group.groupSession.endedAt = new Date();
      }
    }

    await group.save();

    res.json({
      success: true,
      message: participant.role === 'host' ? 'Group disbanded' : 'Left group successfully',
      data: {
        groupId: group._id,
        status: group.status,
        wasHost: participant.role === 'host'
      }
    });

  } catch (error) {
    console.error('Leave group error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 10. GET USER'S ACTIVE GROUPS
router.get('/my/active', authenticateToken, async (req, res) => {
  try {
    const groups = await Group.find({
      'participants.user': req.user._id,
      status: { $in: ['waiting', 'ready', 'active'] }
    })
    .populate('host', 'name email profilePicture')
    .populate('participants.user', 'name email profilePicture')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        groups: groups.map(group => ({
          id: group._id,
          title: group.title,
          topic: group.topic,
          level: group.level,
          maxParticipants: group.maxParticipants,
          isPrivate: group.isPrivate,
          status: group.status,
          host: {
            id: group.host._id,
            name: group.host.name,
            email: group.host.email,
            profilePicture: group.host.profilePicture
          },
          participants: group.participants.map(p => ({
            id: p.user._id,
            name: p.user.name,
            email: p.user.email,
            profilePicture: p.user.profilePicture,
            role: p.role,
            isActive: p.isActive
          })),
          settings: group.settings,
          groupSession: group.groupSession,
          createdAt: group.createdAt
        }))
      }
    });

  } catch (error) {
    console.error('Get user active groups error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 10. END GROUP SESSION
router.post('/:groupId/end-session', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is the host
    const isHost = group.participants.some(p => 
      p.user.toString() === req.user._id.toString() && p.role === 'host'
    );

    if (!isHost) {
      return res.status(403).json({
        success: false,
        message: 'Only the host can end the session'
      });
    }

    // End the session
    group.status = 'completed';
    group.groupSession.isActive = false;
    group.groupSession.endedAt = new Date();
    
    if (group.groupSession.startedAt) {
      group.groupSession.duration = Math.round(
        (group.groupSession.endedAt - group.groupSession.startedAt) / 1000
      );
    }

    await group.save();

    res.json({
      success: true,
      message: 'Group session ended successfully',
      data: {
        groupId: group._id,
        duration: group.groupSession.duration,
        endedAt: group.groupSession.endedAt
      }
    });

  } catch (error) {
    console.error('End group session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;