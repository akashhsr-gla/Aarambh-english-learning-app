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

    // Check if user is already in an active group and leave it automatically
    const existingGroup = await Group.findOne({
      'participants.user': req.user._id,
      status: { $in: ['active', 'waiting'] }
    });

    if (existingGroup) {
      // Automatically leave the previous group
      await Group.findByIdAndUpdate(existingGroup._id, {
        $pull: { participants: { user: req.user._id } },
        $set: { 
          status: existingGroup.participants.length <= 1 ? 'disbanded' : 'waiting',
          updatedAt: new Date()
        }
      });
      
    }

    // Clean up previous groups where user was host
    await Group.deleteMany({ 
      host: req.user._id, 
      status: { $in: ['waiting', 'ready', 'disbanded', 'completed'] }
    });

    // Generate join code
    const joinCode = Math.random().toString(36).substring(2, 10).toUpperCase();

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
      region: req.user.region, // Add user's region to the group
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
        sessionType: 'chat', // Default to chat, will be changed when session starts
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
      'participants.user': { $ne: req.user._id }, // Exclude groups user is already in
      region: req.user.region // Filter by user's region
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
      .populate('region', 'name code')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Group.countDocuments(query);

    res.json({
      success: true,
      data: {
        groups: groups.map(group => {
          try {
            return {
              id: group._id,
              title: group.title || '',
              topic: group.topic || '',
              description: group.description || '',
              level: group.level || 'beginner',
              maxParticipants: group.maxParticipants || 0,
              isPrivate: group.isPrivate || false,
              status: group.status || 'waiting',
              host: group.host ? {
                id: group.host._id,
                name: group.host.name || '',
                email: group.host.email || '',
                profilePicture: group.host.profilePicture || null
              } : null,
              participants: (() => {
                try {
                  if (!Array.isArray(group.participants)) return [];
                  return group.participants
                    .map(p => {
                      try {
                        if (!p || !p.user || !p.user._id) return null;
                        return {
                          id: p.user._id,
                          name: p.user.name || '',
                          email: p.user.email || '',
                          profilePicture: p.user.profilePicture || null,
                          role: p.role || 'participant',
                          isActive: p.isActive !== false
                        };
                      } catch (err) {
                        console.error('Error processing participant:', err);
                        return null;
                      }
                    })
                    .filter(Boolean);
                } catch (err) {
                  console.error('Error processing participants:', err);
                  return [];
                }
              })(),
              settings: group.settings || {},
              createdAt: group.createdAt || new Date()
            };
          } catch (err) {
            console.error('Error processing group:', err, 'Group ID:', group._id);
            return null;
          }
        }).filter(Boolean),
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
      group.status = 'waiting'; // Keep as waiting until host starts the session
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
        participants: group.participants.filter(p => p.user).map(p => ({
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
      group.status = 'waiting'; // Keep as waiting until host starts the session
    }

    await group.save();

    // Populate participants
    await group.populate('participants.user', 'name email profilePicture');
    await group.populate('host', 'name email profilePicture');

    res.json({
      success: true,
      message: 'Successfully joined group by code',
      data: {
        groupId: group._id,
        participants: group.participants.filter(p => p.user).map(p => ({
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
          joinCode: group.joinCode,
          host: group.host ? {
            id: group.host._id,
            name: group.host.name,
            email: group.host.email,
            profilePicture: group.host.profilePicture
          } : null
        }
      }
    });

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

    // Check if user is a participant (for detailed access)
    const isParticipant = group.participants.some(p => 
      p.user && p.user._id.toString() === req.user._id.toString()
    );

    // Allow viewing group details if user is from the same region (for browsing)
    const isSameRegion = group.region.toString() === req.user.region.toString();
    
    if (!isParticipant && !isSameRegion) {
      return res.status(403).json({
        success: false,
        message: 'You can only view groups from your region'
      });
    }


    res.json({
      success: true,
      data: {
        id: group._id,
        title: group.title,
        topic: group.topic,
        description: group.description,
        level: group.level,
        maxParticipants: group.maxParticipants,
        isPrivate: group.isPrivate,
        joinCode: group.joinCode,
        status: group.status,
        host: group.host ? {
          id: group.host._id,
          name: group.host.name,
          email: group.host.email,
          profilePicture: group.host.profilePicture
        } : null,
        participants: group.participants.filter(p => p.user).map(p => ({
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

    // Check if group has enough participants based on group size
    // For groups with maxParticipants 3-5: require at least 3 participants
    // For groups with maxParticipants 6-10: require at least 4 participants  
    // For groups with maxParticipants 11+: require at least 5 participants
    let minParticipants;
    if (group.maxParticipants <= 5) {
      minParticipants = 3;
    } else if (group.maxParticipants <= 10) {
      minParticipants = 4;
    } else {
      minParticipants = 5;
    }
    
    // Ensure minimum is not more than maxParticipants
    minParticipants = Math.min(minParticipants, group.maxParticipants);
    
    if (group.participants.length < minParticipants) {
      return res.status(400).json({
        success: false,
        message: `Need at least ${minParticipants} participants to start session (current: ${group.participants.length}/${group.maxParticipants})`
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

    // If user is the host, end the session for everyone
    if (participant.role === 'host') {
      group.status = 'completed';
      group.groupSession.isActive = false;
      group.groupSession.endedAt = new Date();
      
      if (group.groupSession.startedAt) {
        group.groupSession.duration = Math.round(
          (group.groupSession.endedAt - group.groupSession.startedAt) / 1000
        );
      }
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
      message: participant.role === 'host' ? 'Group session ended' : 'Left group successfully',
      data: {
        groupId: group._id,
        status: group.status,
        wasHost: participant.role === 'host'
      }
    });

  } catch (error) {
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
          host: group.host ? {
            id: group.host._id,
            name: group.host.name,
            email: group.host.email,
            profilePicture: group.host.profilePicture
          } : null,
          participants: group.participants.filter(p => p.user).map(p => ({
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
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 11. GROUP WEBRTC SIGNALING ROUTES

// Get WebRTC signaling data
router.get('/:groupId/webrtc', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is participant
    const isParticipant = group.participants.some(p => 
      (p.user?._id || p.user).toString() === req.user._id.toString()
    );
    
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Not a group participant'
      });
    }

    res.json({
      success: true,
      data: {
        signaling: group.groupSession?.signaling || {
          offers: [],
          answers: [],
          iceCandidates: []
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Post WebRTC offer
router.post('/:groupId/webrtc/offer', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { offer, targetUserId } = req.body;
    
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Initialize signaling if needed
    if (!group.groupSession.signaling) {
      group.groupSession.signaling = {
        offers: [],
        answers: [],
        iceCandidates: []
      };
    }

    // Add offer
    group.groupSession.signaling.offers.push({
      fromUserId: req.user._id,
      targetUserId,
      offer,
      timestamp: new Date()
    });

    await group.save();

    res.json({
      success: true,
      message: 'Offer posted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Post WebRTC answer
router.post('/:groupId/webrtc/answer', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { answer, targetUserId } = req.body;
    
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Initialize signaling if needed
    if (!group.groupSession.signaling) {
      group.groupSession.signaling = {
        offers: [],
        answers: [],
        iceCandidates: []
      };
    }

    // Add answer
    group.groupSession.signaling.answers.push({
      fromUserId: req.user._id,
      targetUserId,
      answer,
      timestamp: new Date()
    });

    await group.save();

    res.json({
      success: true,
      message: 'Answer posted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Post ICE candidate
router.post('/:groupId/webrtc/ice', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { candidate, targetUserId } = req.body;
    
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Initialize signaling if needed
    if (!group.groupSession.signaling) {
      group.groupSession.signaling = {
        offers: [],
        answers: [],
        iceCandidates: []
      };
    }

    // Add ICE candidate
    group.groupSession.signaling.iceCandidates.push({
      fromUserId: req.user._id,
      targetUserId,
      candidate,
      timestamp: new Date()
    });

    await group.save();

    res.json({
      success: true,
      message: 'ICE candidate posted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Clear WebRTC signaling
router.post('/:groupId/webrtc/clear', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Clear signaling data
    if (group.groupSession) {
      group.groupSession.signaling = {
        offers: [],
        answers: [],
        iceCandidates: []
      };
      await group.save();
    }

    res.json({
      success: true,
      message: 'Signaling cleared'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;