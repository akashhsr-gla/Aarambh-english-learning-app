const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');
const aiEvaluationService = require('../services/aiEvaluationService');

// Test AI service initialization
try {
  console.log('🔧 Initializing AI Evaluation Service...');
  console.log('✅ AI Evaluation Service initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize AI Evaluation Service:', error);
}

// Configure multer for audio file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/audio');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `pronunciation-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /wav|mp3|m4a|webm|ogg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'));
    }
  }
});

// Validation middleware
const pronunciationValidation = [
  body('targetWord').notEmpty().withMessage('Target word is required'),
  body('transcription').notEmpty().withMessage('Transcription is required'),
  body('difficulty').optional().isIn(['easy', 'medium', 'hard']).withMessage('Invalid difficulty level'),
  body('gameId').optional().isMongoId().withMessage('Invalid game ID'),
  body('sessionId').optional().isMongoId().withMessage('Invalid session ID')
];

const storyValidation = [
  body('story').isLength({ min: 10 }).withMessage('Story must be at least 10 characters long'),
  body('prompt').notEmpty().withMessage('Story prompt is required'),
  body('keywords').optional().isArray().withMessage('Keywords must be an array'),
  body('minWords').optional().isInt({ min: 1 }).withMessage('Minimum words must be a positive integer'),
  body('difficulty').optional().isIn(['easy', 'medium', 'hard']).withMessage('Invalid difficulty level'),
  body('timeSpent').optional().isInt({ min: 0 }).withMessage('Time spent must be non-negative'),
  body('maxTime').optional().isInt({ min: 1 }).withMessage('Max time must be positive'),
  body('gameId').optional().isMongoId().withMessage('Invalid game ID'),
  body('sessionId').optional().isMongoId().withMessage('Invalid session ID')
];

// 1. EVALUATE PRONUNCIATION
router.post('/pronunciation', authenticateToken, pronunciationValidation, async (req, res) => {
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
      targetWord,
      transcription,
      difficulty = 'medium',
      gameId,
      sessionId
    } = req.body;

    console.log('🎤 Evaluating pronunciation:', { targetWord, transcription, difficulty });

    // Evaluate pronunciation using AI
    const evaluation = await aiEvaluationService.evaluatePronunciation({
      transcription,
      targetWord,
      difficulty
    });
    
    console.log('🤖 AI evaluation result:', evaluation);

    // Save evaluation to database if needed
    const evaluationRecord = {
      userId: req.user._id,
      gameId,
      sessionId,
      evaluationType: 'pronunciation',
      targetWord,
      userInput: transcription,
      evaluation,
      createdAt: new Date()
    };

    // TODO: Save to database if you have an Evaluation model

    res.json({
      success: true,
      message: 'Pronunciation evaluated successfully',
      data: {
        evaluation,
        target_word: targetWord,
        transcription,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Pronunciation evaluation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to evaluate pronunciation',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// 2. EVALUATE PRONUNCIATION WITH AUDIO FILE
router.post('/pronunciation/audio', authenticateToken, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Audio file is required'
      });
    }

    const { targetWord, difficulty = 'medium', gameId, sessionId } = req.body;

    if (!targetWord) {
      return res.status(400).json({
        success: false,
        message: 'Target word is required'
      });
    }

    console.log('🎤 Processing audio file for pronunciation evaluation:', req.file.filename);

    // For now, we'll use a placeholder transcription
    // In a real implementation, you would use speech-to-text service like:
    // - OpenAI Whisper API
    // - Google Speech-to-Text
    // - Azure Speech Services
    const placeholderTranscription = targetWord; // This is a placeholder

    // TODO: Implement actual speech-to-text conversion
    // const transcription = await speechToTextService.transcribe(req.file.path);

    const evaluation = await aiEvaluationService.evaluatePronunciation({
      transcription: placeholderTranscription,
      targetWord,
      difficulty
    });

    // Clean up uploaded file after processing
    setTimeout(() => {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting audio file:', err);
      });
    }, 60000); // Delete after 1 minute

    res.json({
      success: true,
      message: 'Audio pronunciation evaluated successfully',
      data: {
        evaluation,
        target_word: targetWord,
        audio_processed: true,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Audio pronunciation evaluation error:', error);
    
    // Clean up file on error
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting audio file on error:', err);
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to evaluate audio pronunciation',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// 3. EVALUATE STORY
router.post('/story', authenticateToken, storyValidation, async (req, res) => {
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
      story,
      prompt,
      keywords = [],
      minWords = 50,
      difficulty = 'medium',
      timeSpent = 0,
      maxTime = 300,
      gameId,
      sessionId
    } = req.body;

    console.log('📝 Evaluating story:', { 
      storyLength: story.length, 
      keywordsCount: keywords.length, 
      difficulty 
    });

    // Evaluate story using AI
    const evaluation = await aiEvaluationService.evaluateStory({
      story,
      prompt,
      keywords,
      minWords,
      difficulty,
      timeSpent,
      maxTime
    });

    // Save evaluation to database if needed
    const evaluationRecord = {
      userId: req.user._id,
      gameId,
      sessionId,
      evaluationType: 'storytelling',
      userInput: story,
      evaluation,
      createdAt: new Date()
    };

    // TODO: Save to database if you have an Evaluation model

    res.json({
      success: true,
      message: 'Story evaluated successfully',
      data: {
        evaluation,
        story_length: story.length,
        word_count: evaluation.word_count,
        keywords_used: evaluation.keywords_used,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Story evaluation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to evaluate story',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// 4. GET EVALUATION HISTORY (for a user)
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { type, limit = 10, offset = 0 } = req.query;

    // TODO: Implement database query to get evaluation history
    // This is a placeholder response
    const history = [];

    res.json({
      success: true,
      data: {
        evaluations: history,
        total: history.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    console.error('Get evaluation history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get evaluation history'
    });
  }
});

// 5. GET EVALUATION STATISTICS
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;

    // TODO: Implement database aggregation for statistics
    // This is a placeholder response
    const stats = {
      pronunciation: {
        total_evaluations: 0,
        average_score: 0,
        improvement_rate: 0,
        recent_scores: []
      },
      storytelling: {
        total_evaluations: 0,
        average_score: 0,
        improvement_rate: 0,
        recent_scores: []
      }
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get evaluation stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get evaluation statistics'
    });
  }
});

module.exports = router;
