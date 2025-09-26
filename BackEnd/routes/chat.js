const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const User = require('../models/User');
const openaiService = require('../utils/openaiService');
const { authenticateToken } = require('../middleware/auth');
const { body, validationResult, query } = require('express-validator');
const { v4: uuidv4 } = require('uuid');

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * POST /api/chat/conversations
 * Create a new chat conversation
 */
router.post('/conversations', [
  body('category')
    .optional()
    .isIn(['grammar', 'pronunciation', 'vocabulary', 'writing', 'speaking', 'listening', 'general'])
    .withMessage('Invalid category'),
  body('level')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Invalid level'),
  body('title')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { category = 'general', level = 'intermediate', title } = req.body;
    const userId = req.user.id;

    // Check if OpenAI is configured
    if (!openaiService.isConfigured()) {
      return res.status(503).json({
        message: 'Chat service is currently unavailable. Please contact administrator.',
        error: 'OpenAI not configured'
      });
    }

    const conversation = new Chat({
      userId,
      sessionId: uuidv4(),
      title: title || 'New Conversation',
      category,
      level,
      messages: [],
      status: 'active'
    });

    await conversation.save();

    console.log(`✅ Created new conversation ${conversation._id} for user ${userId}`);

    res.status(201).json({
      message: 'Conversation created successfully',
      conversation: {
        id: conversation._id,
        sessionId: conversation.sessionId,
        title: conversation.title,
        category: conversation.category,
        level: conversation.level,
        status: conversation.status,
        createdAt: conversation.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Error creating conversation:', error);
    res.status(500).json({
      message: 'Failed to create conversation',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/chat/conversations
 * Get user's chat conversations
 */
router.get('/conversations', [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  query('status')
    .optional()
    .isIn(['active', 'completed', 'archived'])
    .withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { limit = 10, status } = req.query;
    const userId = req.user.id;

    const filter = { userId };
    if (status) {
      filter.status = status;
    } else {
      filter.status = { $ne: 'archived' }; // Exclude archived by default
    }

    const conversations = await Chat.find(filter)
      .sort({ 'analytics.lastActivity': -1 })
      .limit(parseInt(limit))
      .select('title category level status analytics createdAt updatedAt')
      .lean();

    res.json({
      message: 'Conversations retrieved successfully',
      conversations: conversations.map(conv => ({
        id: conv._id,
        title: conv.title,
        category: conv.category,
        level: conv.level,
        status: conv.status,
        messageCount: conv.analytics.totalMessages,
        lastActivity: conv.analytics.lastActivity,
        createdAt: conv.createdAt
      })),
      count: conversations.length
    });

  } catch (error) {
    console.error('❌ Error fetching conversations:', error);
    res.status(500).json({
      message: 'Failed to fetch conversations',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/chat/conversations/:conversationId
 * Get a specific conversation with messages
 */
router.get('/conversations/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const conversation = await Chat.findOne({
      _id: conversationId,
      userId
    }).lean();

    if (!conversation) {
      return res.status(404).json({
        message: 'Conversation not found'
      });
    }

    res.json({
      message: 'Conversation retrieved successfully',
      conversation: {
        id: conversation._id,
        sessionId: conversation.sessionId,
        title: conversation.title,
        category: conversation.category,
        level: conversation.level,
        status: conversation.status,
        messages: conversation.messages.map(msg => ({
          id: msg._id,
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
          metadata: msg.metadata
        })),
        analytics: conversation.analytics,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt
      }
    });

  } catch (error) {
    console.error('❌ Error fetching conversation:', error);
    res.status(500).json({
      message: 'Failed to fetch conversation',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * POST /api/chat/conversations/:conversationId/messages
 * Send a message and get AI response
 */
router.post('/conversations/:conversationId/messages', [
  body('message')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters'),
  body('category')
    .optional()
    .isIn(['grammar', 'pronunciation', 'vocabulary', 'writing', 'speaking', 'listening', 'general'])
    .withMessage('Invalid category'),
  body('level')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Invalid level')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { conversationId } = req.params;
    const { message, category, level } = req.body;
    const userId = req.user.id;

    // Find the conversation
    const conversation = await Chat.findOne({
      _id: conversationId,
      userId
    });

    if (!conversation) {
      return res.status(404).json({
        message: 'Conversation not found'
      });
    }

    // Check if OpenAI is configured
    if (!openaiService.isConfigured()) {
      return res.status(503).json({
        message: 'Chat service is currently unavailable. Please contact administrator.',
        error: 'OpenAI not configured'
      });
    }

    // Add user message to conversation
    const userMessage = conversation.addMessage('user', message);

    // Get context for OpenAI (recent messages)
    const contextMessages = conversation.getContextMessages(8);

    // Generate AI response
    const aiContext = {
      level: level || conversation.level,
      category: category || conversation.category,
      includeExercises: conversation.settings.includeExercises,
      includeGameRecommendations: conversation.settings.includeGameRecommendations
    };

    console.log(`🤖 Generating response for conversation ${conversationId}`, {
      messageLength: message.length,
      context: aiContext,
      contextMessages: contextMessages.length
    });

    const aiResponse = await openaiService.generateEnglishLearningResponse(
      contextMessages,
      aiContext
    );

    // Add AI response to conversation
    const assistantMessage = conversation.addMessage('assistant', aiResponse.content, {
      responseTime: aiResponse.responseTime,
      tokens: aiResponse.usage?.total_tokens,
      model: aiResponse.model,
      category: aiContext.category,
      level: aiContext.level
    });

    // Update conversation category/level if provided
    if (category && category !== conversation.category) {
      conversation.category = category;
    }
    if (level && level !== conversation.level) {
      conversation.level = level;
    }

    await conversation.save();

    console.log(`✅ Message exchange completed for conversation ${conversationId}`, {
      userMessageId: userMessage._id,
      assistantMessageId: assistantMessage._id,
      tokens: aiResponse.usage?.total_tokens,
      responseTime: aiResponse.responseTime
    });

    res.json({
      message: 'Message sent successfully',
      userMessage: {
        id: userMessage._id,
        role: userMessage.role,
        content: userMessage.content,
        timestamp: userMessage.timestamp
      },
      assistantMessage: {
        id: assistantMessage._id,
        role: assistantMessage.role,
        content: assistantMessage.content,
        timestamp: assistantMessage.timestamp,
        metadata: assistantMessage.metadata
      },
      conversation: {
        id: conversation._id,
        title: conversation.title,
        totalMessages: conversation.analytics.totalMessages
      }
    });

  } catch (error) {
    console.error('❌ Error processing message:', error);
    
    // Try to save user message even if AI response fails
    try {
      const conversation = await Chat.findOne({
        _id: req.params.conversationId,
        userId: req.user.id
      });
      
      if (conversation) {
        conversation.addMessage('user', req.body.message);
        // Add error message for failed AI response
        conversation.addMessage('assistant', 
          "I'm sorry, I'm having trouble responding right now. Please try again in a moment.",
          { error: true, errorMessage: error.message }
        );
        await conversation.save();
      }
    } catch (saveError) {
      console.error('❌ Error saving user message after AI failure:', saveError);
    }

    res.status(500).json({
      message: 'Failed to process message',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * PUT /api/chat/conversations/:conversationId
 * Update conversation settings
 */
router.put('/conversations/:conversationId', [
  body('title')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),
  body('category')
    .optional()
    .isIn(['grammar', 'pronunciation', 'vocabulary', 'writing', 'speaking', 'listening', 'general'])
    .withMessage('Invalid category'),
  body('level')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Invalid level'),
  body('status')
    .optional()
    .isIn(['active', 'completed', 'archived'])
    .withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { conversationId } = req.params;
    const userId = req.user.id;
    const updates = req.body;

    const conversation = await Chat.findOne({
      _id: conversationId,
      userId
    });

    if (!conversation) {
      return res.status(404).json({
        message: 'Conversation not found'
      });
    }

    // Update fields
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        conversation[key] = updates[key];
      }
    });

    await conversation.save();

    res.json({
      message: 'Conversation updated successfully',
      conversation: {
        id: conversation._id,
        title: conversation.title,
        category: conversation.category,
        level: conversation.level,
        status: conversation.status
      }
    });

  } catch (error) {
    console.error('❌ Error updating conversation:', error);
    res.status(500).json({
      message: 'Failed to update conversation',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * DELETE /api/chat/conversations/:conversationId
 * Delete a conversation
 */
router.delete('/conversations/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const conversation = await Chat.findOne({
      _id: conversationId,
      userId
    });

    if (!conversation) {
      return res.status(404).json({
        message: 'Conversation not found'
      });
    }

    await conversation.remove();

    console.log(`🗑️ Deleted conversation ${conversationId} for user ${userId}`);

    res.json({
      message: 'Conversation deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting conversation:', error);
    res.status(500).json({
      message: 'Failed to delete conversation',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/chat/stats
 * Get user's chat statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await Chat.getUserStats(userId);
    const userStats = stats[0] || {
      totalConversations: 0,
      totalMessages: 0,
      totalTokens: 0,
      avgResponseTime: 0,
      categories: [],
      levels: []
    };

    res.json({
      message: 'Statistics retrieved successfully',
      stats: userStats
    });

  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    res.status(500).json({
      message: 'Failed to fetch statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/chat/suggestions
 * Get suggested questions for the chatbot
 */
router.get('/suggestions', async (req, res) => {
  try {
    const suggestions = openaiService.getQuestionSuggestions();

    res.json({
      message: 'Suggestions retrieved successfully',
      suggestions
    });

  } catch (error) {
    console.error('❌ Error fetching suggestions:', error);
    res.status(500).json({
      message: 'Failed to fetch suggestions',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/chat/health
 * Check chat service health
 */
router.get('/health', async (req, res) => {
  try {
    const health = await openaiService.testConnection();

    res.json({
      message: 'Health check completed',
      status: health.success ? 'healthy' : 'unhealthy',
      details: health
    });

  } catch (error) {
    console.error('❌ Error checking health:', error);
    res.status(500).json({
      message: 'Health check failed',
      status: 'unhealthy',
      error: error.message
    });
  }
});

module.exports = router;
