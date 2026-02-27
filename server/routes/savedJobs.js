// routes/savedJobs.js - Routes for saved jobs functionality
const express = require('express');
const router = express.Router();
const {
  saveJob,
  unsaveJob,
  getSavedJobs,
  getSavedJobById,
  updateSavedJob,
  getSavedJobsAnalytics,
  bulkOperationSavedJobs
} = require('../controllers/savedJobController');

const { protect, authorize } = require('../middleware/auth');

// ============================================================================
// SAVED JOBS ROUTES
// ============================================================================

// @desc    Get all saved jobs for the authenticated user
// @route   GET /api/saved-jobs
// @access  Private (Job seekers only)
router.get('/', protect, authorize('jobseeker'), getSavedJobs);

// @desc    Save a job
// @route   POST /api/saved-jobs/:jobId
// @access  Private (Job seekers only)
router.post('/:jobId', protect, authorize('jobseeker'), saveJob);

// @desc    Remove job from saved list
// @route   DELETE /api/saved-jobs/:jobId
// @access  Private (Job seekers only)
router.delete('/:jobId', protect, authorize('jobseeker'), unsaveJob);

// @desc    Get specific saved job details
// @route   GET /api/saved-jobs/:jobId/details
// @access  Private (Job seekers only)
router.get('/:jobId/details', protect, authorize('jobseeker'), getSavedJobById);

// @desc    Update saved job details (notes, tags, priority, etc.)
// @route   PUT /api/saved-jobs/:jobId
// @access  Private (Job seekers only)
router.put('/:jobId', protect, authorize('jobseeker'), updateSavedJob);

// @desc    Get saved jobs analytics
// @route   GET /api/saved-jobs/analytics/overview
// @access  Private (Job seekers only)
router.get('/analytics/overview', protect, authorize('jobseeker'), getSavedJobsAnalytics);

// @desc    Bulk operations on saved jobs
// @route   POST /api/saved-jobs/bulk
// @access  Private (Job seekers only)
router.post('/bulk', protect, authorize('jobseeker'), bulkOperationSavedJobs);

// @desc    Get saved jobs by priority
// @route   GET /api/saved-jobs/priority/:priority
// @access  Private (Job seekers only)
router.get('/priority/:priority', protect, authorize('jobseeker'), async (req, res) => {
  try {
    const { priority } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    if (!['low', 'medium', 'high'].includes(priority)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid priority level'
      });
    }

    const SavedJob = require('../models/SavedJob');
    const result = await SavedJob.getUserSavedJobsWithAnalytics(req.user.id, {
      page: parseInt(page),
      limit: parseInt(limit),
      priority: priority,
      sortBy: 'savedAt'
    });

    res.status(200).json({
      success: true,
      count: result.savedJobs.length,
      pagination: result.pagination,
      data: result.savedJobs
    });

  } catch (error) {
    console.error('Get saved jobs by priority error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching saved jobs by priority',
      error: error.message
    });
  }
});

// @desc    Get saved jobs by application status
// @route   GET /api/saved-jobs/status/:status
// @access  Private (Job seekers only)
router.get('/status/:status', protect, authorize('jobseeker'), async (req, res) => {
  try {
    const { status } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const validStatuses = ['not_applied', 'planning_to_apply', 'applied', 'interview', 'rejected', 'offered'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid application status'
      });
    }

    const SavedJob = require('../models/SavedJob');
    const result = await SavedJob.getUserSavedJobsWithAnalytics(req.user.id, {
      page: parseInt(page),
      limit: parseInt(limit),
      status: status,
      sortBy: 'savedAt'
    });

    res.status(200).json({
      success: true,
      count: result.savedJobs.length,
      pagination: result.pagination,
      data: result.savedJobs
    });

  } catch (error) {
    console.error('Get saved jobs by status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching saved jobs by status',
      error: error.message
    });
  }
});

// @desc    Get saved jobs with upcoming deadlines
// @route   GET /api/saved-jobs/deadlines/upcoming
// @access  Private (Job seekers only)
router.get('/deadlines/upcoming', protect, authorize('jobseeker'), async (req, res) => {
  try {
    const { days = 7 } = req.query; // Default to next 7 days
    const SavedJob = require('../models/SavedJob');
    
    const upcomingDeadlines = await SavedJob.aggregate([
      { $match: { user: req.user.id } },
      {
        $lookup: {
          from: 'jobs',
          localField: 'job',
          foreignField: '_id',
          as: 'jobDetails'
        }
      },
      { $unwind: '$jobDetails' },
      {
        $match: {
          'jobDetails.applicationDeadline': {
            $gte: new Date(),
            $lte: new Date(Date.now() + parseInt(days) * 24 * 60 * 60 * 1000)
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'jobDetails.employer',
          foreignField: '_id',
          as: 'employer'
        }
      },
      { $unwind: '$employer' },
      {
        $project: {
          jobTitle: '$jobDetails.title',
          company: '$jobDetails.company',
          employer: '$employer',
          deadline: '$jobDetails.applicationDeadline',
          applicationStatus: 1,
          priority: 1,
          notes: 1,
          tags: 1,
          savedAt: 1,
          daysLeft: {
            $ceil: {
              $divide: [
                { $subtract: ['$jobDetails.applicationDeadline', new Date()] },
                1000 * 60 * 60 * 24
              ]
            }
          }
        }
      },
      { $sort: { deadline: 1 } }
    ]);

    res.status(200).json({
      success: true,
      count: upcomingDeadlines.length,
      data: upcomingDeadlines
    });

  } catch (error) {
    console.error('Get upcoming deadlines error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching upcoming deadlines',
      error: error.message
    });
  }
});

// @desc    Search saved jobs
// @route   GET /api/saved-jobs/search
// @access  Private (Job seekers only)
router.get('/search', protect, authorize('jobseeker'), async (req, res) => {
  try {
    const { q, tags, priority, status, sortBy = 'savedAt', page = 1, limit = 10 } = req.query;
    
    const SavedJob = require('../models/SavedJob');
    let pipeline = [
      { $match: { user: req.user.id } }
    ];

    // Add search query if provided
    if (q) {
      pipeline.push({
        $lookup: {
          from: 'jobs',
          localField: 'job',
          foreignField: '_id',
          as: 'jobDetails'
        }
      });
      pipeline.push({ $unwind: '$jobDetails' });
      pipeline.push({
        $match: {
          $or: [
            { 'jobDetails.title': { $regex: q, $options: 'i' } },
            { 'jobDetails.company': { $regex: q, $options: 'i' } },
            { 'jobDetails.description': { $regex: q, $options: 'i' } },
            { notes: { $regex: q, $options: 'i' } }
          ]
        }
      });
    }

    // Add filters
    let matchConditions = {};
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      matchConditions.tags = { $in: tagArray };
    }
    if (priority) matchConditions.priority = priority;
    if (status) matchConditions.applicationStatus = status;
    
    if (Object.keys(matchConditions).length > 0) {
      pipeline.push({ $match: matchConditions });
    }

    // Add lookup for job details if not already added
    if (!q) {
      pipeline.push({
        $lookup: {
          from: 'jobs',
          localField: 'job',
          foreignField: '_id',
          as: 'jobDetails'
        }
      });
      pipeline.push({ $unwind: '$jobDetails' });
    }

    // Add lookup for employer details
    pipeline.push({
      $lookup: {
        from: 'users',
        localField: 'jobDetails.employer',
        foreignField: '_id',
        as: 'employer'
      }
    });
    pipeline.push({ $unwind: '$employer' });

    // Sort
    let sortOptions = {};
    switch (sortBy) {
      case 'priority':
        sortOptions = { priority: -1, savedAt: -1 };
        break;
      case 'deadline':
        sortOptions = { 'jobDetails.applicationDeadline': 1 };
        break;
      case 'company':
        sortOptions = { 'jobDetails.company': 1 };
        break;
      case 'title':
        sortOptions = { 'jobDetails.title': 1 };
        break;
      default:
        sortOptions = { savedAt: -1 };
    }
    pipeline.push({ $sort: sortOptions });

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: parseInt(limit) });

    const savedJobs = await SavedJob.aggregate(pipeline);

    // Get total count for pagination
    const countPipeline = pipeline.slice(0, -2); // Remove skip and limit
    countPipeline.push({ $count: 'total' });
    const countResult = await SavedJob.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    res.status(200).json({
      success: true,
      count: savedJobs.length,
      total,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      },
      data: savedJobs
    });

  } catch (error) {
    console.error('Search saved jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching saved jobs',
      error: error.message
    });
  }
});

// @desc    Export saved jobs to CSV
// @route   GET /api/saved-jobs/export/csv
// @access  Private (Job seekers only)
router.get('/export/csv', protect, authorize('jobseeker'), async (req, res) => {
  try {
    const SavedJob = require('../models/SavedJob');
    
    const savedJobs = await SavedJob.find({ user: req.user.id })
      .populate({
        path: 'job',
        populate: {
          path: 'employer',
          select: 'name companyName'
        }
      })
      .sort({ savedAt: -1 });

    // Convert to CSV format
    const csvHeader = 'Job Title,Company,Location,Salary,Job Type,Experience,Saved Date,Priority,Application Status,Notes,Tags\n';
    
    const csvRows = savedJobs.map(savedJob => {
      const job = savedJob.job;
      const company = job.employer?.companyName || job.company || '';
      const salary = job.salary?.min ? `$${job.salary.min}${job.salary.max ? `-$${job.salary.max}` : '+'}` : '';
      const savedDate = new Date(savedJob.savedAt).toLocaleDateString();
      const tags = savedJob.tags ? savedJob.tags.join('; ') : '';
      const notes = savedJob.notes ? savedJob.notes.replace(/"/g, '""') : '';
      
      return `"${job.title}","${company}","${job.location}","${salary}","${job.jobType}","${job.experience}","${savedDate}","${savedJob.priority}","${savedJob.applicationStatus}","${notes}","${tags}"`;
    }).join('\n');

    const csvContent = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="saved_jobs.csv"');
    res.send(csvContent);

  } catch (error) {
    console.error('Export saved jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting saved jobs',
      error: error.message
    });
  }
});

// @desc    Get saved jobs statistics
// @route   GET /api/saved-jobs/stats
// @access  Private (Job seekers only)
router.get('/stats', protect, authorize('jobseeker'), async (req, res) => {
  try {
    const SavedJob = require('../models/SavedJob');
    
    const stats = await SavedJob.aggregate([
      { $match: { user: req.user.id } },
      {
        $group: {
          _id: null,
          totalSaved: { $sum: 1 },
          highPriority: {
            $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] }
          },
          mediumPriority: {
            $sum: { $cond: [{ $eq: ['$priority', 'medium'] }, 1, 0] }
          },
          lowPriority: {
            $sum: { $cond: [{ $eq: ['$priority', 'low'] }, 1, 0] }
          },
          notApplied: {
            $sum: { $cond: [{ $eq: ['$applicationStatus', 'not_applied'] }, 1, 0] }
          },
          planningToApply: {
            $sum: { $cond: [{ $eq: ['$applicationStatus', 'planning_to_apply'] }, 1, 0] }
          },
          applied: {
            $sum: { $cond: [{ $eq: ['$applicationStatus', 'applied'] }, 1, 0] }
          },
          interview: {
            $sum: { $cond: [{ $eq: ['$applicationStatus', 'interview'] }, 1, 0] }
          },
          offered: {
            $sum: { $cond: [{ $eq: ['$applicationStatus', 'offered'] }, 1, 0] }
          },
          rejected: {
            $sum: { $cond: [{ $eq: ['$applicationStatus', 'rejected'] }, 1, 0] }
          }
        }
      }
    ]);

    // Get most recent saves
    const recentSaves = await SavedJob.find({ user: req.user.id })
      .populate('job', 'title company')
      .sort({ savedAt: -1 })
      .limit(5);

    // Get most used tags
    const tagStats = await SavedJob.aggregate([
      { $match: { user: req.user.id } },
      { $unwind: '$tags' },
      {
        $group: {
          _id: '$tags',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: stats[0] || {
          totalSaved: 0,
          highPriority: 0,
          mediumPriority: 0,
          lowPriority: 0,
          notApplied: 0,
          planningToApply: 0,
          applied: 0,
          interview: 0,
          offered: 0,
          rejected: 0
        },
        recentSaves,
        popularTags: tagStats
      }
    });

  } catch (error) {
    console.error('Get saved jobs stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching saved jobs statistics',
      error: error.message
    });
  }
});

module.exports = router;