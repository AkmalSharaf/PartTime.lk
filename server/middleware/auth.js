// middleware/auth.js - Fixed Authentication and Authorization Middleware
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  try {
    let token;

    console.log('🔐 Auth middleware - checking token');
    console.log('Authorization header:', req.headers.authorization);

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('✅ Token found in Bearer header');
    }
    // Check for token in cookies
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
      console.log('✅ Token found in cookies');
    }

    // Make sure token exists
    if (!token) {
      console.log('❌ No token found');
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route - No token provided',
        code: 'NO_TOKEN'
      });
    }

    try {
      // Verify token
      console.log('🔍 Verifying token...');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      console.log('✅ Token decoded:', { id: decoded.id, role: decoded.role, email: decoded.email });

      // Get user from database
      const user = await User.findById(decoded.id).select('+role +email +isActive');

      if (!user) {
        console.log('❌ No user found with token ID:', decoded.id);
        return res.status(401).json({
          success: false,
          message: 'No user found with this token',
          code: 'USER_NOT_FOUND'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        console.log('❌ User account is deactivated:', user.email);
        return res.status(401).json({
          success: false,
          message: 'User account is deactivated',
          code: 'ACCOUNT_DEACTIVATED'
        });
      }

      // Add user to request object
      req.user = user;
      console.log('✅ User authenticated successfully:', { 
        id: user._id, 
        role: user.role, 
        email: user.email 
      });

      next();
    } catch (err) {
      console.error('❌ Token verification error:', err.message);
      
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired',
          code: 'TOKEN_EXPIRED'
        });
      }
      
      if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
          code: 'INVALID_TOKEN'
        });
      }
      
      return res.status(401).json({
        success: false,
        message: 'Token verification failed',
        code: 'TOKEN_VERIFICATION_FAILED'
      });
    }
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error in authentication',
      code: 'AUTH_SERVER_ERROR'
    });
  }
};

// Authorize specific roles - Fixed to properly handle single role or array
exports.authorize = (...roles) => {
  return (req, res, next) => {
    console.log('🔒 Authorization check starting...');
    
    if (!req.user) {
      console.log('❌ Authorization failed - no user in request');
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route - User not authenticated',
        code: 'USER_NOT_AUTHENTICATED'
      });
    }

    console.log('🔍 Authorization details:', { 
      userRole: req.user.role, 
      requiredRoles: roles,
      userEmail: req.user.email,
      userId: req.user._id
    });

    // Handle both single role and array of roles
    const allowedRoles = roles.flat();
    
    // Check if user's role is in the allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      console.log('❌ Authorization failed - role mismatch');
      console.log(`User role '${req.user.role}' not in allowed roles: [${allowedRoles.join(', ')}]`);
      
      return res.status(403).json({
        success: false,
        message: `Access denied. Your role '${req.user.role}' is not authorized for this action.`,
        required_roles: allowedRoles,
        user_role: req.user.role,
        code: 'ROLE_NOT_AUTHORIZED'
      });
    }

    console.log('✅ Authorization successful - role match found');
    next();
  };
};

// Simple rate limiting for specific functions
exports.rateLimit = (maxRequests, windowMs) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const key = req.user ? req.user.id : (req.ip || req.connection.remoteAddress);
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
      console.log(`⚠️ Rate limit exceeded for ${key}`);
      return res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later',
        code: 'RATE_LIMIT_EXCEEDED',
        retry_after: Math.ceil((limit.resetTime - now) / 1000)
      });
    }
    
    limit.count++;
    next();
  };
};

// Check subscription level (placeholder for premium features)
exports.checkSubscription = (requiredLevel) => {
  return (req, res, next) => {
    console.log('📋 Subscription check:', { 
      required: requiredLevel, 
      user: req.user?.subscriptionType || 'free' 
    });
    
    // For development, allow all requests
    // In production, implement proper subscription logic
    if (process.env.NODE_ENV === 'development') {
      console.log('🔓 Development mode - allowing all subscription levels');
      return next();
    }
    
    // Basic subscription check
    const userSubscription = req.user?.subscriptionType || 'free';
    const subscriptionHierarchy = {
      'free': 0,
      'basic': 1,
      'premium': 2,
      'enterprise': 3
    };
    
    const userLevel = subscriptionHierarchy[userSubscription] || 0;
    const requiredLevelValue = subscriptionHierarchy[requiredLevel] || 0;
    
    if (userLevel >= requiredLevelValue) {
      console.log('✅ Subscription check passed');
      next();
    } else {
      console.log('❌ Subscription level insufficient');
      res.status(403).json({
        success: false,
        message: `This feature requires ${requiredLevel} subscription`,
        current_subscription: userSubscription,
        required_subscription: requiredLevel,
        code: 'SUBSCRIPTION_REQUIRED'
      });
    }
  };
};

// Log activity (simple implementation)
exports.logActivity = (activityType) => {
  return (req, res, next) => {
    const timestamp = new Date().toISOString();
    const userId = req.user?.id || 'anonymous';
    const userRole = req.user?.role || 'guest';
    
    console.log(`📊 Activity: ${activityType} | User: ${userId} (${userRole}) | Time: ${timestamp}`);
    
    // Update user activity if authenticated
    if (req.user) {
      setImmediate(async () => {
        try {
          await User.findByIdAndUpdate(req.user.id, {
            lastLogin: new Date(),
            'engagementMetrics.lastActiveDate': new Date()
          }, { validateBeforeSave: false });
        } catch (error) {
          console.error('⚠️ Error updating user activity:', error.message);
        }
      });
    }
    
    next();
  };
};

// Optional: Admin only middleware
exports.adminOnly = (req, res, next) => {
  console.log('👑 Admin check for user:', req.user?.role);
  
  if (req.user && req.user.role === 'admin') {
    console.log('✅ Admin access granted');
    next();
  } else {
    console.log('❌ Admin access denied');
    res.status(403).json({
      success: false,
      message: 'Admin access required',
      user_role: req.user?.role || 'not_authenticated',
      code: 'ADMIN_REQUIRED'
    });
  }
};

// Optional: Employer only middleware
exports.employerOnly = (req, res, next) => {
  console.log('🏢 Employer check for user:', req.user?.role);
  
  if (req.user && req.user.role === 'employer') {
    console.log('✅ Employer access granted');
    next();
  } else {
    console.log('❌ Employer access denied');
    res.status(403).json({
      success: false,
      message: 'Employer access required',
      user_role: req.user?.role || 'not_authenticated',
      code: 'EMPLOYER_REQUIRED'
    });
  }
};

// Optional: Job seeker only middleware
exports.jobSeekerOnly = (req, res, next) => {
  console.log('👤 Job seeker check for user:', req.user?.role);
  
  if (req.user && req.user.role === 'jobseeker') {
    console.log('✅ Job seeker access granted');
    next();
  } else {
    console.log('❌ Job seeker access denied');
    res.status(403).json({
      success: false,
      message: 'Job seeker access required',
      user_role: req.user?.role || 'not_authenticated',
      code: 'JOBSEEKER_REQUIRED'
    });
  }
};

// Debug middleware for troubleshooting auth issues
exports.debugAuth = (req, res, next) => {
  console.log('\n=== AUTH DEBUG ===');
  console.log('Method:', req.method);
  console.log('Path:', req.path);
  console.log('Headers:', {
    authorization: req.headers.authorization,
    'content-type': req.headers['content-type']
  });
  console.log('User:', req.user ? {
    id: req.user._id,
    role: req.user.role,
    email: req.user.email
  } : 'Not authenticated');
  console.log('================\n');
  next();
};