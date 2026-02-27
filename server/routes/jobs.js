// routes/jobs.js - FIXED Complete Job Portal Routes with AI Recommendations
const express = require('express');
const router = express.Router();

// Import controllers
const jobController = require('../controllers/jobController');
const enhancedJobController = require('../controllers/enhancedJobController');
const savedJobController = require('../controllers/savedJobController');

// Import middleware
const { protect, authorize } = require('../middleware/auth');

// Simple rate limiting middleware
const rateLimit = (maxRequests, windowMs) => {
  const requests = new Map();
  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!requests.has(key)) {
      requests.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    const limit = requests.get(key);
    if (now > limit.resetTime) {
      requests.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    if (limit.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later'
      });
    }
    
    limit.count++;
    next();
  };
};

// Activity logger middleware
const logActivity = (activityType) => {
  return (req, res, next) => {
    console.log(`📊 Activity: ${activityType} by user ${req.user?.id || 'anonymous'}`);
    next();
  };
};

// ==========================================
// AI-POWERED RECOMMENDATION ROUTES - FIXED
// ==========================================

// AI-powered job recommendations (Enhanced)
router.get('/ai/recommendations', 
  protect, 
  authorize('jobseeker'), 
  rateLimit(30, 60 * 1000), // 30 requests per minute
  logActivity('ai_recommendation_view'),
  enhancedJobController.getAIRecommendations
);

// Predict job salary using AI
router.post('/ai/predict-salary',
  protect,
  rateLimit(20, 60 * 1000), // 20 predictions per minute
  logActivity('salary_prediction'),
  enhancedJobController.predictJobSalary
);

// Get enhanced market insights with AI
router.get('/ai/market-insights',
  protect,
  authorize('jobseeker'),
  rateLimit(15, 60 * 1000), // 15 requests per minute
  logActivity('market_insights_view'),
  enhancedJobController.getEnhancedMarketInsights
);

// Get AI-powered trending jobs
router.get('/ai/trending',
  rateLimit(20, 60 * 1000), // 20 requests per minute
  logActivity('ai_trending_view'),
  enhancedJobController.getAITrendingJobs
);

// Track job interactions for AI learning
router.post('/ai/track/:jobId',
  protect,
  authorize('jobseeker'),
  rateLimit(100, 60 * 1000), // 100 interactions per minute
  enhancedJobController.trackJobInteraction
);

// AI model health check (Admin only)
router.get('/ai/status',
  protect,
  authorize('admin'),
  enhancedJobController.getAIModelStatus
);

// ==========================================
// PUBLIC JOB SEARCH & DISCOVERY ROUTES
// ==========================================

// Get all jobs with advanced filtering (Public access)
router.get('/', 
  logActivity('jobs_browse'), 
  jobController.getJobs
);

// Enhanced natural language search
router.get('/search/nlp', 
  rateLimit(50, 60 * 1000), // 50 searches per minute
  logActivity('nlp_search'),
  jobController.searchJobsWithNLP
);

// Get intelligent search suggestions
router.get('/search/suggestions', 
  rateLimit(100, 60 * 1000), // 100 suggestions per minute
  jobController.getSearchSuggestions
);

// Get trending jobs
router.get('/trending',
  rateLimit(30, 60 * 1000),
  logActivity('trending_jobs'),
  jobController.getTrendingJobs
);

// Get job analytics (public statistics)
router.get('/analytics',
  rateLimit(20, 60 * 1000),
  logActivity('job_analytics'),
  jobController.getJobAnalytics
);

// ==========================================
// JOB SEEKER SPECIFIC ROUTES - FIXED
// ==========================================

// Get job recommendations for job seeker - FIXED
router.get('/recommendations',
  protect,
  authorize('jobseeker'),
  rateLimit(20, 60 * 1000),
  logActivity('job_recommendations'),
  async (req, res) => {
    try {
      const { limit = 10, excludeApplied = true } = req.query;
      const User = require('../models/User');
      
      console.log('🎯 Getting recommendations for user:', req.user.id);
      
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      console.log('👤 User profile check:', {
        hasSkills: !!(user.skills && user.skills.length > 0),
        skillsCount: user.skills?.length || 0,
        hasLocation: !!user.location,
        hasPreferences: !!user.preferences,
        experienceLevel: user.inferredExperienceLevel
      });

      // FIXED: More lenient profile requirements
      const hasBasicProfile = (
        user.location || 
        (user.skills && user.skills.length > 0) || 
        (user.preferences && (
          user.preferences.industries?.length > 0 ||
          user.preferences.jobTypes?.length > 0 ||
          user.preferences.preferredLocations?.length > 0
        )) ||
        user.inferredExperienceLevel
      );

      if (!hasBasicProfile) {
        console.log('⚠️ Basic profile missing, providing general recommendations');
        
        // Provide general recommendations instead of rejecting
        const Job = require('../models/Job');
        const generalJobs = await Job.find({ status: 'active' })
          .populate('employer', 'companyName companyLogo')
          .sort({ viewCount: -1, createdAt: -1 })
          .limit(parseInt(limit));

        const recommendations = generalJobs.map(job => ({
          ...job.toObject(),
          recommendationScore: 60,
          matchingReasons: ['Popular job', 'Recently posted']
        }));

        return res.status(200).json({
          success: true,
          count: recommendations.length,
          data: recommendations,
          userProfile: {
            skills: user.skills || [],
            location: user.location,
            experienceLevel: user.inferredExperienceLevel,
            preferences: user.preferences,
            profileCompleteness: user.profileCompleteness || 0
          },
          message: 'General recommendations provided. Complete your profile for better matches.',
          suggestions: [
            'Add at least 3 relevant skills to your profile',
            'Set your preferred job types and industries',
            'Complete your work experience section',
            'Set your location preferences'
          ]
        });
      }

      // Get personalized recommendations using the model method
      let recommendations = [];
      try {
        recommendations = await user.getPersonalizedRecommendations(parseInt(limit));
        console.log(`✅ Generated ${recommendations.length} personalized recommendations`);
      } catch (recError) {
        console.error('❌ Personalized recommendations failed:', recError);
        
        // Fallback to basic job query
        const Job = require('../models/Job');
        const fallbackJobs = await Job.find({ status: 'active' })
          .populate('employer', 'companyName companyLogo')
          .sort({ createdAt: -1 })
          .limit(parseInt(limit));

        recommendations = fallbackJobs.map(job => ({
          ...job.toObject(),
          recommendationScore: 50,
          matchingReasons: ['Recently posted']
        }));
      }

      res.status(200).json({
        success: true,
        count: recommendations.length,
        data: recommendations,
        userProfile: {
          skills: user.skills || [],
          location: user.location,
          experienceLevel: user.inferredExperienceLevel,
          preferences: user.preferences,
          profileCompleteness: user.profileCompleteness || 0
        }
      });

    } catch (error) {
      console.error('❌ Job Recommendations Error:', error);
      res.status(500).json({
        success: false,
        message: 'Error generating recommendations',
        error: error.message
      });
    }
  }
);

// Get user's saved jobs
router.get('/saved', 
  protect, 
  authorize('jobseeker'),
  logActivity('saved_jobs_view'),
  savedJobController.getSavedJobs
);

// Save a job
router.post('/saved/:id', 
  protect, 
  authorize('jobseeker'),
  rateLimit(50, 60 * 1000),
  logActivity('job_save'),
  savedJobController.saveJob
);

// Remove job from saved list
router.delete('/saved/:id', 
  protect, 
  authorize('jobseeker'),
  logActivity('job_unsave'),
  savedJobController.unsaveJob
);

// Check if job is saved by user
router.get('/saved/:id/check', 
  protect, 
  authorize('jobseeker'),
  savedJobController.checkJobSaved
);

// Get job preferences for jobseeker
router.get('/preferences', 
  protect, 
  authorize('jobseeker'),
  async (req, res) => {
    try {
      const User = require('../models/User');
      console.log('🔧 Getting job preferences for user:', req.user.id);
      
      const user = await User.findById(req.user.id).select('preferences');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.status(200).json({
        success: true,
        data: user.preferences || {}
      });
    } catch (err) {
      console.error('❌ Get job preferences error:', err);
      res.status(500).json({
        success: false,
        message: 'Server Error',
        error: err.message
      });
    }
  }
);

// Update job preferences for jobseeker
router.put('/preferences', 
  protect, 
  authorize('jobseeker'),
  async (req, res) => {
    try {
      const User = require('../models/User');
      console.log('🔧 Updating job preferences for user:', req.user.id);

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Initialize preferences if not exists
      if (!user.preferences) {
        user.preferences = {};
      }

      // Update preferences from request body
      const updates = req.body;
      
      // Handle array fields
      const arrayFields = ['jobTypes', 'preferredLocations', 'industries', 'workEnvironment', 'companySize', 'benefits', 'preferredTechnologies', 'avoidKeywords', 'preferredContactMethods'];
      arrayFields.forEach(field => {
        if (updates[field] !== undefined) {
          user.preferences[field] = Array.isArray(updates[field]) ? updates[field] : [];
        }
      });

      // Handle boolean fields
      const booleanFields = ['remoteWork', 'emailNotifications', 'smsNotifications', 'jobAlerts', 'marketingEmails'];
      booleanFields.forEach(field => {
        if (updates[field] !== undefined) {
          user.preferences[field] = Boolean(updates[field]);
        }
      });

      // Handle string fields
      const stringFields = ['experienceLevel', 'travelWillingness', 'jobSearchUrgency'];
      stringFields.forEach(field => {
        if (updates[field] !== undefined && updates[field].trim() !== '') {
          user.preferences[field] = updates[field];
        }
      });

      // Handle nested objects
      if (updates.salaryRange && typeof updates.salaryRange === 'object') {
        if (!user.preferences.salaryRange) user.preferences.salaryRange = {};
        
        if (updates.salaryRange.min !== undefined) {
          const minSalary = parseInt(updates.salaryRange.min);
          user.preferences.salaryRange.min = !isNaN(minSalary) && minSalary > 0 ? minSalary : undefined;
        }
        if (updates.salaryRange.max !== undefined) {
          const maxSalary = parseInt(updates.salaryRange.max);
          user.preferences.salaryRange.max = !isNaN(maxSalary) && maxSalary > 0 ? maxSalary : undefined;
        }
        if (updates.salaryRange.currency !== undefined) user.preferences.salaryRange.currency = updates.salaryRange.currency || 'USD';
        if (updates.salaryRange.negotiable !== undefined) user.preferences.salaryRange.negotiable = Boolean(updates.salaryRange.negotiable);
      }

      // Handle career goals
      if (updates.careerGoals && typeof updates.careerGoals === 'object') {
        if (!user.preferences.careerGoals) user.preferences.careerGoals = {};
        if (updates.careerGoals.shortTerm !== undefined) user.preferences.careerGoals.shortTerm = updates.careerGoals.shortTerm || '';
        if (updates.careerGoals.longTerm !== undefined) user.preferences.careerGoals.longTerm = updates.careerGoals.longTerm || '';
      }

      // Handle work-life balance
      if (updates.workLifeBalance && typeof updates.workLifeBalance === 'object') {
        if (!user.preferences.workLifeBalance) user.preferences.workLifeBalance = {};
        if (updates.workLifeBalance.importance !== undefined) {
          const importance = parseInt(updates.workLifeBalance.importance);
          user.preferences.workLifeBalance.importance = !isNaN(importance) && importance >= 1 && importance <= 5 ? importance : 3;
        }
        if (updates.workLifeBalance.maxHoursPerWeek !== undefined) {
          const maxHours = parseInt(updates.workLifeBalance.maxHoursPerWeek);
          user.preferences.workLifeBalance.maxHoursPerWeek = !isNaN(maxHours) && maxHours > 0 ? maxHours : undefined;
        }
        if (updates.workLifeBalance.flexibleSchedule !== undefined) user.preferences.workLifeBalance.flexibleSchedule = Boolean(updates.workLifeBalance.flexibleSchedule);
        if (updates.workLifeBalance.overtimeAcceptable !== undefined) user.preferences.workLifeBalance.overtimeAcceptable = Boolean(updates.workLifeBalance.overtimeAcceptable);
      }

      // Handle availability
      if (updates.availability && typeof updates.availability === 'object') {
        if (!user.preferences.availability) user.preferences.availability = {};
        if (updates.availability.immediateStart !== undefined) user.preferences.availability.immediateStart = Boolean(updates.availability.immediateStart);
        if (updates.availability.noticePeriod !== undefined) {
          const noticePeriod = parseInt(updates.availability.noticePeriod);
          user.preferences.availability.noticePeriod = !isNaN(noticePeriod) && noticePeriod >= 0 ? noticePeriod : 2;
        }
        if (updates.availability.preferredStartDate !== undefined) {
          try {
            user.preferences.availability.preferredStartDate = updates.availability.preferredStartDate ? new Date(updates.availability.preferredStartDate) : undefined;
          } catch (e) {
            // Invalid date, skip
          }
        }
      }

      // Handle interview preferences
      if (updates.interviewPreferences && typeof updates.interviewPreferences === 'object') {
        if (!user.preferences.interviewPreferences) user.preferences.interviewPreferences = {};
        if (updates.interviewPreferences.timeSlots !== undefined) user.preferences.interviewPreferences.timeSlots = Array.isArray(updates.interviewPreferences.timeSlots) ? updates.interviewPreferences.timeSlots : [];
        if (updates.interviewPreferences.timeZone !== undefined) user.preferences.interviewPreferences.timeZone = updates.interviewPreferences.timeZone || 'UTC';
        if (updates.interviewPreferences.virtualInterviewOk !== undefined) user.preferences.interviewPreferences.virtualInterviewOk = Boolean(updates.interviewPreferences.virtualInterviewOk);
      }

      // Update timestamp
      user.preferences.lastUpdated = new Date();

      // Save user
      const savedUser = await user.save();
      console.log('✅ Job preferences updated successfully');

      res.status(200).json({
        success: true,
        message: 'Job preferences updated successfully',
        data: {
          preferences: savedUser.preferences,
          recommendationReadiness: savedUser.recommendationReadiness || 0
        }
      });

    } catch (err) {
      console.error('❌ Update job preferences error:', err);
      
      if (err.name === 'ValidationError') {
        const errors = Object.keys(err.errors).map(key => ({
          field: key,
          message: err.errors[key].message,
          value: err.errors[key].value
        }));
        
        return res.status(400).json({
          success: false,
          message: 'Validation failed for preferences',
          errors: errors
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Server Error while updating preferences',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
      });
    }
  }
);

// ==========================================
// EMPLOYER SPECIFIC ROUTES
// ==========================================

// Get jobs posted by current employer
router.get('/employer/me', 
  protect, 
  authorize('employer'), 
  jobController.getMyJobs
);

// Get employer dashboard stats
router.get('/employer/stats',
  protect,
  authorize('employer'),
  async (req, res) => {
    try {
      const Job = require('../models/Job');
      const Application = require('../models/Application');

      // Get employer's jobs stats
      const jobStats = await Job.aggregate([
        { $match: { employer: req.user._id } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalViews: { $sum: '$viewCount' },
            totalApplications: { $sum: '$applicationCount' }
          }
        }
      ]);

      // Get recent application stats
      const recentApplications = await Application.aggregate([
        {
          $lookup: {
            from: 'jobs',
            localField: 'job',
            foreignField: '_id',
            as: 'jobInfo'
          }
        },
        { $unwind: '$jobInfo' },
        { $match: { 'jobInfo.employer': req.user._id } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      // Format stats
      const stats = {
        jobs: jobStats.reduce((acc, stat) => {
          acc[stat._id] = {
            count: stat.count,
            totalViews: stat.totalViews,
            totalApplications: stat.totalApplications
          };
          return acc;
        }, {}),
        applications: recentApplications.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        summary: {
          totalJobs: jobStats.reduce((sum, stat) => sum + stat.count, 0),
          totalViews: jobStats.reduce((sum, stat) => sum + stat.totalViews, 0),
          totalApplications: jobStats.reduce((sum, stat) => sum + stat.totalApplications, 0)
        }
      };

      res.status(200).json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Get employer stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching employer statistics',
        error: error.message
      });
    }
  }
);

// ==========================================
// CATEGORY AND LOCATION BASED ROUTES
// ==========================================

// Get jobs by category/industry
router.get('/category/:category',
  logActivity('category_browse'),
  async (req, res) => {
    try {
      const { category } = req.params;
      const { page = 1, limit = 12, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

      const Job = require('../models/Job');
      
      // Build query
      const query = { 
        status: 'active',
        industry: { $regex: category, $options: 'i' }
      };

      // Sort options
      const sort = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Execute query
      const jobs = await Job.find(query)
        .populate({
          path: 'employer',
          select: 'name companyName companyDescription companyLogo'
        })
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Job.countDocuments(query);

      res.status(200).json({
        success: true,
        count: jobs.length,
        total,
        category,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          limit: parseInt(limit)
        },
        data: jobs
      });

    } catch (error) {
      console.error('Get jobs by category error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching jobs by category',
        error: error.message
      });
    }
  }
);

// Get jobs by location
router.get('/location/:location',
  logActivity('location_browse'),
  async (req, res) => {
    try {
      const { location } = req.params;
      const { page = 1, limit = 12, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

      const Job = require('../models/Job');
      
      // Build query for location (including remote)
      let query = { status: 'active' };
      
      if (location.toLowerCase() === 'remote') {
        query.$or = [
          { isRemote: true },
          { workArrangement: 'Remote' },
          { location: { $regex: 'remote', $options: 'i' } }
        ];
      } else {
        query.location = { $regex: location, $options: 'i' };
      }

      // Sort options
      const sort = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Execute query
      const jobs = await Job.find(query)
        .populate({
          path: 'employer',
          select: 'name companyName companyDescription companyLogo'
        })
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Job.countDocuments(query);

      res.status(200).json({
        success: true,
        count: jobs.length,
        total,
        location,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          limit: parseInt(limit)
        },
        data: jobs
      });

    } catch (error) {
      console.error('Get jobs by location error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching jobs by location',
        error: error.message
      });
    }
  }
);

// ==========================================
// INDIVIDUAL JOB OPERATIONS
// ==========================================

// Get similar jobs to a specific job
router.get('/:id/similar',
  rateLimit(30, 60 * 1000),
  logActivity('similar_jobs_view'),
  async (req, res) => {
    try {
      const Job = require('../models/Job');
      const jobId = req.params.id;
      const { limit = 5 } = req.query;
      
      // Get the original job
      const originalJob = await Job.findById(jobId);
      if (!originalJob) {
        return res.status(404).json({
          success: false,
          message: 'Job not found'
        });
      }

      // Find similar jobs based on skills, industry, and experience
      const similarJobs = await Job.find({
        _id: { $ne: jobId },
        status: 'active',
        $or: [
          { industry: originalJob.industry },
          { experience: originalJob.experience },
          { skills: { $in: originalJob.skills } },
          { jobType: originalJob.jobType }
        ]
      })
      .populate('employer', 'companyName companyLogo companyDescription')
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        count: similarJobs.length,
        data: similarJobs
      });
      
    } catch (error) {
      console.error('Find similar jobs error:', error);
      res.status(500).json({
        success: false,
        message: 'Error finding similar jobs',
        error: error.message
      });
    }
  }
);

// Get single job by ID
router.get('/:id',
  logActivity('job_view'), 
  jobController.getJob
);

// Update job (employer only - own jobs)
router.put('/:id', 
  protect, 
  authorize('employer'), 
  logActivity('job_update'), 
  jobController.updateJob
);

// Delete job (employer only - own jobs)
router.delete('/:id', 
  protect, 
  authorize('employer'), 
  logActivity('job_delete'), 
  jobController.deleteJob
);

// ==========================================
// JOB CREATION ROUTE
// ==========================================

// Create new job (employer only)
router.post('/', 
  protect, 
  authorize('employer'), 
  rateLimit(10, 60 * 60 * 1000), // 10 job posts per hour
  logActivity('job_create'), 
  jobController.createJob
);

// ==========================================
// UTILITY ROUTES
// ==========================================

// Get job categories/industries
router.get('/meta/categories',
  async (req, res) => {
    try {
      const Job = require('../models/Job');
      
      const categories = await Job.aggregate([
        { $match: { status: 'active' } },
        {
          $group: {
            _id: '$industry',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]);

      res.status(200).json({
        success: true,
        data: categories.map(cat => ({
          industry: cat._id,
          jobCount: cat.count
        }))
      });

    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching job categories',
        error: error.message
      });
    }
  }
);

// Get job locations
router.get('/meta/locations',
  async (req, res) => {
    try {
      const Job = require('../models/Job');
      
      const locations = await Job.aggregate([
        { $match: { status: 'active' } },
        {
          $group: {
            _id: '$location',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 50 }
      ]);

      res.status(200).json({
        success: true,
        data: locations.map(loc => ({
          location: loc._id,
          jobCount: loc.count
        }))
      });

    } catch (error) {
      console.error('Get locations error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching job locations',
        error: error.message
      });
    }
  }
);

// Get popular skills
router.get('/meta/skills',
  async (req, res) => {
    try {
      const Job = require('../models/Job');
      
      const skills = await Job.aggregate([
        { $match: { status: 'active' } },
        { $unwind: '$skills' },
        {
          $group: {
            _id: '$skills',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 50 }
      ]);

      res.status(200).json({
        success: true,
        data: skills.map(skill => ({
          skill: skill._id,
          jobCount: skill.count
        }))
      });

    } catch (error) {
      console.error('Get skills error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching popular skills',
        error: error.message
      });
    }
  }
);

// ==========================================
// ERROR HANDLING
// ==========================================

// Handle undefined routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Job route ${req.originalUrl} not found`,
    suggestion: 'Check the API documentation',
    available_routes: [
      'GET /api/jobs - Get all jobs',
      'POST /api/jobs - Create job (employer only)',
      'GET /api/jobs/:id - Get specific job',
      'PUT /api/jobs/:id - Update job (employer only)',
      'DELETE /api/jobs/:id - Delete job (employer only)',
      'GET /api/jobs/search/nlp - Natural language search',
      'GET /api/jobs/search/suggestions - Get search suggestions',
      'GET /api/jobs/trending - Get trending jobs',
      'GET /api/jobs/analytics - Get job analytics',
      'GET /api/jobs/category/:category - Get jobs by category',
      'GET /api/jobs/location/:location - Get jobs by location',
      'GET /api/jobs/preferences - Get job preferences (jobseeker only)',
      'PUT /api/jobs/preferences - Update job preferences (jobseeker only)',
      'GET /api/jobs/recommendations - Get job recommendations (jobseeker only)',
      'GET /api/jobs/ai/recommendations - Get AI recommendations (jobseeker only)',
      'POST /api/jobs/ai/predict-salary - Predict salary with AI',
      'GET /api/jobs/ai/market-insights - Get market insights with AI',
      'GET /api/jobs/ai/trending - Get AI trending jobs',
      'POST /api/jobs/ai/track/:jobId - Track job interaction',
      'GET /api/jobs/ai/status - AI model status (admin only)',
      'GET /api/jobs/saved - Get saved jobs (jobseeker only)',
      'POST /api/jobs/saved/:id - Save job (jobseeker only)',
      'DELETE /api/jobs/saved/:id - Remove saved job (jobseeker only)',
      'GET /api/jobs/employer/me - Get employer jobs (employer only)',
      'GET /api/jobs/employer/stats - Get employer stats (employer only)',
      'GET /api/jobs/:id/similar - Get similar jobs',
      'GET /api/jobs/meta/categories - Get job categories',
      'GET /api/jobs/meta/locations - Get job locations',
      'GET /api/jobs/meta/skills - Get popular skills'
    ]
  });
});

// Global error handler for job routes
router.use((error, req, res, next) => {
  console.error('❌ Job Routes Error:', error);
  
  // Handle specific error types
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: Object.values(error.errors).map(val => val.message)
    });
  }

  if (error.name === 'CastError') {
    return res.status(404).json({
      success: false,
      message: 'Resource not found'
    });
  }

  if (error.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Duplicate field value'
    });
  }

  // AI service errors
  if (error.message.includes('AI') || error.message.includes('Python')) {
    return res.status(503).json({
      success: false,
      message: 'AI service temporarily unavailable',
      fallback: 'Using rule-based recommendations'
    });
  }

  // Default error response
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: error.stack 
    })
  });
});

module.exports = router;