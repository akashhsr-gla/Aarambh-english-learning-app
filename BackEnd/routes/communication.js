const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Session = require('../models/Session');
const User = require('../models/User');
const { authenticateToken, requireSubscription } = require('../middleware/auth');

// Validation middleware
const validateCallRequest = [
  body('participants').isArray({ min: 1 }).withMessage('At least one participant required'),
  body('participants.*').isMongoId().withMessage('Invalid participant ID'),
  body('title').trim().isLength({ min: 3, max: 100 }).withMessage('Title must be 3-100 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must be max 500 characters')
];

const validateGroupCallRequest = [
  body('participants').isArray({ min: 2 }).withMessage('At least 2 participants required for group call'),
  body('participants.*').isMongoId().withMessage('Invalid participant ID'),
  body('title').trim().isLength({ min: 3, max: 100 }).withMessage('Title must be 3-100 characters'),
  body('maxParticipants').optional().isInt({ min: 2, max: 50 }).withMessage('Max participants must be 2-50')
];

const validateChatMessage = [
  body('message').trim().isLength({ min: 1, max: 1000 }).withMessage('Message must be 1-1000 characters'),
  body('messageType').isIn(['text', 'image', 'file', 'audio']).withMessage('Invalid message type')
];

// 1. FIND PARTNER FOR REGION-BASED MATCHMAKING
router.post('/matchmaking/find-partner', authenticateToken, [
  body('sessionType').isIn(['chat', 'voice_call', 'video_call']).withMessage('Invalid session type'),
  body('preferredLanguageLevel').optional().isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid language level')
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

    const { sessionType, preferredLanguageLevel } = req.body;
    
    // Get current user with region
    const currentUser = await User.findById(req.user._id).populate('region', 'name code');
    if (!currentUser || !currentUser.region) {
      return res.status(400).json({
        success: false,
        message: 'User must be assigned to a region for matchmaking'
      });
    }

    // Find available partners in the same region
    let partnerQuery = {
      _id: { $ne: req.user._id }, // Exclude current user
      region: currentUser.region._id,
      isActive: true,
      role: 'student' // Only match students for language practice
    };

    // Add language level filter if specified
    if (preferredLanguageLevel) {
      partnerQuery['studentInfo.languageLevel'] = preferredLanguageLevel;
    }

    // Check if user is already in an active session
    const existingSession = await Session.findOne({
      'participants.user': req.user._id,
      status: { $in: ['active', 'scheduled'] },
      sessionType: { $in: ['chat', 'voice_call', 'video_call'] }
    });

    if (existingSession) {
      return res.status(400).json({
        success: false,
        message: 'You are already in an active session',
        data: {
          existingSessionId: existingSession._id
        }
      });
    }

    // Find potential partners not currently in active sessions
    const busyUserIds = await Session.distinct('participants.user', {
      status: { $in: ['active', 'scheduled'] },
      sessionType: { $in: ['chat', 'voice_call', 'video_call'] }
    });

    partnerQuery._id = { $ne: req.user._id, $nin: busyUserIds };

    const availablePartners = await User.find(partnerQuery)
      .select('name email profilePicture studentInfo.languageLevel lastActive')
      .sort({ lastActive: -1 }) // Prioritize recently active users
      .limit(10);

    if (availablePartners.length === 0) {
      return res.json({
        success: true,
        message: 'No available partners found in your region',
        data: {
          partner: null,
          waitingInQueue: true,
          regionInfo: {
            name: currentUser.region.name,
            code: currentUser.region.code
          }
        }
      });
    }

    // Select a random partner from available options
    const selectedPartner = availablePartners[Math.floor(Math.random() * availablePartners.length)];

    // Create a session immediately for chat, or return partner info for calls
    let session = null;
    if (sessionType === 'chat') {
      // For chat, create the session immediately
      session = new Session({
        sessionId: `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sessionType: 'chat',
        title: `Chat Session`,
        description: `Region-based chat between ${currentUser.name} and ${selectedPartner.name}`,
        host: req.user._id,
        participants: [
          {
            user: req.user._id,
            role: 'host',
            joinedAt: new Date(),
            isActive: true
          },
          {
            user: selectedPartner._id,
            role: 'participant',
            joinedAt: new Date(),
            isActive: false // Partner hasn't joined yet
          }
        ],
        status: 'scheduled',
        scheduledAt: new Date(),
        chatSession: {
          messages: [],
          totalMessages: 0,
          lastMessageAt: null
        }
      });

      await session.save();
    }

    res.json({
      success: true,
      message: sessionType === 'chat' ? 'Chat partner found and session created' : 'Call partner found',
      data: {
        partner: {
          id: selectedPartner._id,
          name: selectedPartner.name,
          email: selectedPartner.email,
          profilePicture: selectedPartner.profilePicture,
          languageLevel: selectedPartner.studentInfo?.languageLevel || 'beginner',
          lastActive: selectedPartner.lastActive
        },
        session: session ? {
          id: session._id,
          sessionId: session.sessionId,
          sessionType: session.sessionType,
          title: session.title,
          status: session.status
        } : null,
        regionInfo: {
          name: currentUser.region.name,
          code: currentUser.region.code
        },
        matchingCriteria: {
          region: currentUser.region.name,
          languageLevel: preferredLanguageLevel || 'any'
        }
      }
    });

  } catch (error) {
    console.error('Find partner error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during matchmaking'
    });
  }
});

// 2. INITIATE ONE-TO-ONE CALL (Video or Voice)
router.post('/call/initiate', authenticateToken, validateCallRequest, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { participants, callType, title, description } = req.body;
    
    // Ensure only 2 participants for one-to-one call
    if (participants.length !== 2) {
      return res.status(400).json({
        success: false,
        message: 'One-to-one calls must have exactly 2 participants'
      });
    }

    // Verify all participants exist and are active
    const participantUsers = await User.find({
      _id: { $in: participants },
      isActive: true
    });

    if (participantUsers.length !== 2) {
      return res.status(400).json({
        success: false,
        message: 'One or more participants not found or inactive'
      });
    }

    // Check if user is one of the participants
    if (!participants.includes(req.user._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'You can only initiate calls with yourself as a participant'
      });
    }

    // Check for existing active call between these participants
    const existingCall = await Session.findOne({
      sessionType: callType === 'video' ? 'video_call' : 'voice_call',
      'participants.user': { $all: participants },
      status: 'active'
    });

    if (existingCall) {
      return res.status(400).json({
        success: false,
        message: 'Active call already exists between these participants'
      });
    }

    // Create call session
    const session = new Session({
      sessionId: `${callType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionType: callType === 'video' ? 'video_call' : 'voice_call',
      title: title || `${callType.charAt(0).toUpperCase() + callType.slice(1)} Call`,
      description: description || `One-to-one ${callType} call`,
      host: req.user._id,
      participants: participants.map(participantId => ({
        user: participantId,
        role: participantId === req.user._id.toString() ? 'host' : 'participant',
        joinedAt: new Date(),
        isActive: true,
        // Call-specific participant state
        micEnabled: true,
        cameraEnabled: callType === 'video' ? true : false,
        isSpeaking: false,
        audioLevel: 0,
        videoQuality: callType === 'video' ? 'high' : null
      })),
      status: 'scheduled',
      scheduledAt: new Date(),
      callSession: {
        callType: callType,
        isGroupCall: false,
        maxParticipants: 2,
        recordingEnabled: false,
        recordingUrl: null,
        quality: 'high',
        settings: {
          allowScreenShare: true,
          allowRecording: false,
          allowChat: true,
          muteOnEntry: false,
          videoOnEntry: callType === 'video'
        }
      }
    });

    await session.save();

    res.status(201).json({
      success: true,
      message: `${callType.charAt(0).toUpperCase() + callType.slice(1)} call initiated successfully`,
      data: {
        sessionId: session._id,
        sessionType: session.sessionType,
        title: session.title,
        callType: callType,
        participants: participantUsers.map(user => ({
          id: user._id,
          name: user.name,
          email: user.email,
          role: session.participants.find(p => p.user.toString() === user._id.toString())?.role
        })),
        status: session.status,
        scheduledAt: session.scheduledAt
      }
    });

  } catch (error) {
    console.error('Initiate call error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 2. INITIATE GROUP CALL (Video or Voice)
router.post('/call/group/initiate', authenticateToken, validateGroupCallRequest, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { participants, callType, title, description, maxParticipants = 20 } = req.body;
    
    // Check if user is one of the participants
    if (!participants.includes(req.user._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'You can only initiate group calls with yourself as a participant'
      });
    }

    // Verify all participants exist and are active
    const participantUsers = await User.find({
      _id: { $in: participants },
      isActive: true
    });

    if (participantUsers.length !== participants.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more participants not found or inactive'
      });
    }

    // Check if participants exceed max limit
    if (participants.length > maxParticipants) {
      return res.status(400).json({
        success: false,
        message: `Maximum ${maxParticipants} participants allowed`
      });
    }

    // Create group call session
    const session = new Session({
      sessionId: `group_${callType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionType: callType === 'video' ? 'group_video_call' : 'group_voice_call',
      title: title || `Group ${callType.charAt(0).toUpperCase() + callType.slice(1)} Call`,
      description: description || `Group ${callType} call with ${participants.length} participants`,
      host: req.user._id,
      participants: participants.map(participantId => ({
        user: participantId,
        role: participantId === req.user._id.toString() ? 'host' : 'participant',
        joinedAt: new Date(),
        isActive: true,
        // Call-specific participant state
        micEnabled: true,
        cameraEnabled: callType === 'video' ? true : false,
        isSpeaking: false,
        audioLevel: 0,
        videoQuality: callType === 'video' ? 'high' : undefined,
        isScreenSharing: false
      })),
      status: 'scheduled',
      scheduledAt: new Date(),
      callSession: {
        callType: callType,
        isGroupCall: true,
        maxParticipants: maxParticipants,
        recordingEnabled: false,
        recordingUrl: null,
        quality: 'high',
        settings: {
          allowScreenShare: true,
          allowRecording: false,
          allowChat: true,
          muteOnEntry: true,
          videoOnEntry: callType === 'video',
          allowParticipantMute: true,
          allowParticipantVideo: true
        }
      }
    });

    await session.save();

    res.status(201).json({
      success: true,
      message: `Group ${callType} call initiated successfully`,
      data: {
        sessionId: session._id,
        sessionType: session.sessionType,
        title: session.title,
        callType: callType,
        isGroupCall: true,
        participants: participantUsers.map(user => ({
          id: user._id,
          name: user.name,
          email: user.email,
          role: session.participants.find(p => p.user.toString() === user._id.toString())?.role
        })),
        maxParticipants: maxParticipants,
        status: session.status,
        scheduledAt: session.scheduledAt
      }
    });

  } catch (error) {
    console.error('Initiate group call error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 3. JOIN CALL SESSION
router.post('/call/:sessionId/join', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { micEnabled = true, cameraEnabled = true } = req.body;

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Call session not found'
      });
    }

    // Check if session is active or scheduled
    if (!['active', 'scheduled'].includes(session.status)) {
      return res.status(400).json({
        success: false,
        message: 'Call session is not available for joining'
      });
    }

    // Check if user is a participant
    const participant = session.participants.find(p => 
      p.user.toString() === req.user._id.toString()
    );

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this call'
      });
    }

    // Update participant status
    participant.isActive = true;
    participant.joinedAt = new Date();
    participant.micEnabled = micEnabled;
    participant.cameraEnabled = cameraEnabled;

    // Update session status to active if it was scheduled
    if (session.status === 'scheduled') {
      session.status = 'active';
      session.startedAt = new Date();
    }

    await session.save();

    res.json({
      success: true,
      message: 'Successfully joined call session',
      data: {
        sessionId: session._id,
        sessionType: session.sessionType,
        title: session.title,
        status: session.status,
        participants: session.participants.map(p => ({
          id: p.user,
          role: p.role,
          isActive: p.isActive,
          micEnabled: p.micEnabled,
          cameraEnabled: p.cameraEnabled,
          joinedAt: p.joinedAt
        })),
        callSettings: session.callSession.settings
      }
    });

  } catch (error) {
    console.error('Join call error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 4. LEAVE CALL SESSION
router.post('/call/:sessionId/leave', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Call session not found'
      });
    }

    // Find participant
    const participant = session.participants.find(p => 
      p.user.toString() === req.user._id.toString()
    );

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this call'
      });
    }

    // Update participant status
    participant.isActive = false;
    participant.leftAt = new Date();
    participant.duration = Math.round((participant.leftAt - participant.joinedAt) / 1000);

    // Check if host is leaving
    if (participant.role === 'host') {
      // Transfer host role to next active participant
      const nextHost = session.participants.find(p => 
        p.user.toString() !== req.user._id.toString() && p.isActive
      );
      
      if (nextHost) {
        nextHost.role = 'host';
        session.host = nextHost.user;
      } else {
        // No more active participants, end session
        session.status = 'completed';
        session.endedAt = new Date();
        session.duration = Math.round((session.endedAt - session.startedAt) / 1000);
      }
    }

    // Check if no more active participants
    const activeParticipants = session.participants.filter(p => p.isActive);
    if (activeParticipants.length === 0) {
      session.status = 'completed';
      session.endedAt = new Date();
      session.duration = Math.round((session.endedAt - session.startedAt) / 1000);
    }

    await session.save();

    res.json({
      success: true,
      message: 'Successfully left call session',
      data: {
        sessionId: session._id,
        status: session.status,
        duration: participant.duration
      }
    });

  } catch (error) {
    console.error('Leave call error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 5. UPDATE CALL PARTICIPANT STATE
router.put('/call/:sessionId/participant/state', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { micEnabled, cameraEnabled, isSpeaking, audioLevel, videoQuality } = req.body;

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Call session not found'
      });
    }

    // Find participant
    const participant = session.participants.find(p => 
      p.user.toString() === req.user._id.toString()
    );

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this call'
      });
    }

    // Update participant state
    if (micEnabled !== undefined) participant.micEnabled = micEnabled;
    if (cameraEnabled !== undefined) participant.cameraEnabled = cameraEnabled;
    if (isSpeaking !== undefined) participant.isSpeaking = isSpeaking;
    if (audioLevel !== undefined) participant.audioLevel = audioLevel;
    if (videoQuality !== undefined) participant.videoQuality = videoQuality;

    await session.save();

    res.json({
      success: true,
      message: 'Participant state updated successfully',
      data: {
        sessionId: session._id,
        participant: {
          id: participant.user,
          micEnabled: participant.micEnabled,
          cameraEnabled: participant.cameraEnabled,
          isSpeaking: participant.isSpeaking,
          audioLevel: participant.audioLevel,
          videoQuality: participant.videoQuality
        }
      }
    });

  } catch (error) {
    console.error('Update participant state error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 6. SEND CHAT MESSAGE (One-to-one or Group)
router.post('/chat/:sessionId/message', authenticateToken, validateChatMessage, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { sessionId } = req.params;
    const { message, messageType = 'text', mediaUrl, replyTo } = req.body;

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if user is a participant
    const participant = session.participants.find(p => 
      p.user.toString() === req.user._id.toString()
    );

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this session'
      });
    }

    // Add message to session
    const chatMessage = {
      sender: req.user._id,
      message: message,
      messageType: messageType,
      mediaUrl: mediaUrl,
      replyTo: replyTo,
      timestamp: new Date(),
      isEdited: false,
      isDeleted: false
    };

    if (!session.chatSession) {
      session.chatSession = {
        messages: [],
        totalMessages: 0,
        lastMessageAt: null
      };
    }

    session.chatSession.messages.push(chatMessage);
    session.chatSession.totalMessages += 1;
    session.chatSession.lastMessageAt = new Date();

    await session.save();

    res.json({
      success: true,
      message: 'Message sent successfully',
      data: {
        sessionId: session._id,
        message: {
          id: chatMessage._id || chatMessage.timestamp,
          sender: {
            id: req.user._id,
            name: req.user.name
          },
          message: message,
          messageType: messageType,
          mediaUrl: mediaUrl,
          replyTo: replyTo,
          timestamp: chatMessage.timestamp
        }
      }
    });

  } catch (error) {
    console.error('Send chat message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 7. GET CHAT MESSAGES
router.get('/chat/:sessionId/messages', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if user is a participant
    const participant = session.participants.find(p => 
      p.user.toString() === req.user._id.toString()
    );

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this session'
      });
    }

    if (!session.chatSession || !session.chatSession.messages) {
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

    // Paginate messages (most recent first)
    const messages = session.chatSession.messages
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
          mediaUrl: msg.mediaUrl,
          replyTo: msg.replyTo,
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
    console.error('Get chat messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 8. GET ACTIVE CALLS
router.get('/calls/active', authenticateToken, async (req, res) => {
  try {
    const activeCalls = await Session.find({
      sessionType: { $in: ['video_call', 'voice_call', 'group_video_call', 'group_voice_call'] },
      status: 'active'
    }).populate('host', 'name email')
      .populate('participants.user', 'name email profilePicture');

    res.json({
      success: true,
      data: {
        activeCalls: activeCalls.map(call => ({
          id: call._id,
          sessionId: call.sessionId,
          sessionType: call.sessionType,
          title: call.title,
          host: {
            id: call.host._id,
            name: call.host.name,
            email: call.host.email
          },
          participants: call.participants.map(p => ({
            id: p.user._id,
            name: p.user.name,
            email: p.user.email,
            profilePicture: p.user.profilePicture,
            role: p.role,
            isActive: p.isActive,
            micEnabled: p.micEnabled,
            cameraEnabled: p.cameraEnabled
          })),
          startedAt: call.startedAt,
          duration: call.duration
        }))
      }
    });

  } catch (error) {
    console.error('Get active calls error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 9. GET USER CALL HISTORY
router.get('/calls/history', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, callType } = req.query;

    const query = {
      'participants.user': req.user._id,
      sessionType: { $in: ['video_call', 'voice_call', 'group_video_call', 'group_voice_call'] }
    };

    if (callType) {
      query.sessionType = callType;
    }

    const total = await Session.countDocuments(query);
    const calls = await Session.find(query)
      .populate('host', 'name email')
      .populate('participants.user', 'name email profilePicture')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    res.json({
      success: true,
      data: {
        calls: calls.map(call => ({
          id: call._id,
          sessionId: call.sessionId,
          sessionType: call.sessionType,
          title: call.title,
          host: {
            id: call.host._id,
            name: call.host.name,
            email: call.host.email
          },
          participants: call.participants.map(p => ({
            id: p.user._id,
            name: p.user.name,
            email: p.user.email,
            profilePicture: p.user.profilePicture,
            role: p.role,
            duration: p.duration
          })),
          status: call.status,
          startedAt: call.startedAt,
          endedAt: call.endedAt,
          duration: call.duration,
          createdAt: call.createdAt
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
    console.error('Get call history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 10. END CALL SESSION (Host only)
router.post('/call/:sessionId/end', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Call session not found'
      });
    }

    // Check if user is the host
    if (session.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the host can end the call'
      });
    }

    // End the session
    session.status = 'completed';
    session.endedAt = new Date();
    session.duration = Math.round((session.endedAt - session.startedAt) / 1000);

    // Mark all participants as inactive
    session.participants.forEach(participant => {
      if (participant.isActive) {
        participant.isActive = false;
        participant.leftAt = new Date();
        participant.duration = Math.round((participant.leftAt - participant.joinedAt) / 1000);
      }
    });

    await session.save();

    res.json({
      success: true,
      message: 'Call session ended successfully',
      data: {
        sessionId: session._id,
        status: session.status,
        duration: session.duration,
        endedAt: session.endedAt
      }
    });

  } catch (error) {
    console.error('End call error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 11. GET SESSION DETAILS
router.get('/session/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Validate sessionId format
    if (!sessionId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session ID format'
      });
    }

    const session = await Session.findById(sessionId)
      .populate('host', 'name email profilePicture')
      .populate('participants.user', 'name email profilePicture');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if user is a participant
    const participant = session.participants.find(p => 
      p.user._id.toString() === req.user._id.toString()
    );

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this session'
      });
    }

    res.json({
      success: true,
      data: {
        session: {
          id: session._id,
          sessionId: session.sessionId,
          sessionType: session.sessionType,
          title: session.title,
          description: session.description,
          host: {
            id: session.host._id,
            name: session.host.name,
            email: session.host.email,
            profilePicture: session.host.profilePicture
          },
          participants: session.participants.map(p => ({
            id: p.user._id,
            name: p.user.name,
            email: p.user.email,
            profilePicture: p.user.profilePicture,
            role: p.role,
            isActive: p.isActive,
            joinedAt: p.joinedAt,
            leftAt: p.leftAt,
            duration: p.duration,
            micEnabled: p.micEnabled,
            cameraEnabled: p.cameraEnabled,
            isSpeaking: p.isSpeaking,
            audioLevel: p.audioLevel,
            videoQuality: p.videoQuality
          })),
          status: session.status,
          scheduledAt: session.scheduledAt,
          startedAt: session.startedAt,
          endedAt: session.endedAt,
          duration: session.duration,
          callSession: session.callSession,
          chatSession: session.chatSession ? {
            totalMessages: session.chatSession.totalMessages,
            lastMessageAt: session.chatSession.lastMessageAt
          } : null,
          createdAt: session.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Get session details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 12. ADMIN: GET ALL SESSIONS
router.get('/admin/sessions', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { page = 1, limit = 20, sessionType, status, dateFrom, dateTo } = req.query;

    const query = {};
    
    if (sessionType) {
      query.sessionType = sessionType;
    }
    
    if (status) {
      query.status = status;
    }
    
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const total = await Session.countDocuments(query);
    const sessions = await Session.find(query)
      .populate('host', 'name email')
      .populate('participants.user', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    res.json({
      success: true,
      data: {
        sessions: sessions.map(session => ({
          id: session._id,
          sessionId: session.sessionId,
          sessionType: session.sessionType,
          title: session.title,
          host: {
            id: session.host._id,
            name: session.host.name,
            email: session.host.email
          },
          participants: session.participants.map(p => ({
            id: p.user._id,
            name: p.user.name,
            email: p.user.email,
            role: p.role,
            isActive: p.isActive,
            duration: p.duration
          })),
          status: session.status,
          scheduledAt: session.scheduledAt,
          startedAt: session.startedAt,
          endedAt: session.endedAt,
          duration: session.duration,
          totalParticipants: session.participants.length,
          activeParticipants: session.participants.filter(p => p.isActive).length,
          createdAt: session.createdAt
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
    console.error('Admin get sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
