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

    // Check if user is already in an active session
    const existingSession = await Session.findOne({
      'participants.user': req.user._id,
      status: { $in: ['active', 'scheduled', 'waiting_for_partner'] },
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

    // STEP 1: Check if there's an existing waiting session we can join
    const waitingSession = await Session.findOne({
      sessionType: sessionType,
      status: 'waiting_for_partner',
      'participants.user': { $ne: req.user._id }, // Not created by current user
      'hostRegion': currentUser.region._id // Same region
    }).populate('participants.user', 'name email profilePicture studentInfo.languageLevel');

    if (waitingSession) {
      // Found someone waiting! Join their session
      
      // Add current user as participant
      waitingSession.participants.push({
        user: req.user._id,
        role: 'participant', 
        joinedAt: new Date(),
        isActive: true
      });
      
      // Update session status to active
      waitingSession.status = 'active';
      waitingSession.startedAt = new Date();
      
      await waitingSession.save();
      
      // Get the waiting partner info
      const waitingPartner = waitingSession.participants[0].user;
      
      return res.json({
        success: true,
        message: 'Connected to waiting partner!',
        data: {
          partner: {
            id: waitingPartner._id,
            name: waitingPartner.name,
            email: waitingPartner.email,
            profilePicture: waitingPartner.profilePicture,
            languageLevel: waitingPartner.studentInfo?.languageLevel || 'beginner',
            lastActive: waitingPartner.lastActive
          },
          session: {
            id: waitingSession._id,
            sessionId: waitingSession.sessionId,
            sessionType: waitingSession.sessionType,
            title: waitingSession.title,
            status: waitingSession.status
          }
        }
      });
    }

    // STEP 2: No one waiting, create a new waiting session
    
    const session = new Session({
      sessionId: `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionType: sessionType,
      title: `${sessionType === 'chat' ? 'Chat' : 'Call'} Session`,
      description: `Waiting for partner in ${currentUser.region.name}`,
      host: req.user._id,
      hostRegion: currentUser.region._id, // Store region for matching
      participants: [
        {
          user: req.user._id,
          role: 'host',
          joinedAt: new Date(),
          isActive: true
        }
      ],
      status: 'waiting_for_partner', // New status for waiting
      scheduledAt: new Date(),
      chatSession: sessionType === 'chat' ? {
        messages: [],
        totalMessages: 0,
        lastMessageAt: null
      } : undefined,
      callSession: (sessionType === 'voice_call' || sessionType === 'video_call') ? {
        callType: sessionType === 'voice_call' ? 'voice' : 'video',
        signaling: {
          iceCandidates: []
        }
      } : undefined
    });

    await session.save();

    // Return waiting status - no partner yet
    res.json({
      success: true,
      message: 'Waiting for a partner from your region...',
      data: {
        partner: null,
        waitingInQueue: true,
        session: {
          id: session._id,
          sessionId: session.sessionId,
          sessionType: session.sessionType,
          title: session.title,
          status: session.status
        },
        regionInfo: {
          name: currentUser.region.name,
          code: currentUser.region.code
        }
      }
    });

  } catch (error) {
    console.error('Find partner error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error during matchmaking',
      error: error.message
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
    console.log('Leave session request:', { sessionId, userId: req.user._id });

    const session = await Session.findById(sessionId);
    if (!session) {
      console.log('Session not found:', sessionId);
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    console.log('Found session:', session._id, 'Status:', session.status);

    // Mark the participant as left
    const participant = session.participants.find(p => p.user.toString() === req.user._id.toString());
    if (participant) {
      participant.isActive = false;
      participant.leftAt = new Date();
    }

    // Immediately complete the session when any participant leaves so the other side detects it
    session.status = 'completed';
    session.endedAt = new Date();

    // Calculate duration if session was started
    if (session.startedAt) {
      session.duration = Math.round((session.endedAt - session.startedAt) / 1000);
    }

    await session.save();
    console.log('Session marked as completed by user leaving');

    res.json({
      success: true,
      message: 'Successfully left session',
      data: {
        sessionId: session._id,
        status: session.status,
        duration: session.duration || 0
      }
    });

  } catch (error) {
    console.error('Leave session error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      sessionId: req.params.sessionId,
      userId: req.user._id
    });
    res.status(500).json({
      success: false,
      message: 'Server error',
      details: error.message
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

// 8. GET USER'S ACTIVE SESSIONS
router.get('/sessions/active', authenticateToken, async (req, res) => {
  try {
    // Prevent any caching so clients always see up-to-date session state
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');

    const activeSessions = await Session.find({
      'participants.user': req.user._id,
      status: { $in: ['active', 'scheduled', 'waiting_for_partner'] },
      sessionType: { $in: ['chat', 'voice_call', 'video_call'] }
    })
    .populate('participants.user', 'name email profilePicture')
    .populate('host', 'name email')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'Active sessions retrieved successfully',
      data: {
        sessions: activeSessions.map(session => ({
          _id: session._id,
          sessionId: session.sessionId,
          sessionType: session.sessionType,
          title: session.title,
          description: session.description,
          status: session.status,
          participants: session.participants.map(p => ({
            user: p.user,
            role: p.role,
            isActive: p.isActive,
            joinedAt: p.joinedAt
          })),
          host: session.host,
          scheduledAt: session.scheduledAt,
          startedAt: session.startedAt,
          createdAt: session.createdAt
        }))
      }
    });

  } catch (error) {
    console.error('Get active sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 13. CANCEL ALL USER SESSIONS (strict cancel for pending/active)
router.post('/sessions/cancel-all', authenticateToken, async (req, res) => {
  try {
    const now = new Date();

    const sessions = await Session.find({
      'participants.user': req.user._id,
      status: { $in: ['waiting_for_partner', 'active', 'scheduled'] },
      sessionType: { $in: ['chat', 'voice_call', 'video_call'] }
    });

    let affected = 0;
    const cancelledWaiting = [];
    const completedActive = [];
    const updatedSessions = [];
    for (const session of sessions) {
      const me = session.participants.find(p => p.user.toString() === req.user._id.toString());
      if (me) {
        me.isActive = false;
        me.leftAt = now;
      }
      if (session.status !== 'completed' && session.status !== 'cancelled') {
        if (session.status === 'waiting_for_partner') {
          session.status = 'cancelled';
          cancelledWaiting.push(session._id);
        } else {
          session.status = 'completed';
          completedActive.push(session._id);
        }
        session.endedAt = now;
        if (session.startedAt) {
          session.duration = Math.round((session.endedAt - session.startedAt) / 1000);
        }
      }
      await session.save();
      updatedSessions.push({ id: session._id, status: session.status, type: session.sessionType });
      affected += 1;
    }

    return res.json({
      success: true,
      message: 'All user sessions cancelled/completed',
      data: { count: affected, cancelledWaiting, completedActive, updatedSessions }
    });
  } catch (error) {
    console.error('Cancel all sessions error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// 14. HARD PURGE USER SESSIONS (deletes waiting, detaches user, completes orphaned)
router.post('/sessions/purge-hard', authenticateToken, async (req, res) => {
  try {
    const now = new Date();
    const sessions = await Session.find({
      'participants.user': req.user._id,
      status: { $in: ['waiting_for_partner', 'active', 'scheduled'] },
      sessionType: { $in: ['chat', 'voice_call', 'video_call'] }
    });

    let deletedWaiting = 0;
    let detachedFrom = 0;
    const completedOrphans = [];
    const details = [];

    for (const session of sessions) {
      if (session.status === 'waiting_for_partner') {
        await Session.deleteOne({ _id: session._id });
        deletedWaiting += 1;
        details.push({ id: session._id, action: 'deleted_waiting' });
        continue;
      }

      // Detach current user
      const beforeCount = session.participants.length;
      session.participants = session.participants.filter(p => p.user.toString() !== req.user._id.toString());
      if (session.participants.length !== beforeCount) {
        detachedFrom += 1;
      }

      // If no participants left or none active, complete and close
      const anyActive = session.participants.some(p => p.isActive);
      if (session.participants.length === 0 || !anyActive) {
        session.status = 'completed';
        session.endedAt = now;
        if (session.startedAt) {
          session.duration = Math.round((session.endedAt - session.startedAt) / 1000);
        }
        completedOrphans.push(session._id);
        details.push({ id: session._id, action: 'completed_orphan' });
        await session.save();
        continue;
      }

      details.push({ id: session._id, action: 'detached_user', remainingParticipants: session.participants.length });
      await session.save();
    }

    return res.json({
      success: true,
      message: 'Hard purge completed',
      data: {
        deletedWaiting,
        detachedFrom,
        completedOrphans,
        totalProcessed: sessions.length,
        details
      }
    });
  } catch (error) {
    console.error('Purge hard sessions error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// 15. WEBRTC SIGNALING ENDPOINTS
// Get signaling snapshot
router.get('/session/:sessionId/webrtc', authenticateToken, async (req, res) => {
  try {
    // Disable caching so clients never get 304 for signaling snapshot
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');

    const session = await Session.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    return res.json({
      success: true,
      data: {
        signaling: session.callSession?.signaling || { iceCandidates: [] }
      }
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Post offer
router.post('/session/:sessionId/webrtc/offer', authenticateToken, async (req, res) => {
  try {
    const { type, sdp } = req.body || {};
    const session = await Session.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    if (!session.callSession) session.callSession = {};
    if (!session.callSession.signaling) session.callSession.signaling = { iceCandidates: [] };
    session.callSession.signaling.offer = { from: req.user._id, type, sdp, createdAt: new Date() };
    await session.save();
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Post answer
router.post('/session/:sessionId/webrtc/answer', authenticateToken, async (req, res) => {
  try {
    const { type, sdp } = req.body || {};
    const session = await Session.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    if (!session.callSession) session.callSession = {};
    if (!session.callSession.signaling) session.callSession.signaling = { iceCandidates: [] };
    session.callSession.signaling.answer = { from: req.user._id, type, sdp, createdAt: new Date() };
    await session.save();
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add ICE candidate
router.post('/session/:sessionId/webrtc/ice', authenticateToken, async (req, res) => {
  try {
    const { candidate, sdpMid, sdpMLineIndex } = req.body || {};
    const session = await Session.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    if (!session.callSession) session.callSession = {};
    if (!session.callSession.signaling) session.callSession.signaling = { iceCandidates: [] };
    session.callSession.signaling.iceCandidates.push({ from: req.user._id, candidate, sdpMid, sdpMLineIndex, createdAt: new Date() });
    await session.save();
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Clear signaling (on cancel/end)
router.post('/session/:sessionId/webrtc/clear', authenticateToken, async (req, res) => {
  try {
    const session = await Session.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    if (!session.callSession) session.callSession = {};
    session.callSession.signaling = { iceCandidates: [] };
    await session.save();
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Request video upgrade (voice -> video)
router.post('/session/:sessionId/request-video', authenticateToken, async (req, res) => {
  try {
    const session = await Session.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    
    const currentUser = session.participants.find(p => p.user.toString() === req.user._id.toString());
    const otherUser = session.participants.find(p => p.user.toString() !== req.user._id.toString());
    
    if (!currentUser || !otherUser) {
      return res.status(403).json({ success: false, message: 'Not a participant in this session' });
    }
    
    if (!session.callSession) session.callSession = {};
    session.callSession.videoUpgradeRequest = {
      from: req.user._id,
      to: otherUser.user,
      status: 'pending',
      requestedAt: new Date()
    };
    
    await session.save();
    return res.json({ success: true, message: 'Video upgrade request sent' });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Respond to video upgrade request
router.post('/session/:sessionId/respond-video', authenticateToken, async (req, res) => {
  try {
    const { accept } = req.body; // true/false
    const session = await Session.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    
    const videoRequest = session.callSession?.videoUpgradeRequest;
    if (!videoRequest || videoRequest.to.toString() !== req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'No pending video request for you' });
    }
    
    videoRequest.status = accept ? 'accepted' : 'rejected';
    
    if (accept) {
      // Upgrade session to video_call
      session.sessionType = 'video_call';
      session.callSession.callType = 'video';
      
      // Enable camera for both participants
      session.participants.forEach(p => {
        p.cameraEnabled = true;
      });
      
      // Clear the video upgrade request after accepting
      session.callSession.videoUpgradeRequest = undefined;
    } else {
      // Clear the video upgrade request after rejecting
      session.callSession.videoUpgradeRequest = undefined;
    }
    
    await session.save();
    return res.json({ 
      success: true, 
      message: accept ? 'Video upgrade accepted' : 'Video upgrade rejected',
      data: { upgraded: accept, sessionType: session.sessionType }
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Check for video upgrade requests
router.get('/session/:sessionId/video-request', authenticateToken, async (req, res) => {
  try {
    // Disable caching so clients never get stale 304s for video-request
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');

    const session = await Session.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    
    const videoRequest = session.callSession?.videoUpgradeRequest;
    console.log('Video request check - sessionId:', req.params.sessionId, 'userId:', req.user._id, 'videoRequest:', videoRequest);
    
    const hasPendingRequest = videoRequest && 
      videoRequest.to && 
      videoRequest.to.toString() === req.user._id.toString() && 
      videoRequest.status === 'pending';
    
    return res.json({
      success: true,
      data: {
        hasPendingRequest: hasPendingRequest || false,
        request: hasPendingRequest ? {
          from: videoRequest.from,
          requestedAt: videoRequest.requestedAt
        } : null
      }
    });
  } catch (e) {
    console.error('Video request check error:', e);
    return res.status(500).json({ success: false, message: 'Server error', error: e.message });
  }
});

// 16. GROUP WEBRTC SIGNALING ENDPOINTS
// Get group signaling snapshot
router.get('/group/:groupId/webrtc', authenticateToken, async (req, res) => {
  try {
    // Disable caching so clients never get 304 for signaling snapshot
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');

    const Group = require('../models/Group');
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
    
    // Check if user is a participant
    const isParticipant = group.participants.some(p => 
      p.user.toString() === req.user._id.toString()
    );
    
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Not a participant in this group' });
    }

    return res.json({
      success: true,
      data: {
        signaling: group.groupSession?.signaling || { iceCandidates: [] }
      }
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Post group offer
router.post('/group/:groupId/webrtc/offer', authenticateToken, async (req, res) => {
  try {
    const { type, sdp } = req.body || {};
    const Group = require('../models/Group');
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
    
    // Check if user is a participant
    const isParticipant = group.participants.some(p => 
      p.user.toString() === req.user._id.toString()
    );
    
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Not a participant in this group' });
    }

    if (!group.groupSession) group.groupSession = {};
    if (!group.groupSession.signaling) group.groupSession.signaling = { iceCandidates: [] };
    group.groupSession.signaling.offer = { from: req.user._id, type, sdp, createdAt: new Date() };
    await group.save();
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Post group answer
router.post('/group/:groupId/webrtc/answer', authenticateToken, async (req, res) => {
  try {
    const { type, sdp } = req.body || {};
    const Group = require('../models/Group');
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
    
    // Check if user is a participant
    const isParticipant = group.participants.some(p => 
      p.user.toString() === req.user._id.toString()
    );
    
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Not a participant in this group' });
    }

    if (!group.groupSession) group.groupSession = {};
    if (!group.groupSession.signaling) group.groupSession.signaling = { iceCandidates: [] };
    group.groupSession.signaling.answer = { from: req.user._id, type, sdp, createdAt: new Date() };
    await group.save();
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add group ICE candidate
router.post('/group/:groupId/webrtc/ice', authenticateToken, async (req, res) => {
  try {
    const { candidate, sdpMid, sdpMLineIndex } = req.body || {};
    const Group = require('../models/Group');
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
    
    // Check if user is a participant
    const isParticipant = group.participants.some(p => 
      p.user.toString() === req.user._id.toString()
    );
    
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Not a participant in this group' });
    }

    if (!group.groupSession) group.groupSession = {};
    if (!group.groupSession.signaling) group.groupSession.signaling = { iceCandidates: [] };
    group.groupSession.signaling.iceCandidates.push({ from: req.user._id, candidate, sdpMid, sdpMLineIndex, createdAt: new Date() });
    await group.save();
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Clear group signaling (on cancel/end)
router.post('/group/:groupId/webrtc/clear', authenticateToken, async (req, res) => {
  try {
    const Group = require('../models/Group');
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
    
    // Check if user is a participant
    const isParticipant = group.participants.some(p => 
      p.user.toString() === req.user._id.toString()
    );
    
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Not a participant in this group' });
    }

    if (!group.groupSession) group.groupSession = {};
    group.groupSession.signaling = { iceCandidates: [] };
    await group.save();
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
