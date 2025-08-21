const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Session = require('../models/Session');
const Region = require('../models/Region');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Validation middleware
const validateRegionQuery = [
  body('regionId').optional().isMongoId().withMessage('Invalid region ID')
];

// Helper function to calculate leaderboard score
const calculateLeaderboardScore = (lecturesWatched, gameSessions, communicationSessions) => {
  // Equal weightage for all three components (33.33% each)
  const lectureScore = lecturesWatched * 0.3333;
  const gameScore = gameSessions * 0.3333;
  const communicationScore = communicationSessions * 0.3334; // Slightly higher to ensure total = 100%
  
  return Math.round((lectureScore + gameScore + communicationScore) * 100) / 100; // Round to 2 decimal places
};

// Helper function to get user statistics
const getUserStatistics = async (userId) => {
  try {
    // Get lectures watched count (from user model)
    const user = await User.findById(userId).select('studentInfo.totalLecturesWatched');
    const lecturesWatched = user?.studentInfo?.totalLecturesWatched || 0;

    // Get game sessions count
    const gameSessions = await Session.countDocuments({
      'participants.user': userId,
      sessionType: 'game',
      'gameSession.status': 'completed'
    });

    // Get communication sessions count (all types of calls and chats)
    const communicationSessions = await Session.countDocuments({
      'participants.user': userId,
      sessionType: { 
        $in: ['video_call', 'voice_call', 'group_video_call', 'group_voice_call', 'chat'] 
      },
      status: 'completed'
    });

    return {
      lecturesWatched,
      gameSessions,
      communicationSessions,
      totalScore: calculateLeaderboardScore(lecturesWatched, gameSessions, communicationSessions)
    };
  } catch (error) {
    console.error('Error getting user statistics:', error);
    return {
      lecturesWatched: 0,
      gameSessions: 0,
      communicationSessions: 0,
      totalScore: 0
    };
  }
};

// 1. GET TOP 3 LEADERBOARD FOR A SPECIFIC REGION
router.get('/region/:regionId/top3', authenticateToken, async (req, res) => {
  try {
    const { regionId } = req.params;

    // Validate regionId format
    if (!regionId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid region ID format'
      });
    }

    // Check if region exists
    const region = await Region.findById(regionId);
    if (!region) {
      return res.status(404).json({
        success: false,
        message: 'Region not found'
      });
    }

    // Get all students in the region
    const students = await User.find({
      region: regionId,
      role: 'student',
      isActive: true
    }).select('name email profilePicture studentInfo.totalLecturesWatched');

    if (students.length === 0) {
      return res.json({
        success: true,
        message: 'No students found in this region',
        data: {
          region: {
            id: region._id,
            name: region.name,
            code: region.code
          },
          leaderboard: []
        }
      });
    }

    // Calculate scores for all students
    const leaderboardData = await Promise.all(
      students.map(async (student) => {
        const stats = await getUserStatistics(student._id);
        return {
          rank: 0, // Will be set after sorting
          student: {
            id: student._id,
            name: student.name,
            email: student.email,
            profilePicture: student.profilePicture
          },
          statistics: stats,
          totalScore: stats.totalScore
        };
      })
    );

    // Sort by total score (descending) and assign ranks
    leaderboardData.sort((a, b) => b.totalScore - a.totalScore);
    leaderboardData.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    // Get top 3
    const top3 = leaderboardData.slice(0, 3);

    res.json({
      success: true,
      message: 'Top 3 leaderboard retrieved successfully',
      data: {
        region: {
          id: region._id,
          name: region.name,
          code: region.code,
          description: region.description
        },
        leaderboard: top3,
        totalStudents: students.length,
        scoringMethod: {
          description: 'Equal weightage scoring',
          components: {
            lecturesWatched: '33.33%',
            gameSessions: '33.33%',
            communicationSessions: '33.34%'
          },
          formula: 'Score = (lectures * 0.3333) + (games * 0.3333) + (communication * 0.3334)'
        }
      }
    });

  } catch (error) {
    console.error('Get region leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 2. GET FULL LEADERBOARD FOR A SPECIFIC REGION
router.get('/region/:regionId', authenticateToken, async (req, res) => {
  try {
    const { regionId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Validate regionId format
    if (!regionId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid region ID format'
      });
    }

    // Check if region exists
    const region = await Region.findById(regionId);
    if (!region) {
      return res.status(404).json({
        success: false,
        message: 'Region not found'
      });
    }

    // Get all students in the region
    const students = await User.find({
      region: regionId,
      role: 'student',
      isActive: true
    }).select('name email profilePicture studentInfo.totalLecturesWatched');

    if (students.length === 0) {
      return res.json({
        success: true,
        message: 'No students found in this region',
        data: {
          region: {
            id: region._id,
            name: region.name,
            code: region.code
          },
          leaderboard: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            pages: 0
          }
        }
      });
    }

    // Calculate scores for all students
    const leaderboardData = await Promise.all(
      students.map(async (student) => {
        const stats = await getUserStatistics(student._id);
        return {
          rank: 0, // Will be set after sorting
          student: {
            id: student._id,
            name: student.name,
            email: student.email,
            profilePicture: student.profilePicture
          },
          statistics: stats,
          totalScore: stats.totalScore
        };
      })
    );

    // Sort by total score (descending) and assign ranks
    leaderboardData.sort((a, b) => b.totalScore - a.totalScore);
    leaderboardData.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    // Paginate results
    const total = leaderboardData.length;
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedLeaderboard = leaderboardData.slice(startIndex, endIndex);

    res.json({
      success: true,
      message: 'Regional leaderboard retrieved successfully',
      data: {
        region: {
          id: region._id,
          name: region.name,
          code: region.code,
          description: region.description
        },
        leaderboard: paginatedLeaderboard,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        scoringMethod: {
          description: 'Equal weightage scoring',
          components: {
            lecturesWatched: '33.33%',
            gameSessions: '33.33%',
            communicationSessions: '33.34%'
          },
          formula: 'Score = (lectures * 0.3333) + (games * 0.3333) + (communication * 0.3334)'
        }
      }
    });

  } catch (error) {
    console.error('Get full region leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 3. GET ALL REGIONS WITH TOP 3 LEADERBOARDS
router.get('/all-regions/top3', authenticateToken, async (req, res) => {
  try {
    // Get all active regions
    const regions = await Region.find({ isActive: true });

    if (regions.length === 0) {
      return res.json({
        success: true,
        message: 'No regions found',
        data: {
          regionalLeaderboards: []
        }
      });
    }

    // Get top 3 for each region
    const regionalLeaderboards = await Promise.all(
      regions.map(async (region) => {
        // Get students in this region
        const students = await User.find({
          region: region._id,
          role: 'student',
          isActive: true
        }).select('name email profilePicture studentInfo.totalLecturesWatched');

        if (students.length === 0) {
          return {
            region: {
              id: region._id,
              name: region.name,
              code: region.code,
              description: region.description
            },
            top3: [],
            totalStudents: 0
          };
        }

        // Calculate scores for all students
        const leaderboardData = await Promise.all(
          students.map(async (student) => {
            const stats = await getUserStatistics(student._id);
            return {
              rank: 0,
              student: {
                id: student._id,
                name: student.name,
                email: student.email,
                profilePicture: student.profilePicture
              },
              statistics: stats,
              totalScore: stats.totalScore
            };
          })
        );

        // Sort and get top 3
        leaderboardData.sort((a, b) => b.totalScore - a.totalScore);
        leaderboardData.forEach((entry, index) => {
          entry.rank = index + 1;
        });

        const top3 = leaderboardData.slice(0, 3);

        return {
          region: {
            id: region._id,
            name: region.name,
            code: region.code,
            description: region.description
          },
          top3,
          totalStudents: students.length
        };
      })
    );

    res.json({
      success: true,
      message: 'All regional leaderboards retrieved successfully',
      data: {
        regionalLeaderboards,
        totalRegions: regions.length,
        scoringMethod: {
          description: 'Equal weightage scoring',
          components: {
            lecturesWatched: '33.33%',
            gameSessions: '33.33%',
            communicationSessions: '33.34%'
          },
          formula: 'Score = (lectures * 0.3333) + (games * 0.3333) + (communication * 0.3334)'
        }
      }
    });

  } catch (error) {
    console.error('Get all regions leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 4. GET USER'S RANK IN THEIR REGION
router.get('/my-rank', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('region', 'name code description')
      .select('name email profilePicture role region studentInfo.totalLecturesWatched');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role !== 'student') {
      return res.status(400).json({
        success: false,
        message: 'Only students can have leaderboard ranks'
      });
    }

    if (!user.region) {
      return res.status(400).json({
        success: false,
        message: 'User is not assigned to any region'
      });
    }

    // Get all students in the same region
    const students = await User.find({
      region: user.region._id,
      role: 'student',
      isActive: true
    }).select('name email profilePicture studentInfo.totalLecturesWatched');

    // Calculate scores for all students
    const leaderboardData = await Promise.all(
      students.map(async (student) => {
        const stats = await getUserStatistics(student._id);
        return {
          studentId: student._id.toString(),
          student: {
            id: student._id,
            name: student.name,
            email: student.email,
            profilePicture: student.profilePicture
          },
          statistics: stats,
          totalScore: stats.totalScore
        };
      })
    );

    // Sort by total score (descending) and assign ranks
    leaderboardData.sort((a, b) => b.totalScore - a.totalScore);
    leaderboardData.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    // Find current user's rank
    const userRankData = leaderboardData.find(entry => 
      entry.studentId === req.user._id.toString()
    );

    if (!userRankData) {
      return res.status(404).json({
        success: false,
        message: 'User rank not found'
      });
    }

    res.json({
      success: true,
      message: 'User rank retrieved successfully',
      data: {
        user: userRankData,
        region: {
          id: user.region._id,
          name: user.region.name,
          code: user.region.code,
          description: user.region.description
        },
        totalStudents: students.length,
        scoringMethod: {
          description: 'Equal weightage scoring',
          components: {
            lecturesWatched: '33.33%',
            gameSessions: '33.33%',
            communicationSessions: '33.34%'
          },
          formula: 'Score = (lectures * 0.3333) + (games * 0.3333) + (communication * 0.3334)'
        }
      }
    });

  } catch (error) {
    console.error('Get user rank error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 5. GET LEADERBOARD STATISTICS (Admin only)
router.get('/statistics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Get all regions
    const regions = await Region.find({ isActive: true });
    
    // Get statistics for each region
    const regionStatistics = await Promise.all(
      regions.map(async (region) => {
        const students = await User.find({
          region: region._id,
          role: 'student',
          isActive: true
        });

        if (students.length === 0) {
          return {
            region: {
              id: region._id,
              name: region.name,
              code: region.code
            },
            totalStudents: 0,
            averageScore: 0,
            topScore: 0,
            statistics: {
              averageLectures: 0,
              averageGames: 0,
              averageCommunication: 0
            }
          };
        }

        // Calculate statistics for all students in this region
        const studentStats = await Promise.all(
          students.map(async (student) => {
            return await getUserStatistics(student._id);
          })
        );

        const totalLectures = studentStats.reduce((sum, stat) => sum + stat.lecturesWatched, 0);
        const totalGames = studentStats.reduce((sum, stat) => sum + stat.gameSessions, 0);
        const totalCommunication = studentStats.reduce((sum, stat) => sum + stat.communicationSessions, 0);
        const totalScores = studentStats.reduce((sum, stat) => sum + stat.totalScore, 0);

        const averageScore = Math.round((totalScores / students.length) * 100) / 100;
        const topScore = Math.max(...studentStats.map(stat => stat.totalScore));

        return {
          region: {
            id: region._id,
            name: region.name,
            code: region.code
          },
          totalStudents: students.length,
          averageScore,
          topScore,
          statistics: {
            averageLectures: Math.round((totalLectures / students.length) * 100) / 100,
            averageGames: Math.round((totalGames / students.length) * 100) / 100,
            averageCommunication: Math.round((totalCommunication / students.length) * 100) / 100
          }
        };
      })
    );

    // Overall statistics
    const totalStudents = regionStatistics.reduce((sum, region) => sum + region.totalStudents, 0);
    const overallAverageScore = regionStatistics.length > 0 ? 
      Math.round((regionStatistics.reduce((sum, region) => sum + (region.averageScore * region.totalStudents), 0) / totalStudents) * 100) / 100 : 0;

    res.json({
      success: true,
      message: 'Leaderboard statistics retrieved successfully',
      data: {
        overall: {
          totalRegions: regions.length,
          totalStudents,
          averageScore: overallAverageScore
        },
        regionStatistics,
        scoringMethod: {
          description: 'Equal weightage scoring',
          components: {
            lecturesWatched: '33.33%',
            gameSessions: '33.33%',
            communicationSessions: '33.34%'
          },
          formula: 'Score = (lectures * 0.3333) + (games * 0.3333) + (communication * 0.3334)'
        }
      }
    });

  } catch (error) {
    console.error('Get leaderboard statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 6. UPDATE USER ACTIVITY (Internal endpoint for updating statistics)
router.post('/update-activity/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { activityType, increment = 1 } = req.body;

    // Validate userId format
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    // Validate activity type
    if (!['lectures', 'games', 'communication'].includes(activityType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid activity type. Must be: lectures, games, or communication'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role !== 'student') {
      return res.status(400).json({
        success: false,
        message: 'Activity tracking is only for students'
      });
    }

    // Update the appropriate activity count
    switch (activityType) {
      case 'lectures':
        user.studentInfo.totalLecturesWatched += increment;
        break;
      case 'games':
        user.studentInfo.totalGamesPlayed += increment;
        break;
      case 'communication':
        user.studentInfo.totalSessions += increment;
        break;
    }

    await user.save();

    // Get updated statistics
    const updatedStats = await getUserStatistics(userId);

    res.json({
      success: true,
      message: 'User activity updated successfully',
      data: {
        userId,
        activityType,
        increment,
        updatedStatistics: updatedStats
      }
    });

  } catch (error) {
    console.error('Update user activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
