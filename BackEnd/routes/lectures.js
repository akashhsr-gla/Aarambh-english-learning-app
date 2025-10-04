const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const VideoLecture = require('../models/VideoLecture');
const User = require('../models/User');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');
const { convertGoogleDriveUrl, validateGoogleDriveUrl } = require('../utils/googleDriveHelper');

// Validation middleware
const validateLecture = [
  body('title').trim().isLength({ min: 5, max: 200 }).withMessage('Title must be between 5 and 200 characters'),
  body('description').trim().isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10 and 1000 characters'),
  body('videoUrl').isURL().withMessage('Video URL must be a valid URL'),
  body('thumbnailUrl').optional().isURL().withMessage('Thumbnail URL must be a valid URL'),
  body('duration').isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
  body('instructor').isMongoId().withMessage('Invalid instructor ID'),
  body('region').optional().isMongoId().withMessage('Invalid region ID'),
  body('category').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Category must be between 2 and 100 characters'),
  body('isPremium').optional().isBoolean().withMessage('isPremium must be a boolean value'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean value'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']).withMessage('Difficulty must be beginner, intermediate, or advanced')
];

const validateLectureUpdate = [
  body('title').optional().trim().isLength({ min: 5, max: 200 }).withMessage('Title must be between 5 and 1000 characters'),
  body('description').optional().trim().isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10 and 1000 characters'),
  body('videoUrl').optional().isURL().withMessage('Video URL must be a valid URL'),
  body('thumbnailUrl').optional().isURL().withMessage('Thumbnail URL must be a valid URL'),
  body('duration').optional().isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
  body('instructor').optional().isMongoId().withMessage('Invalid instructor ID'),
  body('region').optional().isMongoId().withMessage('Invalid region ID'),
  body('category').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Category must be between 2 and 100 characters'),
  body('isPremium').optional().isBoolean().withMessage('isPremium must be a boolean value'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean value'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']).withMessage('Difficulty must be beginner, intermediate, or advanced')
];

// 1. CREATE LECTURE (Admin only)
router.post('/', authenticateToken, requireAdmin, validateLecture, async (req, res) => {
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
      description,
      videoUrl,
      thumbnailUrl,
      duration,
      notes,
      instructor,
      region,
      isPremium = false,
      isActive = true,
      tags = [],
      category,
      difficulty = 'beginner'
    } = req.body;

    // Check if lecture with same title already exists
    const existingLecture = await VideoLecture.findOne({
      title: { $regex: new RegExp(`^${title}$`, 'i') }
    });

    if (existingLecture) {
      return res.status(400).json({
        success: false,
        message: 'Lecture with this title already exists'
      });
    }

    // Convert Google Drive URLs to direct playable URLs
    let convertedVideoUrl = videoUrl;
    let convertedThumbnailUrl = thumbnailUrl;
    let convertedNotes = notes;

    // Convert video URL
    if (videoUrl) {
      const videoValidation = validateGoogleDriveUrl(videoUrl);
      if (videoValidation.isValid) {
        convertedVideoUrl = convertGoogleDriveUrl(videoUrl, 'video');
        console.log(`✅ Converted video URL: ${videoUrl} -> ${convertedVideoUrl}`);
      } else if (videoValidation.isGoogleDrive) {
        console.warn(`⚠️ Invalid Google Drive video URL: ${videoValidation.error}`);
      }
    }

    // Convert thumbnail URL
    if (thumbnailUrl) {
      const thumbnailValidation = validateGoogleDriveUrl(thumbnailUrl);
      if (thumbnailValidation.isValid) {
        convertedThumbnailUrl = convertGoogleDriveUrl(thumbnailUrl, 'thumbnail');
        console.log(`✅ Converted thumbnail URL: ${thumbnailUrl} -> ${convertedThumbnailUrl}`);
      } else if (thumbnailValidation.isGoogleDrive) {
        console.warn(`⚠️ Invalid Google Drive thumbnail URL: ${thumbnailValidation.error}`);
      }
    }

    // Convert notes PDF URL
    if (notes && notes.pdfUrl) {
      const pdfValidation = validateGoogleDriveUrl(notes.pdfUrl);
      if (pdfValidation.isValid) {
        convertedNotes = {
          ...notes,
          pdfUrl: convertGoogleDriveUrl(notes.pdfUrl, 'pdf')
        };
        console.log(`✅ Converted PDF URL: ${notes.pdfUrl} -> ${convertedNotes.pdfUrl}`);
      } else if (pdfValidation.isGoogleDrive) {
        console.warn(`⚠️ Invalid Google Drive PDF URL: ${pdfValidation.error}`);
      }
    }

    const lecture = new VideoLecture({
      title,
      description,
      videoUrl: convertedVideoUrl,
      thumbnailUrl: convertedThumbnailUrl,
      duration,
      notes: convertedNotes,
      instructor,
      region,
      isPremium,
      isActive,
      tags,
      category,
      difficulty,
      createdBy: req.user._id
    });

    await lecture.save();

    res.status(201).json({
      success: true,
      message: 'Lecture created successfully',
      data: {
        id: lecture._id,
        title: lecture.title,
        description: lecture.description,
        videoUrl: lecture.videoUrl,
        thumbnailUrl: lecture.thumbnailUrl,
        duration: lecture.duration,
        instructor: lecture.instructor,
        isPremium: lecture.isPremium,
        isActive: lecture.isActive,
        tags: lecture.tags,
      category,
        difficulty: lecture.difficulty,
        createdAt: lecture.createdAt
      }
    });

  } catch (error) {
    console.error('Create lecture error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 2. GET ALL LECTURES (All users can access)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { 
      active, 
      premium, 
      difficulty, 
      region,
      instructor,
      search,
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      page = 1, 
      limit = 20 
    } = req.query;

    // Build filter
    let filter = {};
    
    // Default to only show active and published lectures for public access
    if (active !== undefined) {
      filter.isActive = active === 'true';
    } else {
      filter.isActive = true;
    }
    
    // Always filter for published lectures
    filter.isPublished = true;
    
    if (premium !== undefined) filter.isPremium = premium === 'true';
    if (difficulty) filter.difficulty = difficulty;
    if (region) filter.region = region;
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { instructor: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get lectures with pagination
    const lectures = await VideoLecture.find(filter)
      .populate('region', 'name code')
      .populate('instructor', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('title description videoUrl thumbnailUrl duration instructor region isPremium isActive tags difficulty totalViews createdAt');

    // Get total count for pagination
    const total = await VideoLecture.countDocuments(filter);

    // Get statistics
    const stats = await VideoLecture.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$difficulty',
          count: { $sum: 1 },
          totalDuration: { $sum: '$duration' },
          avgDuration: { $avg: '$duration' },
          totalViews: { $sum: '$totalViews' }
        }
      }
    ]);

    res.json({
      success: true,
      message: 'Lectures retrieved successfully',
      data: {
        lectures,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        statistics: stats,
        filters: {
          active: active !== undefined ? active === 'true' : 'all',
          premium: premium !== undefined ? premium === 'true' : 'all',
          difficulty: difficulty || 'all',
          region: region || 'all',
          instructor: instructor || 'none',
          search: search || 'none'
        }
      }
    });

  } catch (error) {
    console.error('Get lectures error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 3. GET LECTURE BY ID (All users can access)
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid lecture ID format'
      });
    }

    const lecture = await VideoLecture.findById(id)
      .populate('region', 'name code description')
      .populate('instructor', 'name email')
      .select('title description videoUrl thumbnailUrl duration notes instructor region isPremium isActive tags difficulty totalViews createdAt updatedAt');

    if (!lecture) {
      return res.status(404).json({
        success: false,
        message: 'Lecture not found'
      });
    }

    // Increment view count
    lecture.totalViews += 1;
    await lecture.save();

    res.json({
      success: true,
      message: 'Lecture retrieved successfully',
      data: lecture
    });

  } catch (error) {
    console.error('Get lecture by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 4. UPDATE LECTURE (Admin only)
router.put('/:id', authenticateToken, requireAdmin, validateLectureUpdate, async (req, res) => {
  try {
    const { id } = req.params;
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    // Validate ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid lecture ID format'
      });
    }

    const lecture = await VideoLecture.findById(id);
    if (!lecture) {
      return res.status(404).json({
        success: false,
        message: 'Lecture not found'
      });
    }

    const {
      title,
      description,
      videoUrl,
      thumbnailUrl,
      duration,
      notes,
      instructor,
      region,
      isPremium,
      isActive,
      tags,
      category,
      difficulty
    } = req.body;

    // Check for duplicate titles if updating
    if (title && title !== lecture.title) {
      const existingLecture = await VideoLecture.findOne({
        title: { $regex: new RegExp(`^${title}$`, 'i') },
        _id: { $ne: id }
      });

      if (existingLecture) {
        return res.status(400).json({
          success: false,
          message: 'Lecture with this title already exists'
        });
      }
    }

    // Convert Google Drive URLs to direct playable URLs
    let convertedVideoUrl = videoUrl;
    let convertedThumbnailUrl = thumbnailUrl;
    let convertedNotes = notes;

    // Convert video URL if provided
    if (videoUrl !== undefined && videoUrl) {
      const videoValidation = validateGoogleDriveUrl(videoUrl);
      if (videoValidation.isValid) {
        convertedVideoUrl = convertGoogleDriveUrl(videoUrl, 'video');
        console.log(`✅ Converted video URL: ${videoUrl} -> ${convertedVideoUrl}`);
      } else if (videoValidation.isGoogleDrive) {
        console.warn(`⚠️ Invalid Google Drive video URL: ${videoValidation.error}`);
      }
    }

    // Convert thumbnail URL if provided
    if (thumbnailUrl !== undefined && thumbnailUrl) {
      const thumbnailValidation = validateGoogleDriveUrl(thumbnailUrl);
      if (thumbnailValidation.isValid) {
        convertedThumbnailUrl = convertGoogleDriveUrl(thumbnailUrl, 'thumbnail');
        console.log(`✅ Converted thumbnail URL: ${thumbnailUrl} -> ${convertedThumbnailUrl}`);
      } else if (thumbnailValidation.isGoogleDrive) {
        console.warn(`⚠️ Invalid Google Drive thumbnail URL: ${thumbnailValidation.error}`);
      }
    }

    // Convert notes PDF URL if provided
    if (notes !== undefined && notes && notes.pdfUrl) {
      const pdfValidation = validateGoogleDriveUrl(notes.pdfUrl);
      if (pdfValidation.isValid) {
        convertedNotes = {
          ...notes,
          pdfUrl: convertGoogleDriveUrl(notes.pdfUrl, 'pdf')
        };
        console.log(`✅ Converted PDF URL: ${notes.pdfUrl} -> ${convertedNotes.pdfUrl}`);
      } else if (pdfValidation.isGoogleDrive) {
        console.warn(`⚠️ Invalid Google Drive PDF URL: ${pdfValidation.error}`);
      }
    }

    // Update fields
    if (title !== undefined) lecture.title = title;
    if (description !== undefined) lecture.description = description;
    if (videoUrl !== undefined) lecture.videoUrl = convertedVideoUrl;
    if (thumbnailUrl !== undefined) lecture.thumbnailUrl = convertedThumbnailUrl;
    if (duration !== undefined) lecture.duration = duration;
    if (notes !== undefined) lecture.notes = convertedNotes;
    if (instructor !== undefined) lecture.instructor = instructor;
    if (region !== undefined) lecture.region = region;
    if (isPremium !== undefined) lecture.isPremium = isPremium;
    if (isActive !== undefined) lecture.isActive = isActive;
    if (tags !== undefined) lecture.tags = tags;
    if (difficulty !== undefined) lecture.difficulty = difficulty;

    lecture.updatedAt = new Date();
    await lecture.save();

    res.json({
      success: true,
      message: 'Lecture updated successfully',
      data: {
        id: lecture._id,
        title: lecture.title,
        description: lecture.description,
        videoUrl: lecture.videoUrl,
        thumbnailUrl: lecture.thumbnailUrl,
        duration: lecture.duration,
        instructor: lecture.instructor,
        isPremium: lecture.isPremium,
        isActive: lecture.isActive,
        tags: lecture.tags,
      category,
        difficulty: lecture.difficulty,
        updatedAt: lecture.updatedAt
      }
    });

  } catch (error) {
    console.error('Update lecture error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 5. DELETE LECTURE (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid lecture ID format'
      });
    }

    const lecture = await VideoLecture.findById(id);
    if (!lecture) {
      return res.status(404).json({
        success: false,
        message: 'Lecture not found'
      });
    }

    await VideoLecture.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Lecture deleted successfully',
      data: {
        id: lecture._id,
        title: lecture.title,
        instructor: lecture.instructor
      }
    });

  } catch (error) {
    console.error('Delete lecture error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 6. TOGGLE LECTURE STATUS (Admin only)
router.patch('/:id/toggle-status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid lecture ID format'
      });
    }

    const lecture = await VideoLecture.findById(id);
    if (!lecture) {
      return res.status(404).json({
        success: false,
        message: 'Lecture not found'
      });
    }

    lecture.isActive = !lecture.isActive;
    lecture.updatedAt = new Date();
    await lecture.save();

    res.json({
      success: true,
      message: `Lecture ${lecture.isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        id: lecture._id,
        title: lecture.title,
        isActive: lecture.isActive,
        updatedAt: lecture.updatedAt
      }
    });

  } catch (error) {
    console.error('Toggle lecture status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 7. UPDATE LECTURE VIEW STATS (All users)
router.post('/:id/view', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { watchTime = 0 } = req.body;

    // Validate ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid lecture ID format'
      });
    }

    const lecture = await VideoLecture.findById(id);
    if (!lecture) {
      return res.status(404).json({
        success: false,
        message: 'Lecture not found'
      });
    }

    // Update view statistics
    lecture.updateViewStats(watchTime);
    await lecture.save();

    res.json({
      success: true,
      message: 'Lecture view stats updated successfully',
      data: {
        id: lecture._id,
        title: lecture.title,
        totalViews: lecture.totalViews,
        averageWatchTime: lecture.averageWatchTime,
        completionRate: lecture.completionRate
      }
    });

  } catch (error) {
    console.error('Update lecture view stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 8. GET LECTURE STATISTICS (Admin only)
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
      regionFilter.region = region;
    }

    // Combine filters
    const filter = { ...dateFilter, ...regionFilter };

    // Get comprehensive statistics
    const stats = await VideoLecture.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            difficulty: '$difficulty',
            isPremium: '$isPremium'
          },
          count: { $sum: 1 },
          totalDuration: { $sum: '$duration' },
          avgDuration: { $avg: '$duration' },
          totalViews: { $sum: '$totalViews' }
        }
      },
      {
        $group: {
          _id: '$_id.difficulty',
          premium: {
            $push: {
              isPremium: '$_id.isPremium',
              count: '$count',
              totalDuration: '$totalDuration',
              avgDuration: '$avgDuration',
              totalViews: '$totalViews'
            }
          },
          totalCount: { $sum: '$count' },
          totalDuration: { $sum: '$totalDuration' },
          totalViews: { $sum: '$totalViews' }
        }
      }
    ]);

    // Get recent lectures
    const recentLectures = await VideoLecture.find(filter)
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('region', 'name code')
      .populate('instructor', 'name')
      .select('title instructor region difficulty isPremium totalViews createdAt');

    // Get top instructors
    const topInstructors = await VideoLecture.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$instructor',
          lectureCount: { $sum: 1 },
          totalViews: { $sum: '$totalViews' },
          avgDuration: { $avg: '$duration' }
        }
      },
      { $sort: { totalViews: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      success: true,
      message: 'Lecture statistics retrieved successfully',
      data: {
        statistics: stats,
        recentLectures,
        topInstructors,
        filters: {
          startDate: startDate || 'none',
          endDate: endDate || 'none',
          region: region || 'all'
        }
      }
    });

  } catch (error) {
    console.error('Get lecture statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 9. SEARCH LECTURES (All users)
router.post('/search', authenticateToken, async (req, res) => {
  try {
    const { 
      query,
      difficulty,
      isPremium,
      region,
      instructor,
      minDuration,
      maxDuration,
      tags,
      category,
      page = 1, 
      limit = 20 
    } = req.body;

    // Build search filter
    let filter = { isActive: true };

    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        
        { tags: { $in: [new RegExp(query, 'i')] } }
      ];
    }

    if (difficulty) filter.difficulty = difficulty;
    if (isPremium !== undefined) filter.isPremium = isPremium;
    if (region) filter.region = region;
    
    if (minDuration || maxDuration) {
      filter.duration = {};
      if (minDuration) filter.duration.$gte = parseInt(minDuration);
      if (maxDuration) filter.duration.$lte = parseInt(maxDuration);
    }
    if (tags && tags.length > 0) {
      filter.tags = { $in: tags };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get lectures with filters
    const lectures = await VideoLecture.find(filter)
      .populate('region', 'name code')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('title description videoUrl thumbnailUrl duration instructor region isPremium tags difficulty totalViews createdAt');

    // Get total count
    const total = await VideoLecture.countDocuments(filter);

    res.json({
      success: true,
      message: 'Lecture search completed successfully',
      data: {
        lectures,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        searchCriteria: {
          query: query || 'none',
          difficulty: difficulty || 'all',
          isPremium: isPremium !== undefined ? isPremium : 'all',
          region: region || 'all',
          instructor: instructor || 'none',
          minDuration: minDuration || 'none',
          maxDuration: maxDuration || 'none',
          tags: tags || 'none'
        }
      }
    });

  } catch (error) {
    console.error('Search lectures error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
