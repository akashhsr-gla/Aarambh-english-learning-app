const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Session = require('../models/Session');
const User = require('../models/User');
const Region = require('../models/Region');
const { authenticateToken } = require('../middleware/auth');

// Validation middleware
const validateGroupCreation = [
  body('title').trim().isLength({ min: 3, max: 100 }).withMessage('Title must be 3-100 characters'),
  body('topic').trim().isLength({ min: 5, max: 200 }).withMessage('Topic must be 5-200 characters'),
  body('maxParticipants').isInt({ min: 2, max: 20 }).withMessage('Max participants must be 2-20'),
  body('level').isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid level'),
  body('isPrivate').isBoolean().withMessage('isPrivate must be boolean'),
  body('password').optional().trim().isLength({ min: 4, max: 20 }).withMessage('Password must be 4-20 characters')
];

const validateJoinGroup = [
  body('groupId').isMongoId().withMessage('Invalid group ID'),
  body('password').optional().trim().isLength({ min: 4, max: 20 }).withMessage('Password must be 4-20 characters')
];

const validateGroupMessage = [
  body('message').trim().isLength({ min: 1, max: 1000 }).withMessage('Message must be 1-1000 characters'),
  body('messageType').optional().isIn(['text', 'image', 'file', 'audio']).withMessage('Invalid message type')
];

// 1. CREATE GROUP DISCUSSION ROOM
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

    const { title, topic, maxParticipants, level, isPrivate, password } = req.body;
    
    // Get current user with region
    const currentUser = await User.findById(req.user._id).populate('region', 'name code');
    if (!currentUser || !currentUser.region) {
      return res.status(400).json({
        success: false,
        message: 'User must be assigned to a region to create groups'
      });
    }

    // Validate password for private groups
    if (isPrivate && !password) {
      return res.status(400).json({
        success: false,
        message: 'Password required for private groups'
      });
    }

    // Generate unique group code
    const groupCode = Math.random().toString(36).substr(2, 8).toUpperCase();

    // Create group discussion session
    const groupSession = new Session({
      sessionId: `group_discussion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionType: 'group_chat',
      title,
      description: topic,
      host: req.user._id,
      participants: [{
        user: req.user._id,
        role: 'host',
        joinedAt: new Date(),
        isActive: true
      }],
      status: 'scheduled',
      region: currentUser.region._id,
      isPrivate,
      groupSession: {
        groupName: title,
        maxParticipants,
        isPublic: !isPrivate,
        joinCode: groupCode
      },
      chatSession: {
        messages: [{
          sender: req.user._id,
          message: `Welcome to ${title}! Let's discuss: ${topic}`,
          messageType: 'text',
          timestamp: new Date(),
          isSystemMessage: true
        }],
        totalMessages: 1,
        lastMessageAt: new Date()
      },
      analytics: {
        totalParticipants: 1
      }
    });

    // Add password if private
    if (isPrivate && password) {
      groupSession.groupSession.password = password;
    }

    // Add level information
    groupSession.groupSession.level = level;

    await groupSession.save();

    res.status(201).json({
      success: true,
      message: 'Group discussion room created successfully',
      data: {
        groupId: groupSession._id,
        sessionId: groupSession.sessionId,
        title: groupSession.title,
        topic: groupSession.description,
        joinCode: groupCode,
        maxParticipants,
        level,
        isPrivate,
        host: {
          id: currentUser._id,
          name: currentUser.name
        },
        region: currentUser.region.name,
        participants: [{
          id: currentUser._id,
          name: currentUser.name,
          isHost: true,
          isReady: true
        }],
        status: 'scheduled',
        createdAt: groupSession.createdAt
      }
    });

  } catch (error) {
    console.error('Create group discussion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 2. GET ALL AVAILABLE GROUPS (Region-based)
router.get('/available', authenticateToken, async (req, res) => {
  try {
    const { level, status = 'open', page = 1, limit = 20, search } = req.query;
    
    // Get current user with region
    const currentUser = await User.findById(req.user._id).populate('region', 'name code');
    if (!currentUser || !currentUser.region) {
      return res.status(400).json({
        success: false,
        message: 'User must be assigned to a region to view groups'
      });
    }

    // Build filter
    let filter = {
      sessionType: 'group_chat',
      region: currentUser.region._id,
      isPrivate: false, // Only show public groups
      status: { $in: ['scheduled', 'active'] }
    };

    // Add level filter if specified
    if (level) {
      filter['groupSession.level'] = level;
    }

    // Add search filter if specified
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by status
    if (status === 'open') {
      // Groups that are not full and not yet started
      filter.status = 'scheduled';
    } else if (status === 'ongoing') {
      filter.status = 'active';
    } else if (status === 'full') {
      // This will be handled in aggregation
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get groups with participant counts
    const groupsAggregation = [
      { $match: filter },
      {
        $lookup: {
          from: 'users',
          localField: 'host',
          foreignField: '_id',
          as: 'hostDetails'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'participants.user',
          foreignField: '_id',
          as: 'participantDetails'
        }
      },
      {
        $addFields: {
          participantCount: { $size: '$participants' },
          isFull: { $gte: [{ $size: '$participants' }, '$groupSession.maxParticipants'] }
        }
      },
      {
        $match: status === 'full' ? { isFull: true } : status === 'open' ? { isFull: false } : {}
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) }
    ];

    const groups = await Session.aggregate(groupsAggregation);

    // Get total count
    const totalCountAggregation = [
      { $match: filter },
      {
        $addFields: {
          participantCount: { $size: '$participants' },
          isFull: { $gte: [{ $size: '$participants' }, '$groupSession.maxParticipants'] }
        }
      },
      {
        $match: status === 'full' ? { isFull: true } : status === 'open' ? { isFull: false } : {}
      },
      { $count: "total" }
    ];

    const totalResult = await Session.aggregate(totalCountAggregation);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    // Format response
    const formattedGroups = groups.map(group => ({
      id: group._id,
      title: group.title,
      topic: group.description,
      participants: group.participantDetails.map(p => ({
        id: p._id,
        name: p.name,
        avatar: p.profilePicture
      })),
      maxParticipants: group.groupSession.maxParticipants,
      status: group.isFull ? 'full' : (group.status === 'active' ? 'ongoing' : 'open'),
      level: group.groupSession.level,
      createdAt: group.createdAt,
      host: group.hostDetails[0] ? {
        id: group.hostDetails[0]._id,
        name: group.hostDetails[0].name
      } : null
    }));

    res.json({
      success: true,
      message: 'Available groups retrieved successfully',
      data: {
        groups: formattedGroups,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        filters: {
          level: level || 'all',
          status: status || 'all',
          search: search || 'none',
          region: currentUser.region.name
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

// 3. JOIN GROUP DISCUSSION
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
    
    // Get current user with region
    const currentUser = await User.findById(req.user._id).populate('region', 'name code');
    if (!currentUser || !currentUser.region) {
      return res.status(400).json({
        success: false,
        message: 'User must be assigned to a region to join groups'
      });
    }

    // Find group
    const group = await Session.findById(groupId)
      .populate('host', 'name email')
      .populate('participants.user', 'name email profilePicture');

    if (!group || group.sessionType !== 'group_chat') {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if group is in same region
    if (group.region.toString() !== currentUser.region._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only join groups in your region'
      });
    }

    // Check if group is full
    if (group.participants.length >= group.groupSession.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: 'Group is full'
      });
    }

    // Check if already a participant
    const isAlreadyParticipant = group.participants.some(p => 
      p.user._id.toString() === req.user._id.toString()
    );

    if (isAlreadyParticipant) {
      return res.status(400).json({
        success: false,
        message: 'You are already a participant in this group'
      });
    }

    // Check password for private groups
    if (group.isPrivate && (!password || password !== group.groupSession.password)) {
      return res.status(403).json({
        success: false,
        message: 'Invalid password for private group'
      });
    }

    // Check if user is in another active group
    const existingActiveGroup = await Session.findOne({
      'participants.user': req.user._id,
      sessionType: 'group_chat',
      status: { $in: ['scheduled', 'active'] }
    });

    if (existingActiveGroup) {
      return res.status(400).json({
        success: false,
        message: 'You are already in another active group discussion'
      });
    }

    // Add user to group
    group.participants.push({
      user: req.user._id,
      role: 'participant',
      joinedAt: new Date(),
      isActive: true
    });

    // Add system message about user joining
    group.chatSession.messages.push({
      sender: req.user._id,
      message: `${currentUser.name} joined the discussion`,
      messageType: 'text',
      timestamp: new Date(),
      isSystemMessage: true
    });

    group.chatSession.totalMessages += 1;
    group.chatSession.lastMessageAt = new Date();
    group.analytics.totalParticipants = group.participants.length;

    await group.save();

    res.json({
      success: true,
      message: 'Successfully joined group discussion',
      data: {
        groupId: group._id,
        sessionId: group.sessionId,
        title: group.title,
        topic: group.description,
        participants: group.participants.map(p => ({
          id: p.user._id,
          name: p.user.name,
          isHost: p.role === 'host',
          isReady: p.isActive
        })),
        maxParticipants: group.groupSession.maxParticipants,
        joinCode: group.groupSession.joinCode
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
router.post('/join-by-code', authenticateToken, [
  body('joinCode').trim().isLength({ min: 8, max: 8 }).withMessage('Join code must be 8 characters'),
  body('password').optional().trim().isLength({ min: 4, max: 20 }).withMessage('Password must be 4-20 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { joinCode, password } = req.body;
    
    // Get current user with region
    const currentUser = await User.findById(req.user._id).populate('region', 'name code');
    if (!currentUser || !currentUser.region) {
      return res.status(400).json({
        success: false,
        message: 'User must be assigned to a region to join groups'
      });
    }

    // Find group by join code
    const group = await Session.findOne({
      'groupSession.joinCode': joinCode.toUpperCase(),
      sessionType: 'group_chat',
      status: { $in: ['scheduled', 'active'] }
    })
    .populate('host', 'name email')
    .populate('participants.user', 'name email profilePicture');

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Invalid join code or group not available'
      });
    }

    // Check if group is in same region
    if (group.region.toString() !== currentUser.region._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only join groups in your region'
      });
    }

    // Use the existing join logic
    return router.handle({ 
      body: { groupId: group._id, password }, 
      user: req.user 
    }, res, () => {});

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

    // Validate ID format
    if (!groupId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid group ID format'
      });
    }

    const group = await Session.findById(groupId)
      .populate('host', 'name email profilePicture region')
      .populate('participants.user', 'name email profilePicture')
      .populate('region', 'name code');

    if (!group || group.sessionType !== 'group_chat') {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user can access this group
    const isParticipant = group.participants.some(p => 
      p.user._id.toString() === req.user._id.toString()
    );
    const isHost = group.host._id.toString() === req.user._id.toString();

    if (!isParticipant && !isHost) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view groups you are part of.'
      });
    }

    res.json({
      success: true,
      message: 'Group details retrieved successfully',
      data: {
        groupId: group._id,
        sessionId: group.sessionId,
        title: group.title,
        topic: group.description,
        status: group.status,
        level: group.groupSession.level,
        isPrivate: group.isPrivate,
        joinCode: group.groupSession.joinCode,
        maxParticipants: group.groupSession.maxParticipants,
        host: {
          id: group.host._id,
          name: group.host.name,
          profilePicture: group.host.profilePicture
        },
        participants: group.participants.map(p => ({
          id: p.user._id,
          name: p.user.name,
          profilePicture: p.user.profilePicture,
          isHost: p.role === 'host',
          isReady: p.isActive,
          joinedAt: p.joinedAt
        })),
        region: group.region ? group.region.name : null,
        createdAt: group.createdAt,
        analytics: group.analytics
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
router.post('/:groupId/message', authenticateToken, validateGroupMessage, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { groupId } = req.params;
    const { message, messageType = 'text' } = req.body;

    // Find group and verify user is participant
    const group = await Session.findById(groupId);

    if (!group || group.sessionType !== 'group_chat') {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    const isParticipant = group.participants.some(p => 
      p.user.toString() === req.user._id.toString() && p.isActive
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not an active participant in this group'
      });
    }

    // Add message
    const newMessage = {
      _id: new require('mongoose').Types.ObjectId(),
      sender: req.user._id,
      message,
      messageType,
      timestamp: new Date(),
      isRead: false,
      isEdited: false,
      isDeleted: false,
      isSystemMessage: false
    };

    group.chatSession.messages.push(newMessage);
    group.chatSession.totalMessages += 1;
    group.chatSession.lastMessageAt = new Date();

    await group.save();

    // Get sender details for response
    const sender = await User.findById(req.user._id).select('name profilePicture');

    res.json({
      success: true,
      message: 'Message sent successfully',
      data: {
        messageId: newMessage._id,
        sender: {
          id: sender._id,
          name: sender.name,
          profilePicture: sender.profilePicture
        },
        message: newMessage.message,
        messageType: newMessage.messageType,
        timestamp: newMessage.timestamp,
        groupId: group._id
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

    // Find group and verify user is participant
    const group = await Session.findById(groupId)
      .populate({
        path: 'chatSession.messages.sender',
        select: 'name profilePicture'
      });

    if (!group || group.sessionType !== 'group_chat') {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    const isParticipant = group.participants.some(p => 
      p.user.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this group'
      });
    }

    // Get paginated messages
    const messages = group.chatSession.messages
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice((page - 1) * limit, page * limit)
      .reverse(); // Reverse to show oldest first

    res.json({
      success: true,
      message: 'Group messages retrieved successfully',
      data: {
        messages: messages.map(msg => ({
          id: msg._id,
          sender: {
            id: msg.sender._id,
            name: msg.sender.name,
            profilePicture: msg.sender.profilePicture
          },
          message: msg.message,
          messageType: msg.messageType,
          timestamp: msg.timestamp,
          isSystemMessage: msg.isSystemMessage || false,
          isEdited: msg.isEdited || false,
          isDeleted: msg.isDeleted || false
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: group.chatSession.totalMessages,
          pages: Math.ceil(group.chatSession.totalMessages / parseInt(limit))
        },
        groupInfo: {
          id: group._id,
          title: group.title,
          topic: group.description
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

// 8. START GROUP SESSION (Host only)
router.post('/:groupId/start', authenticateToken, [
  body('sessionType').isIn(['chat', 'voice', 'video']).withMessage('Invalid session type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { groupId } = req.params;
    const { sessionType } = req.body;

    // Find group and verify user is host
    const group = await Session.findById(groupId)
      .populate('participants.user', 'name email');

    if (!group || group.sessionType !== 'group_chat') {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    if (group.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the host can start the group session'
      });
    }

    if (group.status === 'active') {
      return res.status(400).json({
        success: false,
        message: 'Group session is already active'
      });
    }

    // Minimum participants check
    const activeParticipants = group.participants.filter(p => p.isActive);
    if (activeParticipants.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'At least 2 participants required to start session'
      });
    }

    // Update session type and start session
    if (sessionType === 'voice') {
      group.sessionType = 'group_voice_call';
      group.callSession = {
        callType: 'voice',
        isGroupCall: true,
        maxParticipants: group.groupSession.maxParticipants,
        quality: 'high',
        settings: {
          allowScreenShare: false,
          allowRecording: false,
          allowChat: true,
          muteOnEntry: false,
          videoOnEntry: false,
          allowParticipantMute: true,
          allowParticipantVideo: false
        }
      };
    } else if (sessionType === 'video') {
      group.sessionType = 'group_video_call';
      group.callSession = {
        callType: 'video',
        isGroupCall: true,
        maxParticipants: group.groupSession.maxParticipants,
        quality: 'high',
        settings: {
          allowScreenShare: true,
          allowRecording: false,
          allowChat: true,
          muteOnEntry: false,
          videoOnEntry: true,
          allowParticipantMute: true,
          allowParticipantVideo: true
        }
      };
    }

    // Start the session
    group.startSession();

    // Add system message
    group.chatSession.messages.push({
      sender: req.user._id,
      message: `Group ${sessionType} session started!`,
      messageType: 'text',
      timestamp: new Date(),
      isSystemMessage: true
    });

    group.chatSession.totalMessages += 1;
    group.chatSession.lastMessageAt = new Date();

    await group.save();

    res.json({
      success: true,
      message: `Group ${sessionType} session started successfully`,
      data: {
        groupId: group._id,
        sessionId: group.sessionId,
        sessionType: group.sessionType,
        status: group.status,
        startedAt: group.startedAt,
        participants: activeParticipants.map(p => ({
          id: p.user._id,
          name: p.user.name,
          isHost: p.role === 'host',
          micEnabled: p.micEnabled,
          cameraEnabled: sessionType === 'video' ? p.cameraEnabled : false
        }))
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

    // Find group and verify user is participant
    const group = await Session.findById(groupId);

    if (!group || group.sessionType !== 'group_chat') {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    const participantIndex = group.participants.findIndex(p => 
      p.user.toString() === req.user._id.toString()
    );

    if (participantIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'You are not a participant in this group'
      });
    }

    // Remove participant
    group.participants[participantIndex].isActive = false;
    group.participants[participantIndex].leftAt = new Date();

    // Add system message
    const user = await User.findById(req.user._id).select('name');
    group.chatSession.messages.push({
      sender: req.user._id,
      message: `${user.name} left the discussion`,
      messageType: 'text',
      timestamp: new Date(),
      isSystemMessage: true
    });

    group.chatSession.totalMessages += 1;
    group.chatSession.lastMessageAt = new Date();

    // If host leaves, transfer host to another active participant
    if (group.host.toString() === req.user._id.toString()) {
      const activeParticipants = group.participants.filter(p => 
        p.isActive && p.user.toString() !== req.user._id.toString()
      );

      if (activeParticipants.length > 0) {
        const newHost = activeParticipants[0];
        group.host = newHost.user;
        newHost.role = 'host';

        // Add system message about new host
        const newHostUser = await User.findById(newHost.user).select('name');
        group.chatSession.messages.push({
          sender: newHost.user,
          message: `${newHostUser.name} is now the host`,
          messageType: 'text',
          timestamp: new Date(),
          isSystemMessage: true
        });
        group.chatSession.totalMessages += 1;
      } else {
        // No one left, end the group
        group.status = 'completed';
        group.endSession();
      }
    }

    await group.save();

    res.json({
      success: true,
      message: 'Successfully left the group',
      data: {
        groupId: group._id,
        status: group.status
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
    // Find user's active groups
    const activeGroups = await Session.find({
      'participants.user': req.user._id,
      'participants.isActive': true,
      sessionType: { $in: ['group_chat', 'group_voice_call', 'group_video_call'] },
      status: { $in: ['scheduled', 'active'] }
    })
    .populate('host', 'name profilePicture')
    .populate('participants.user', 'name profilePicture')
    .populate('region', 'name')
    .sort({ updatedAt: -1 });

    const formattedGroups = activeGroups.map(group => ({
      id: group._id,
      title: group.title,
      topic: group.description,
      sessionType: group.sessionType,
      status: group.status,
      host: {
        id: group.host._id,
        name: group.host.name,
        profilePicture: group.host.profilePicture
      },
      participantCount: group.participants.filter(p => p.isActive).length,
      maxParticipants: group.groupSession ? group.groupSession.maxParticipants : 10,
      lastActivity: group.chatSession ? group.chatSession.lastMessageAt : group.updatedAt,
      region: group.region ? group.region.name : null,
      joinCode: group.groupSession ? group.groupSession.joinCode : null
    }));

    res.json({
      success: true,
      message: 'Active groups retrieved successfully',
      data: {
        groups: formattedGroups,
        total: formattedGroups.length
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

module.exports = router;
