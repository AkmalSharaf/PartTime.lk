// fix-routes.js - Run this script to fix all route files
const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Job Portal Route Files...\n');

// Ensure routes directory exists
if (!fs.existsSync('routes')) {
  fs.mkdirSync('routes', { recursive: true });
  console.log('📁 Created routes directory');
}

// Fix routes/auth.js
const authRoutes = `const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Routes
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);

module.exports = router;`;

// Fix routes/users.js
const userRoutes = `const express = require('express');
const router = express.Router();

const {
  getProfile,
  updateProfile,
  getUserProfile,
  addExperience,
  addEducation,
  deleteExperience,
  deleteEducation,
  updateJobPreferences,
  getJobPreferences,
  updatePreferenceCategory,
  addJobInteraction,
  getRecommendationReadiness,
  getUserAnalytics
} = require('../controllers/userController');

const {
  getCompanies,
  getCompanyById
} = require('../controllers/companyController');

const { protect, authorize } = require('../middleware/auth');

// Simple rate limiting function (fallback if middleware doesn't exist)
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

// Profile routes - specific routes first
router.route('/profile')
  .get(protect, getProfile)
  .put(protect, updateProfile);

// User analytics
router.get('/analytics', protect, getUserAnalytics);

// Job preferences routes - for job seekers only
router.route('/preferences')
  .get(protect, authorize('jobseeker'), getJobPreferences)
  .put(protect, authorize('jobseeker'), updateJobPreferences);

// Update specific preference category
router.patch('/preferences/:category', protect, authorize('jobseeker'), updatePreferenceCategory);

// Job interaction tracking for AI learning (with rate limiting)
router.post('/job-interaction', 
  protect, 
  authorize('jobseeker'), 
  rateLimit(50, 15 * 60 * 1000), // 50 interactions per 15 minutes
  addJobInteraction
);

// Recommendation readiness score
router.get('/recommendation-readiness', protect, authorize('jobseeker'), getRecommendationReadiness);

// Company routes (public access)
router.get('/companies', getCompanies);
router.get('/companies/:id', getCompanyById);

// Experience routes (job seekers only)
router.route('/experience')
  .put(protect, authorize('jobseeker'), addExperience);

router.delete('/experience/:exp_id', protect, authorize('jobseeker'), deleteExperience);

// Education routes (job seekers only)
router.route('/education')
  .put(protect, authorize('jobseeker'), addEducation);

router.delete('/education/:edu_id', protect, authorize('jobseeker'), deleteEducation);

// User profile by ID - this should be LAST since it's a catch-all parameter route
router.get('/:id', getUserProfile);

module.exports = router;`;

// Fix routes/jobs.js
const jobRoutes = `const express = require('express');
const router = express.Router();

// Import the basic job controller
const {
  getJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  getMyJobs,
  searchJobsWithNLP,
  getSearchSuggestions
} = require('../controllers/jobController');

// Import middleware
const { protect, authorize } = require('../middleware/auth');

// Simple rate limiting function
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

// Simple activity logging
const logActivity = (activityType) => {
  return (req, res, next) => {
    console.log(\`📊 Activity: \${activityType} by user \${req.user?.id || 'anonymous'}\`);
    next();
  };
};

// ==========================================
// AI-POWERED RECOMMENDATION ROUTES (Basic)
// ==========================================

// Get AI-powered job recommendations (if enhanced controller exists)
router.get('/ai/recommendations', 
  protect, 
  authorize('jobseeker'), 
  rateLimit(30, 60 * 1000),
  logActivity('ai_recommendation_view'),
  async (req, res) => {
    try {
      // Try to use enhanced controller, fallback to basic implementation
      const enhancedController = require('../controllers/enhancedJobController');
      if (enhancedController.getAIRecommendations) {
        return enhancedController.getAIRecommendations(req, res);
      }
    } catch (error) {
      console.log('Enhanced controller not available, using basic recommendations');
    }
    
    // Basic fallback implementation
    const Job = require('../models/Job');
    const User = require('../models/User');
    
    const user = await User.findById(req.user.id);
    const jobs = await Job.find({ status: 'active' })
      .populate('employer', 'companyName companyLogo')
      .limit(20)
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs,
      message: 'Basic recommendations (enhanced AI not available)'
    });
  }
);

// Get AI-powered trending jobs
router.get('/ai/trending',
  rateLimit(20, 60 * 1000),
  logActivity('ai_trending_view'),
  async (req, res) => {
    try {
      const enhancedController = require('../controllers/enhancedJobController');
      if (enhancedController.getAITrendingJobs) {
        return enhancedController.getAITrendingJobs(req, res);
      }
    } catch (error) {
      console.log('Enhanced controller not available, using basic trending');
    }
    
    // Basic fallback
    const Job = require('../models/Job');
    const trendingJobs = await Job.find({ status: 'active' })
      .populate('employer', 'companyName companyLogo')
      .sort({ viewCount: -1, applicationCount: -1 })
      .limit(20);
    
    res.status(200).json({
      success: true,
      count: trendingJobs.length,
      data: trendingJobs
    });
  }
);

// AI model health check
router.get('/ai/status',
  protect,
  authorize('admin'),
  (req, res) => {
    res.status(200).json({
      success: true,
      ai_model: {
        status: 'basic',
        version: '1.0.0',
        type: 'rule_based'
      },
      backend_status: 'healthy',
      timestamp: new Date()
    });
  }
);

// ==========================================
// SEARCH AND DISCOVERY ROUTES
// ==========================================

// Natural Language Processing search
router.get('/search/nlp', 
  rateLimit(50, 60 * 1000),
  logActivity('nlp_search'),
  searchJobsWithNLP
);

// Get search suggestions
router.get('/search/suggestions', 
  rateLimit(100, 60 * 1000),
  getSearchSuggestions
);

// ==========================================
// SAVED JOBS ROUTES
// ==========================================

// Get user's saved jobs
router.get('/saved', 
  protect, 
  authorize('jobseeker'),
  logActivity('saved_jobs_view'),
  async (req, res) => {
    try {
      const savedJobController = require('../controllers/savedJobController');
      if (savedJobController.getSavedJobs) {
        return savedJobController.getSavedJobs(req, res);
      }
    } catch (error) {
      console.log('Saved job controller not available');
    }
    
    // Basic fallback
    res.status(200).json({
      success: true,
      count: 0,
      data: [],
      message: 'Saved jobs feature not fully implemented'
    });
  }
);

// ==========================================
// EMPLOYER ROUTES
// ==========================================

// Get employer's jobs
router.get('/employer/me',
  protect,
  authorize('employer'),
  getMyJobs
);

// ==========================================
// MAIN JOB CRUD ROUTES
// ==========================================

// Get all jobs and create new job
router.route('/')
  .get(logActivity('jobs_browse'), getJobs)
  .post(
    protect, 
    authorize('employer'), 
    rateLimit(10, 60 * 60 * 1000),
    logActivity('job_create'), 
    createJob
  );

// Individual job operations
router.route('/:id')
  .get(logActivity('job_view'), getJob)
  .put(protect, authorize('employer'), logActivity('job_update'), updateJob)
  .delete(protect, authorize('employer'), logActivity('job_delete'), deleteJob);

module.exports = router;`;

// Fix routes/applications.js
const applicationRoutes = `const express = require('express');
const router = express.Router();
const {
  applyForJob,
  getApplication,
  getJobApplications,
  updateApplicationStatus,
  getMyApplications,
  withdrawApplication
} = require('../controllers/applicationController');
const { protect, authorize } = require('../middleware/auth');

// Specific routes MUST come before parameterized routes
router.get('/me', protect, authorize('jobseeker'), getMyApplications);

// Job-specific routes
router.get('/job/:jobId', protect, authorize('employer'), getJobApplications);

// Application CRUD with ID parameter - these come last
router.post('/:jobId', protect, authorize('jobseeker'), applyForJob);
router.get('/:id', protect, getApplication);
router.put('/:id', protect, authorize('employer'), updateApplicationStatus);
router.delete('/:id', protect, authorize('jobseeker'), withdrawApplication);

module.exports = router;`;

// Fix routes/upload.js
const uploadRoutes = `const express = require('express');
const router = express.Router();
const {
  uploadCV,
  uploadPhoto,
  uploadCompanyLogo,
  deleteFile,
  getUserFiles,
  testUpload
} = require('../controllers/uploadController');
const { protect, authorize } = require('../middleware/auth');

// Test route for debugging
router.post('/test', protect, testUpload);

// Get user files
router.get('/files', protect, getUserFiles);

// Upload routes - specific routes first
router.post('/cv', protect, authorize('jobseeker'), uploadCV);
router.post('/photo', protect, uploadPhoto);
router.post('/logo', protect, authorize('employer'), uploadCompanyLogo);

// Delete file route - parameterized route last
router.delete('/:type/:filename', protect, deleteFile);

module.exports = router;`;

// Fix routes/stats.js
const statsRoutes = `const express = require('express');
const router = express.Router();
const { getStats } = require('../controllers/statsController');

router.get('/', getStats);

module.exports = router;`;

// Write all route files
const routeFiles = {
  'routes/auth.js': authRoutes,
  'routes/users.js': userRoutes,
  'routes/jobs.js': jobRoutes,
  'routes/applications.js': applicationRoutes,
  'routes/upload.js': uploadRoutes,
  'routes/stats.js': statsRoutes
};

console.log('📝 Writing route files...');
Object.entries(routeFiles).forEach(([filePath, content]) => {
  try {
    fs.writeFileSync(filePath, content);
    console.log(`   ✅ Fixed ${filePath}`);
  } catch (error) {
    console.error(`   ❌ Error writing ${filePath}:`, error.message);
  }
});

// Create middleware/auth.js if it doesn't exist
const middlewareDir = 'middleware';
if (!fs.existsSync(middlewareDir)) {
  fs.mkdirSync(middlewareDir, { recursive: true });
  console.log('📁 Created middleware directory');
}

const authMiddleware = `// middleware/auth.js - Authentication and Authorization Middleware
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check for token in cookies
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // Make sure token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

      // Get user from database
      req.user = await User.findById(decoded.id);

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'No user found with this token'
        });
      }

      // Check if user is active
      if (!req.user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User account is deactivated'
        });
      }

      next();
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error in authentication'
    });
  }
};

// Authorize specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: \`User role \${req.user.role} is not authorized to access this route\`
      });
    }

    next();
  };
};`;

if (!fs.existsSync('middleware/auth.js')) {
  fs.writeFileSync('middleware/auth.js', authMiddleware);
  console.log('   ✅ Created middleware/auth.js');
}

console.log('\n🎉 All route files have been fixed!');
console.log('\n📋 Next steps:');
console.log('1. Make sure you have all the controller files');
console.log('2. Run: npm start');
console.log('3. Check that all routes load successfully');

console.log('\n🔍 If you still have issues, check that these controller files exist:');
console.log('   - controllers/authController.js');
console.log('   - controllers/userController.js');
console.log('   - controllers/jobController.js');
console.log('   - controllers/applicationController.js');
console.log('   - controllers/uploadController.js');
console.log('   - controllers/statsController.js');
console.log('   - controllers/companyController.js');
console.log('   - models/User.js');
console.log('   - models/Job.js');
console.log('   - models/Application.js');

if (require.main === module) {
  // This script is being run directly
  console.log('✅ Route files fixed successfully!');
}

module.exports = { routeFiles };