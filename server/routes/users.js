// routes/users.js - Fixed version with proper error handling and debugging
const express = require('express');
const router = express.Router();

console.log('🔄 Loading users routes...');

// Import controllers with comprehensive error handling
let userController;
let companyController;
let authMiddleware;

try {
  userController = require('../controllers/userController');
  console.log('✅ User controller loaded successfully');
} catch (error) {
  console.error('❌ Error loading user controller:', error.message);
  console.error('Stack:', error.stack);
  
  // Create fallback controller functions
  userController = {
    getProfile: (req, res) => {
      console.error('❌ User controller not available - getProfile');
      res.status(503).json({ 
        success: false, 
        message: 'User profile service unavailable', 
        error: 'Controller load error',
        debug: 'userController failed to load'
      });
    },
    updateProfile: (req, res) => {
      console.error('❌ User controller not available - updateProfile');
      res.status(503).json({ 
        success: false, 
        message: 'Profile update service unavailable', 
        error: 'Controller load error' 
      });
    },
    getUserProfile: (req, res) => {
      console.error('❌ User controller not available - getUserProfile');
      res.status(503).json({ 
        success: false, 
        message: 'User lookup service unavailable', 
        error: 'Controller load error' 
      });
    },
    addExperience: (req, res) => res.status(503).json({ success: false, message: 'Experience service unavailable' }),
    addEducation: (req, res) => res.status(503).json({ success: false, message: 'Education service unavailable' }),
    deleteExperience: (req, res) => res.status(503).json({ success: false, message: 'Experience service unavailable' }),
    deleteEducation: (req, res) => res.status(503).json({ success: false, message: 'Education service unavailable' }),
    updateJobPreferences: (req, res) => res.status(503).json({ success: false, message: 'Preferences service unavailable' }),
    getJobPreferences: (req, res) => res.status(503).json({ success: false, message: 'Preferences service unavailable' }),
    updatePreferenceCategory: (req, res) => res.status(503).json({ success: false, message: 'Preferences service unavailable' }),
    addJobInteraction: (req, res) => res.status(503).json({ success: false, message: 'Interaction service unavailable' }),
    getRecommendationReadiness: (req, res) => res.status(503).json({ success: false, message: 'Recommendation service unavailable' }),
    getUserAnalytics: (req, res) => res.status(503).json({ success: false, message: 'Analytics service unavailable' })
  };
}

try {
  companyController = require('../controllers/companyController');
  console.log('✅ Company controller loaded successfully');
} catch (error) {
  console.error('❌ Error loading company controller:', error.message);
  
  // Create fallback company controller functions
  companyController = {
    getCompanies: (req, res) => {
      console.error('❌ Company controller not available - getCompanies');
      res.status(503).json({ 
        success: false, 
        message: 'Company listing service unavailable', 
        error: 'Controller load error' 
      });
    },
    getCompanyById: (req, res) => {
      console.error('❌ Company controller not available - getCompanyById');
      res.status(503).json({ 
        success: false, 
        message: 'Company lookup service unavailable', 
        error: 'Controller load error' 
      });
    }
  };
}

try {
  authMiddleware = require('../middleware/auth');
  console.log('✅ Auth middleware loaded successfully');
} catch (error) {
  console.error('❌ Error loading auth middleware:', error.message);
  
  // Create fallback auth middleware
  authMiddleware = {
    protect: (req, res, next) => {
      console.error('❌ Auth middleware not available - protect');
      res.status(503).json({ 
        success: false, 
        message: 'Authentication service unavailable', 
        error: 'Middleware load error' 
      });
    },
    authorize: (roles) => (req, res, next) => {
      console.error('❌ Auth middleware not available - authorize');
      res.status(503).json({ 
        success: false, 
        message: 'Authorization service unavailable', 
        error: 'Middleware load error' 
      });
    }
  };
}

const { protect, authorize } = authMiddleware;

// Simple rate limiting function (fallback implementation)
const rateLimit = (maxRequests, windowMs) => {
  const requests = new Map();
  return (req, res, next) => {
    try {
      const key = req.ip || req.connection.remoteAddress || 'unknown';
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
    } catch (error) {
      console.error('Rate limit error:', error);
      next(); // Continue on rate limit error
    }
  };
};

// Debug middleware to log all requests to this router
router.use((req, res, next) => {
  console.log(`📊 Users Route: ${req.method} ${req.path}`);
  console.log(`   Headers: ${JSON.stringify(req.headers.authorization ? 'Bearer [token]' : 'No auth')}`);
  console.log(`   User: ${req.user ? req.user.id : 'Not authenticated'}`);
  next();
});

// Health check for users routes
router.get('/health', (req, res) => {
  console.log('🏥 Users health check requested');
  res.status(200).json({
    success: true,
    message: 'Users routes are healthy',
    timestamp: new Date().toISOString(),
    controllers: {
      userController: !!userController,
      companyController: !!companyController
    },
    middleware: {
      auth: !!authMiddleware
    }
  });
});

// Wrap route handlers with error handling
const wrapAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Profile routes - specific routes first
router.route('/profile')
  .get(protect, wrapAsync(async (req, res) => {
    console.log('📊 GET /profile requested by user:', req.user?.id);
    try {
      await userController.getProfile(req, res);
    } catch (error) {
      console.error('❌ Profile get error:', error);
      res.status(500).json({
        success: false,
        message: 'Profile fetch failed',
        error: error.message
      });
    }
  }))
  .put(protect, wrapAsync(async (req, res) => {
    console.log('📊 PUT /profile requested by user:', req.user?.id);
    try {
      await userController.updateProfile(req, res);
    } catch (error) {
      console.error('❌ Profile update error:', error);
      res.status(500).json({
        success: false,
        message: 'Profile update failed',
        error: error.message
      });
    }
  }));

// User analytics
router.get('/analytics', protect, wrapAsync(async (req, res) => {
  console.log('📊 GET /analytics requested by user:', req.user?.id);
  try {
    await userController.getUserAnalytics(req, res);
  } catch (error) {
    console.error('❌ Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Analytics fetch failed',
      error: error.message
    });
  }
}));

// Job preferences routes - for job seekers only
router.route('/preferences')
  .get(protect, authorize('jobseeker'), wrapAsync(async (req, res) => {
    console.log('📊 GET /preferences requested by user:', req.user?.id);
    try {
      await userController.getJobPreferences(req, res);
    } catch (error) {
      console.error('❌ Preferences get error:', error);
      res.status(500).json({
        success: false,
        message: 'Preferences fetch failed',
        error: error.message
      });
    }
  }))
  .put(protect, authorize('jobseeker'), wrapAsync(async (req, res) => {
    console.log('📊 PUT /preferences requested by user:', req.user?.id);
    try {
      await userController.updateJobPreferences(req, res);
    } catch (error) {
      console.error('❌ Preferences update error:', error);
      res.status(500).json({
        success: false,
        message: 'Preferences update failed',
        error: error.message
      });
    }
  }));

// Update specific preference category
router.patch('/preferences/:category', protect, authorize('jobseeker'), wrapAsync(async (req, res) => {
  console.log('📊 PATCH /preferences/:category requested by user:', req.user?.id);
  try {
    await userController.updatePreferenceCategory(req, res);
  } catch (error) {
    console.error('❌ Preference category update error:', error);
    res.status(500).json({
      success: false,
      message: 'Preference category update failed',
      error: error.message
    });
  }
}));

// Job interaction tracking for AI learning (with rate limiting)
router.post('/job-interaction', 
  protect, 
  authorize('jobseeker'), 
  rateLimit(50, 15 * 60 * 1000), // 50 interactions per 15 minutes
  wrapAsync(async (req, res) => {
    console.log('📊 POST /job-interaction requested by user:', req.user?.id);
    try {
      await userController.addJobInteraction(req, res);
    } catch (error) {
      console.error('❌ Job interaction error:', error);
      res.status(500).json({
        success: false,
        message: 'Job interaction tracking failed',
        error: error.message
      });
    }
  })
);

// Recommendation readiness score
router.get('/recommendation-readiness', protect, authorize('jobseeker'), wrapAsync(async (req, res) => {
  console.log('📊 GET /recommendation-readiness requested by user:', req.user?.id);
  try {
    await userController.getRecommendationReadiness(req, res);
  } catch (error) {
    console.error('❌ Recommendation readiness error:', error);
    res.status(500).json({
      success: false,
      message: 'Recommendation readiness fetch failed',
      error: error.message
    });
  }
}));

// Company routes (public access)
router.get('/companies', wrapAsync(async (req, res) => {
  console.log('📊 GET /companies requested');
  try {
    await companyController.getCompanies(req, res);
  } catch (error) {
    console.error('❌ Companies fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Companies fetch failed',
      error: error.message
    });
  }
}));

router.get('/companies/:id', wrapAsync(async (req, res) => {
  console.log('📊 GET /companies/:id requested for ID:', req.params.id);
  try {
    await companyController.getCompanyById(req, res);
  } catch (error) {
    console.error('❌ Company fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Company fetch failed',
      error: error.message
    });
  }
}));

// Experience routes (job seekers only)
router.route('/experience')
  .put(protect, authorize('jobseeker'), wrapAsync(async (req, res) => {
    console.log('📊 PUT /experience requested by user:', req.user?.id);
    try {
      await userController.addExperience(req, res);
    } catch (error) {
      console.error('❌ Add experience error:', error);
      res.status(500).json({
        success: false,
        message: 'Add experience failed',
        error: error.message
      });
    }
  }));

router.delete('/experience/:exp_id', protect, authorize('jobseeker'), wrapAsync(async (req, res) => {
  console.log('📊 DELETE /experience/:exp_id requested by user:', req.user?.id);
  try {
    await userController.deleteExperience(req, res);
  } catch (error) {
    console.error('❌ Delete experience error:', error);
    res.status(500).json({
      success: false,
      message: 'Delete experience failed',
      error: error.message
    });
  }
}));

// Education routes (job seekers only)
router.route('/education')
  .put(protect, authorize('jobseeker'), wrapAsync(async (req, res) => {
    console.log('📊 PUT /education requested by user:', req.user?.id);
    try {
      await userController.addEducation(req, res);
    } catch (error) {
      console.error('❌ Add education error:', error);
      res.status(500).json({
        success: false,
        message: 'Add education failed',
        error: error.message
      });
    }
  }));

router.delete('/education/:edu_id', protect, authorize('jobseeker'), wrapAsync(async (req, res) => {
  console.log('📊 DELETE /education/:edu_id requested by user:', req.user?.id);
  try {
    await userController.deleteEducation(req, res);
  } catch (error) {
    console.error('❌ Delete education error:', error);
    res.status(500).json({
      success: false,
      message: 'Delete education failed',
      error: error.message
    });
  }
}));

// User profile by ID - this should be LAST since it's a catch-all parameter route
router.get('/:id', wrapAsync(async (req, res) => {
  console.log('📊 GET /:id requested for user ID:', req.params.id);
  try {
    await userController.getUserProfile(req, res);
  } catch (error) {
    console.error('❌ Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'User profile fetch failed',
      error: error.message
    });
  }
}));

// Error handling middleware for this router
router.use((error, req, res, next) => {
  console.error('❌ Users router error:', error);
  console.error('   Path:', req.path);
  console.error('   Method:', req.method);
  console.error('   User:', req.user?.id || 'Not authenticated');
  
  if (res.headersSent) {
    return next(error);
  }
  
  res.status(500).json({
    success: false,
    message: 'Users service error occurred',
    error: error.message,
    path: req.path,
    method: req.method
  });
});

console.log('✅ Users routes loaded successfully');

module.exports = router;