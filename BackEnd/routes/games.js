const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Game = require('../models/Game');
const Session = require('../models/Session');
const User = require('../models/User');
const { authenticateToken, requireAdmin, requireSubscription } = require('../middleware/auth');
const { convertGoogleDriveUrl, validateGoogleDriveUrl } = require('../utils/googleDriveHelper');

// Validation middleware
const validateGame = [
  body('title').trim().isLength({ min: 3, max: 100 }).withMessage('Title must be 3-100 characters'),
  body('description').trim().isLength({ min: 10, max: 500 }).withMessage('Description must be 10-500 characters'),
  body('gameType').isIn(['grammar', 'pronunciation', 'identification', 'storytelling']).withMessage('Invalid game type'),
  body('difficulty').isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid difficulty level'),
  body('level').isInt({ min: 1, max: 10 }).withMessage('Level must be 1-10'),
  body('timeLimit').isInt({ min: 0 }).withMessage('Time limit must be 0 or positive'),
  body('maxScore').isInt({ min: 1 }).withMessage('Max score must be positive'),
  body('passingScore').isInt({ min: 0 }).withMessage('Passing score must be 0 or positive'),
  body('totalQuestions').isInt({ min: 1, max: 50 }).withMessage('Total questions must be 1-50'),
  body('questions').isArray({ min: 1 }).withMessage('Must have at least one question'),
  body('questions.*.questionText').trim().isLength({ min: 5 }).withMessage('Question text must be at least 5 characters'),
  body('questions.*.questionType').isIn(['multiple_choice', 'true_false', 'fill_blank', 'audio', 'image', 'video']).withMessage('Invalid question type'),
  body('questions.*.points').isInt({ min: 1 }).withMessage('Points must be positive'),
  body('isPremium').isBoolean().withMessage('isPremium must be boolean'),
  body('requiresSubscription').isBoolean().withMessage('requiresSubscription must be boolean')
];

const validateQuestion = [
  body('questionText').trim().isLength({ min: 5 }).withMessage('Question text must be at least 5 characters'),
  body('questionType').isIn(['multiple_choice', 'true_false', 'fill_blank', 'audio', 'image', 'video']).withMessage('Invalid question type'),
  body('points').isInt({ min: 1 }).withMessage('Points must be positive')
];

// Helper function to process Google Drive URLs in game questions
const processGoogleDriveUrls = (questions) => {
  if (!questions || !Array.isArray(questions)) return questions;
  
  return questions.map(question => {
    if (question.mediaUrl && question.mediaType === 'image') {
      const validation = validateGoogleDriveUrl(question.mediaUrl);
      if (validation.isValid) {
        // Convert Google Drive URL to direct image URL
        question.mediaUrl = convertGoogleDriveUrl(question.mediaUrl, 'image');
        question.googleDriveProcessed = true;
      } else {
        console.warn(`Invalid Google Drive URL in question: ${question.mediaUrl}`);
      }
    }
    return question;
  });
};

// 1. CREATE GAME (Admin only)
router.post('/', authenticateToken, requireAdmin, validateGame, async (req, res) => {
  try {
    // Validate only the fields being updated
    const updateFields = Object.keys(req.body);
    const validationErrors = [];
    
    // Validate title if being updated
    if (req.body.title && (req.body.title.length < 3 || req.body.title.length > 100)) {
      validationErrors.push({
        type: 'field',
        msg: 'Title must be 3-100 characters',
        path: 'title',
        location: 'body'
      });
    }
    
    // Validate description if being updated
    if (req.body.description && (req.body.description.length < 10 || req.body.description.length > 500)) {
      validationErrors.push({
        type: 'field',
        msg: 'Description must be 10-500 characters',
        path: 'description',
        location: 'body'
      });
    }
    
    // Validate passing score if being updated
    if (req.body.passingScore !== undefined && (req.body.passingScore < 0 || req.body.passingScore > 100)) {
      validationErrors.push({
        type: 'field',
        msg: 'Passing score must be 0-100',
        path: 'passingScore',
        location: 'body'
      });
    }
    
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: validationErrors
      });
    }

    const {
      title, description, gameType, difficulty, level, timeLimit, maxScore, passingScore,
      totalQuestions, questions, isPremium, requiresSubscription, categories, tags
    } = req.body;

    // Validate question count matches totalQuestions
    if (questions.length !== totalQuestions) {
      return res.status(400).json({
        success: false,
        message: `Question count (${questions.length}) must match totalQuestions (${totalQuestions})`
      });
    }

    // Validate questions structure
    const questionErrors = [];
    questions.forEach((question, index) => {
      question.questionNumber = index + 1;
      
      if (question.questionType === 'multiple_choice') {
        if (!question.options || question.options.length < 2) {
          questionErrors.push(`Question ${index + 1}: multiple choice must have at least 2 options`);
        }
        
        const correctOptions = question.options.filter(opt => opt.isCorrect);
        if (correctOptions.length === 0) {
          questionErrors.push(`Question ${index + 1}: must have at least one correct option`);
        }
      } else {
        if (!question.correctAnswer) {
          questionErrors.push(`Question ${index + 1}: must have correctAnswer for non-multiple choice`);
        }
      }
    });

    if (questionErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Question validation errors',
        errors: questionErrors
      });
    }

    // Process Google Drive URLs for identification games
    let processedQuestions = questions;
    if (gameType === 'identification' && questions) {
      processedQuestions = processGoogleDriveUrls(questions);
    }

    const game = new Game({
      title,
      description,
      gameType,
      difficulty,
      level,
      timeLimit,
      maxScore,
      passingScore,
      totalQuestions,
      questions: processedQuestions,
      isPremium,
      requiresSubscription,
      categories: categories || [],
      tags: tags || [],
      createdBy: req.user._id
    });

    await game.save();

    res.status(201).json({
      success: true,
      message: 'Game created successfully',
      data: { game }
    });

  } catch (error) {
    console.error('Create game error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 2. GET ALL GAMES (with filters)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      gameType, difficulty, level, isPremium, isActive, page = 1, limit = 10,
      sortBy = 'createdAt', sortOrder = 'desc'
    } = req.query;

    const query = { isActive: true };
    
    if (gameType) query.gameType = gameType;
    if (difficulty) query.difficulty = difficulty;
    if (level) query.level = parseInt(level);
    if (isPremium !== undefined) query.isPremium = isPremium === 'true';

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const games = await Game.find(query)
      .populate('createdBy', 'name')
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Game.countDocuments(query);

    res.json({
      success: true,
      data: {
        games: processedGames,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get games error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 3. GET GAME BY ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const game = await Game.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate('categories');

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    // Check if user has access to premium games
    if (game.isPremium && req.user.role === 'student') {
      const hasSubscription = await req.user.hasActiveSubscription();
      if (!hasSubscription) {
        return res.status(403).json({
          success: false,
          message: 'Premium subscription required for this game'
        });
      }
    }

    res.json({
      success: true,
      data: { game }
    });

  } catch (error) {
    console.error('Get game error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 4. UPDATE GAME (Admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    // Process Google Drive URLs for identification games if questions are being updated
    if (game.gameType === 'identification' && req.body.questions) {
      req.body.questions = processGoogleDriveUrls(req.body.questions);
    }

    // Update game fields
    Object.assign(game, req.body);
    game.updatedAt = Date.now();

    await game.save();

    res.json({
      success: true,
      message: 'Game updated successfully',
      data: { game }
    });

  } catch (error) {
    console.error('Update game error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 5. DELETE GAME (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    // Soft delete - set isActive to false
    game.isActive = false;
    await game.save();

    res.json({
      success: true,
      message: 'Game deleted successfully'
    });

  } catch (error) {
    console.error('Delete game error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 6. START GAME SESSION
router.post('/:id/start', authenticateToken, async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game || !game.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Game not found or inactive'
      });
    }

    // Check premium access for students
    if (game.isPremium && req.user.role === 'student') {
      const hasSubscription = await req.user.hasActiveSubscription();
      if (!hasSubscription) {
        return res.status(403).json({
          success: false,
          message: 'Premium subscription required for this game'
        });
      }
    }

    // Create game session
    const session = new Session({
      sessionId: `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionType: 'game',
      title: `Playing ${game.title}`,
      host: req.user._id,
      participants: [{
        user: req.user._id,
        role: 'player',
        joinedAt: new Date()
      }],
      gameSession: {
        game: game._id,
        gameType: game.gameType,
        difficulty: game.difficulty,
        level: game.level,
        startTime: new Date(),
        status: 'active'
      }
    });

    await session.save();

    // Return game questions (without correct answers for security)
    const gameQuestions = game.questions.map(q => ({
      questionNumber: q.questionNumber,
      questionText: q.questionText,
      questionType: q.questionType,
      options: q.questionType === 'multiple_choice' ? q.options.map(opt => ({
        text: opt.text,
        explanation: opt.explanation
      })) : undefined,
      mediaUrl: q.mediaUrl,
      mediaType: q.mediaType,
      hint: q.hint,
      points: q.points,
      timeLimit: q.timeLimit || game.timeLimit,
      // Game-specific fields
      grammarRule: q.grammarRule,
      pronunciationGuide: q.pronunciationGuide,
      wordCategory: q.wordCategory,
      storyContext: q.storyContext
    }));

    res.json({
      success: true,
      message: 'Game session started',
      data: {
        sessionId: session._id,
        game: {
          id: game._id,
          title: game.title,
          gameType: game.gameType,
          difficulty: game.difficulty,
          level: game.level,
          timeLimit: game.timeLimit,
          maxScore: game.maxScore,
          passingScore: game.passingScore,
          totalQuestions: game.totalQuestions
        },
        questions: gameQuestions
      }
    });

  } catch (error) {
    console.error('Start game error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 7. SUBMIT GAME ANSWERS
router.post('/:id/submit', authenticateToken, async (req, res) => {
  try {
    const { sessionId, answers, timeSpent } = req.body;

    if (!sessionId || !answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: 'Session ID and answers array required'
      });
    }

    // Get session
    const session = await Session.findById(sessionId);
    if (!session || session.sessionType !== 'game') {
      return res.status(404).json({
        success: false,
        message: 'Game session not found'
      });
    }

    // Verify user is participant
    const isParticipant = session.participants.some(p => 
      p.user.toString() === req.user._id.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Not a participant in this session'
      });
    }

    // Get game
    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    // Calculate score and check answers
    let totalScore = 0;
    let correctAnswers = 0;
    const answerDetails = [];

    for (const answer of answers) {
      const question = game.questions.find(q => q.questionNumber === answer.questionNumber);
      if (!question) continue;

      let isCorrect = false;
      let earnedPoints = 0;

      if (question.questionType === 'multiple_choice') {
        const selectedOption = question.options.find(opt => opt.text === answer.selectedAnswer);
        isCorrect = selectedOption && selectedOption.isCorrect;
        earnedPoints = isCorrect ? question.points : 0;
      } else {
        // For other question types, compare with correctAnswer
        isCorrect = answer.selectedAnswer === question.correctAnswer;
        earnedPoints = isCorrect ? question.points : 0;
      }

      if (isCorrect) {
        correctAnswers++;
        totalScore += earnedPoints;
      }

      answerDetails.push({
        questionNumber: answer.questionNumber,
        selectedAnswer: answer.selectedAnswer,
        correctAnswer: question.questionType === 'multiple_choice' ? 
          question.options.find(opt => opt.isCorrect)?.text : question.correctAnswer,
        isCorrect,
        earnedPoints,
        explanation: question.explanation
      });
    }

    const percentage = Math.round((correctAnswers / game.totalQuestions) * 100);
    const passed = percentage >= game.passingScore;

    // Update session with results
    session.gameSession.endTime = new Date();
    session.gameSession.status = 'completed';
    session.gameSession.score = totalScore;
    session.gameSession.percentage = percentage;
    session.gameSession.correctAnswers = correctAnswers;
    session.gameSession.totalQuestions = game.totalQuestions;
    session.gameSession.timeSpent = timeSpent;
    session.gameSession.passed = passed;
    session.gameSession.answers = answerDetails;

    // Update participant
    const participant = session.participants.find(p => 
      p.user.toString() === req.user._id.toString()
    );
    if (participant) {
      participant.leftAt = new Date();
      participant.duration = Math.round((participant.leftAt - participant.joinedAt) / 1000); // Convert to seconds
    }

    await session.save();

    // Update game statistics
    game.updateStats(totalScore, true);
    await game.save();

    // Update user statistics
    req.user.addGameScore(game.gameType, totalScore);
    req.user.studentInfo.totalSessions += 1;
    await req.user.save();

    res.json({
      success: true,
      message: 'Game completed successfully',
      data: {
        score: totalScore,
        percentage,
        correctAnswers,
        totalQuestions: game.totalQuestions,
        passed,
        timeSpent,
        maxScore: game.maxScore,
        passingScore: game.passingScore,
        answerDetails
      }
    });

  } catch (error) {
    console.error('Submit game error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 8. GET GAME STATISTICS
router.get('/:id/stats', authenticateToken, async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    // Get user's game history
    const userSessions = await Session.find({
      'participants.user': req.user._id,
      'gameSession.game': game._id,
      'gameSession.status': 'completed'
    }).sort({ 'gameSession.endTime': -1 });

    const userStats = {
      totalPlays: userSessions.length,
      averageScore: userSessions.length > 0 ? 
        Math.round(userSessions.reduce((sum, s) => sum + s.gameSession.score, 0) / userSessions.length) : 0,
      bestScore: userSessions.length > 0 ? Math.max(...userSessions.map(s => s.gameSession.score)) : 0,
      completionRate: userSessions.length > 0 ? 
        Math.round((userSessions.filter(s => s.gameSession.passed).length / userSessions.length) * 100) : 0,
      recentScores: userSessions.slice(0, 5).map(s => ({
        score: s.gameSession.score,
        percentage: s.gameSession.percentage,
        passed: s.gameSession.passed,
        date: s.gameSession.endTime
      }))
    };

    res.json({
      success: true,
      data: {
        gameStats: {
          totalPlays: game.totalPlays,
          averageScore: game.averageScore,
          completionRate: game.completionRate
        },
        userStats
      }
    });

  } catch (error) {
    console.error('Get game stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 9. GET GAMES BY TYPE (Public access for basic game data)
router.get('/type/:gameType', async (req, res) => {
  try {
    const { difficulty, level, isPremium, page = 1, limit = 10 } = req.query;
    
    const query = { 
      gameType: req.params.gameType, 
      isActive: true 
    };
    
    if (difficulty) query.difficulty = difficulty;
    if (level) query.level = parseInt(level);
    if (isPremium !== undefined) query.isPremium = isPremium === 'true';

    const games = await Game.find(query)
      .populate('createdBy', 'name')
      .sort({ level: 1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    // Process Google Drive URLs for identification games
    console.log('🔍 Processing games for type:', req.params.gameType);
    console.log('📊 Found games:', games.length);
    
    const processedGames = games.map(game => {
      if (game.gameType === 'identification' && game.questions) {
        console.log('🖼️ Processing identification game:', game.title);
        game.questions = processGoogleDriveUrls(game.questions);
        console.log('✅ Processed questions:', game.questions.length);
      }
      return game;
    });

    const total = await Game.countDocuments(query);

    res.json({
      success: true,
      data: {
        games: processedGames,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get games by type error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 10. GET RANDOM GAME (Public access for basic game data)
router.get('/random/:gameType', async (req, res) => {
  try {
    const { difficulty, isPremium = false } = req.query;
    
    const query = { 
      gameType: req.params.gameType, 
      isActive: true, 
      isPremium: isPremium === 'true'
    };
    
    if (difficulty) query.difficulty = difficulty;

    const game = await Game.aggregate([
      { $match: query },
      { $sample: { size: 1 } },
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'createdBy'
        }
      },
      { $unwind: '$createdBy' }
    ]);

    if (game.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No games found for the specified criteria'
      });
    }

    res.json({
      success: true,
      data: { game: game[0] }
    });

  } catch (error) {
    console.error('Get random game error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
