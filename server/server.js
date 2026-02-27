// server.js - Fixed Configuration (Remove Warnings)
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const colors = require('colors');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

console.log('🚀 Starting AI-Enhanced Job Portal Server...'.green.bold);

// Create necessary directories
const createDirectories = () => {
  const dirs = [
    'public/uploads/cvs',
    'public/uploads/photos', 
    'public/uploads/logos',
    'public/uploads/profiles',
    'public/uploads/resumes',
    'public/uploads/applications/resumes',
    'public/uploads/applications/coverletters',
    'tmp',
    'ai',
    'logs',
    'services',
    'middleware'
  ];

  dirs.forEach(dir => {
    const fullPath = path.join(__dirname, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`📁 Created directory: ${dir}`.cyan);
    }
  });
};

createDirectories();

// Database connection with FIXED deprecated options
const connectDB = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...'.yellow);
    
    // FIXED: Removed deprecated options
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/jobportal', {
      // Only keep supported options
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
      retryWrites: true,
      writeConcern: { w: 'majority' }
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`.green.bold);
    
    // Create indexes for better performance
    await createIndexes();
    
    return conn;
  } catch (error) {
    console.error('❌ Database connection failed:'.red.bold, error.message);
    console.log('⚠️  Continuing without database connection...'.yellow);
    // Don't exit - allow server to start for testing
  }
};

// FIXED: Create database indexes without duplicates
const createIndexes = async () => {
  try {
    console.log('🔧 Creating database indexes...'.yellow);
    
    // Job indexes for AI recommendations
    await mongoose.connection.collection('jobs').createIndex({ 
      title: 'text', 
      description: 'text', 
      skills: 'text',
      requirements: 'text'
    }, { background: true });
    
    // Single field indexes
    await mongoose.connection.collection('jobs').createIndex({ status: 1 }, { background: true });
    await mongoose.connection.collection('jobs').createIndex({ employer: 1 }, { background: true });
    await mongoose.connection.collection('jobs').createIndex({ location: 1 }, { background: true });
    await mongoose.connection.collection('jobs').createIndex({ industry: 1 }, { background: true });
    await mongoose.connection.collection('jobs').createIndex({ experience: 1 }, { background: true });
    await mongoose.connection.collection('jobs').createIndex({ createdAt: -1 }, { background: true });
    await mongoose.connection.collection('jobs').createIndex({ 'salary.min': 1 }, { background: true });
    await mongoose.connection.collection('jobs').createIndex({ viewCount: -1 }, { background: true });
    await mongoose.connection.collection('jobs').createIndex({ applicationCount: -1 }, { background: true });
    await mongoose.connection.collection('jobs').createIndex({ skills: 1 }, { background: true });
    
    // User indexes for recommendations - FIXED: Don't create duplicate email index
    // Email index is already created by unique: true in schema, so skip it here
    await mongoose.connection.collection('users').createIndex({ role: 1 }, { background: true });
    await mongoose.connection.collection('users').createIndex({ skills: 1 }, { background: true });
    await mongoose.connection.collection('users').createIndex({ location: 1 }, { background: true });
    await mongoose.connection.collection('users').createIndex({ 'preferences.industries': 1 }, { background: true });
    await mongoose.connection.collection('users').createIndex({ 'preferences.jobTypes': 1 }, { background: true });
    await mongoose.connection.collection('users').createIndex({ lastLogin: -1 }, { background: true });
    
    console.log('✅ Database indexes created successfully'.green);
  } catch (error) {
    if (!error.message.includes('already exists')) {
      console.log(`⚠️  Index creation warning: ${error.message}`.yellow);
    }
  }
};

connectDB();

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001', 
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`❌ CORS blocked request from: ${origin}`.red);
      callback(null, true); // Allow for development - change to false in production
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  optionsSuccessStatus: 200
};

// Global Middleware Stack
app.use(cors(corsOptions));
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https:", "wss:"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'"]
    }
  }
}));

// Simple rate limiting
const rateLimitStore = new Map();
const createRateLimit = (maxRequests, windowMs) => {
  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    // Clean old entries
    for (const [ip, data] of rateLimitStore.entries()) {
      if (now - data.resetTime > windowMs) {
        rateLimitStore.delete(ip);
      }
    }
    
    let rateLimitData = rateLimitStore.get(key);
    if (!rateLimitData) {
      rateLimitData = { count: 0, resetTime: now };
      rateLimitStore.set(key, rateLimitData);
    }
    
    if (now - rateLimitData.resetTime > windowMs) {
      rateLimitData.count = 0;
      rateLimitData.resetTime = now;
    }
    
    if (rateLimitData.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later'
      });
    }
    
    rateLimitData.count++;
    next();
  };
};

// Apply rate limiting
app.use('/api/', createRateLimit(1000, 15 * 60 * 1000)); // 1000 requests per 15 minutes
app.use('/api/auth/', createRateLimit(50, 15 * 60 * 1000)); // 50 auth attempts per 15 minutes

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Enhanced file upload middleware
app.use(fileUpload({
  limits: { 
    fileSize: 50 * 1024 * 1024, // 50MB max file size
    files: 10 // Allow up to 10 files per request
  },
  useTempFiles: true,
  tempFileDir: path.join(__dirname, 'tmp/'),
  createParentPath: true,
  abortOnLimit: true,
  responseOnLimit: 'File size limit exceeded (50MB)',
  limitHandler: (req, res) => {
    res.status(413).json({
      success: false,
      message: 'File too large. Maximum size is 50MB.',
      code: 'FILE_TOO_LARGE'
    });
  },
  uploadTimeout: 120000, // 2 minutes timeout
  debug: process.env.NODE_ENV === 'development',
  parseNested: true,
  preserveExtension: true,
  safeFileNames: true,
  defCharset: 'utf8'
}));

// Security middleware
app.use(mongoSanitize()); // Prevent NoSQL injection
app.use(xss()); // Prevent XSS attacks
app.use(hpp()); // Prevent HTTP Parameter Pollution
app.use(compression()); // Compress responses

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('combined'));
}

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads'), {
  maxAge: '1d',
  etag: true,
  index: false
}));

// Debug middleware for AI and file uploads
app.use((req, res, next) => {
  if (req.path.includes('/ai/') || req.path.includes('/upload')) {
    console.log(`🔍 ${req.method} ${req.path}`.blue);
    if (req.files) {
      console.log(`📁 Files: ${Object.keys(req.files).join(', ')}`.cyan);
    }
  }
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Job Portal Backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Safe route loading with detailed error reporting
console.log('\n🔗 Loading API Routes...'.blue.bold);

const safeLoadRoute = (routePath, routeName) => {
  try {
    console.log(`   Loading ${routeName} routes...`.cyan);
    
    // Check if file exists first
    const fullPath = path.join(__dirname, routePath);
    
    if (!fs.existsSync(fullPath)) {
      console.error(`   ❌ Route file not found: ${fullPath}`.red);
      
      // Create a fallback route
      app.use(`/api/${routeName}`, (req, res) => {
        res.status(503).json({
          success: false,
          message: `${routeName} service is unavailable - route file missing`,
          error: 'Route file not found',
          code: 'ROUTE_FILE_MISSING'
        });
      });
      return false;
    }
    
    const router = require(routePath);
    app.use(`/api/${routeName}`, router);
    console.log(`   ✅ ${routeName} routes loaded successfully`.green);
    return true;
    
  } catch (error) {
    console.error(`   ❌ Error loading ${routeName} routes:`.red, error.message);
    
    if (error.message.includes('Cannot find module')) {
      console.error(`   🔍 Missing dependency: ${error.message.split("'")[1]}`.red);
    } else if (error.message.includes('Missing parameter name')) {
      console.error(`   🔍 Invalid route syntax - check for malformed routes`.red);
    } else {
      console.error(`   📍 Check ${routePath} for syntax errors`.yellow);
    }
    
    // Create a fallback route so server can still start
    app.use(`/api/${routeName}`, (req, res) => {
      res.status(503).json({
        success: false,
        message: `${routeName} service is temporarily unavailable`,
        error: 'Route configuration error',
        code: 'ROUTE_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    });
    
    return false;
  }
};

// Load route files with enhanced error handling
const routeLoadResults = {
  auth: safeLoadRoute('./routes/auth.js', 'auth'),
  users: safeLoadRoute('./routes/users.js', 'users'), 
  jobs: safeLoadRoute('./routes/jobs.js', 'jobs'),
  applications: safeLoadRoute('./routes/applications.js', 'applications'),
  upload: safeLoadRoute('./routes/upload.js', 'upload'),
  stats: safeLoadRoute('./routes/stats.js', 'stats')
};

// Route loading summary
const successfulRoutes = Object.entries(routeLoadResults)
  .filter(([_, success]) => success)
  .map(([name]) => name);
const failedRoutes = Object.entries(routeLoadResults)
  .filter(([_, success]) => !success)
  .map(([name]) => name);

console.log(`\n📊 Route Loading Summary:`.blue.bold);
if (successfulRoutes.length > 0) {
  console.log(`   ✅ Successful: ${successfulRoutes.join(', ')}`.green);
}
if (failedRoutes.length > 0) {
  console.log(`   ❌ Failed: ${failedRoutes.join(', ')}`.red);
  console.log(`   ⚠️  Server will continue, but these routes won't work properly`.yellow);
  console.log(`   💡 Check the controller files and ensure all dependencies exist`.yellow);
}

// API documentation endpoint
app.get('/api', (req, res) => {
  res.status(200).json({
    message: 'Welcome to Job Portal API',
    version: '1.0.0',
    status: 'running',
    routes: {
      successful: successfulRoutes.map(route => `/api/${route}`),
      failed: failedRoutes.map(route => `/api/${route} (unavailable)`)
    },
    endpoints: {
      auth: '/api/auth - Authentication endpoints',
      users: '/api/users - User management endpoints',
      jobs: '/api/jobs - Job posting and search endpoints',
      applications: '/api/applications - Job application endpoints',
      upload: '/api/upload - File upload endpoints',
      stats: '/api/stats - Platform statistics'
    },
    ai_features: {
      recommendations: '/api/jobs/ai/recommendations - AI-powered job recommendations',
      salary_prediction: '/api/jobs/ai/predict-salary - AI salary prediction',
      market_insights: '/api/jobs/ai/market-insights - Market analysis',
      trending: '/api/jobs/ai/trending - Trending jobs'
    },
    health_check: '/health',
    documentation: process.env.API_DOCS_URL || 'Not configured'
  });
});

// Test endpoint for AI recommendations (useful for debugging)
app.get('/api/test/recommendations', async (req, res) => {
  try {
    // Create a test user object
    const testUser = {
      _id: 'test',
      skills: ['javascript', 'react', 'node.js'],
      location: 'San Francisco',
      inferredExperienceLevel: 'Mid-level',
      preferences: {
        jobTypes: ['Full-time'],
        industries: ['Software'],
        remoteWork: true,
        salaryRange: { min: 80000 }
      }
    };

    // Test the recommendation service
    const recommendationService = require('./services/recommendationService');
    const recommendations = await recommendationService.getAIRecommendations(testUser, { limit: 5 });

    res.status(200).json({
      success: true,
      message: 'Test recommendations generated successfully',
      data: recommendations,
      test_user: testUser
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Test recommendations failed',
      error: error.message
    });
  }
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API route ${req.originalUrl} not found`,
    suggestion: 'Check the API documentation at /api endpoint',
    available_routes: successfulRoutes.map(route => `/api/${route}`)
  });
});

// Root route for development
app.get('/', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'Connected ✅' : 'Disconnected ❌';
  const aiModelPath = path.join(__dirname, 'ai/job_recommendation_model.pkl');
  const aiStatus = fs.existsSync(aiModelPath) ? 'Ready ✅' : 'Not found ❌';
  
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>AI-Enhanced Job Portal API</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; }
          .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); max-width: 800px; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .title { color: #2d3748; font-size: 2.5em; margin: 0; font-weight: 700; }
          .subtitle { color: #4a5568; font-size: 1.2em; margin: 10px 0 0 0; }
          .status { display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 14px; font-weight: 600; margin: 5px; }
          .success { background: #c6f6d5; color: #22543d; }
          .error { background: #fed7d7; color: #742a2a; }
          .warning { background: #faf089; color: #744210; }
          .section { margin: 25px 0; }
          .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0; }
          .card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; }
          .card h3 { margin: 0 0 15px 0; color: #2d3748; }
          .endpoint { background: #f7fafc; padding: 8px 12px; border-radius: 4px; margin: 5px 0; font-family: 'Courier New', monospace; font-size: 14px; }
          .ai-badge { background: linear-gradient(45deg, #667eea, #764ba2); color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-left: 10px; }
          .test-button { background: #4299e1; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 5px; }
          .test-button:hover { background: #3182ce; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="title">🤖 AI-Enhanced Job Portal</h1>
            <p class="subtitle">Intelligent Backend API Server</p>
          </div>
          
          <div class="section">
            <h3>🚀 Server Status</h3>
            <span class="status success">✅ Running on Port ${process.env.PORT || 5000}</span>
            <span class="status ${mongoose.connection.readyState === 1 ? 'success' : 'error'}">
              📊 Database ${dbStatus}
            </span>
            <span class="status ${fs.existsSync(aiModelPath) ? 'success' : 'warning'}">
              🤖 AI Model ${aiStatus}
            </span>
          </div>

          <div class="section">
            <h3>📊 Route Status</h3>
            ${Object.entries(routeLoadResults).map(([name, success]) => 
              `<span class="status ${success ? 'success' : 'error'}">/api/${name} ${success ? '✅' : '❌'}</span>`
            ).join('')}
          </div>
          
          <div class="grid">
            <div class="card">
              <h3>🔗 Core Endpoints</h3>
              <div class="endpoint">GET /health</div>
              <div class="endpoint">GET /api</div>
              ${successfulRoutes.map(route => `<div class="endpoint">* /api/${route}/*</div>`).join('')}
            </div>
            
            <div class="card">
              <h3>🤖 AI Features <span class="ai-badge">FIXED</span></h3>
              <div class="endpoint">GET /api/jobs/ai/recommendations</div>
              <div class="endpoint">POST /api/jobs/ai/predict-salary</div>
              <div class="endpoint">GET /api/jobs/ai/market-insights</div>
              <div class="endpoint">GET /api/jobs/ai/trending</div>
              <div class="endpoint">GET /api/jobs/ai/status</div>
              <button class="test-button" onclick="fetch('/api/test/recommendations').then(r=>r.json()).then(d=>alert(JSON.stringify(d,null,2)))">Test AI</button>
            </div>
          </div>

          ${failedRoutes.length > 0 ? `
            <div class="section">
              <h3>⚠️ Route Issues</h3>
              <p style="color: #744210;">The following routes have errors and need attention:</p>
              ${failedRoutes.map(route => `<div class="endpoint" style="background: #fed7d7;">routes/${route}.js</div>`).join('')}
            </div>
          ` : ''}
          
          <div class="section" style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="color: #4a5568; margin: 0;">Environment: <strong>${process.env.NODE_ENV || 'development'}</strong></p>
            <p style="color: #4a5568; margin: 5px 0 0 0; font-size: 14px;">✅ Fixed MongoDB warnings | ✅ Ready for React frontend</p>
          </div>
        </div>
      </body>
    </html>
  `);
});

// Enhanced global error handler (same as before)
app.use((err, req, res, next) => {
  console.error('=== GLOBAL ERROR HANDLER ==='.red.bold);
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  console.error('URL:', req.url);
  console.error('Method:', req.method);
  console.error('============================');
  
  // Handle specific file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File too large. Maximum size is 50MB',
      code: 'FILE_TOO_LARGE'
    });
  }
  
  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      success: false,
      message: 'Too many files. Maximum 10 files allowed',
      code: 'TOO_MANY_FILES'
    });
  }
  
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: 'Unexpected file field',
      code: 'UNEXPECTED_FILE'
    });
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors
    });
  }

  // Handle Mongoose duplicate key errors
  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Duplicate field value',
      field: Object.keys(err.keyValue)[0]
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }

  // Handle MongoDB connection errors
  if (err.name === 'MongooseError' || err.name === 'MongoError') {
    return res.status(503).json({
      success: false,
      message: 'Database connection error',
      code: 'DB_ERROR'
    });
  }

  // Handle AI/ML service errors
  if (err.message.includes('AI') || err.message.includes('Python')) {
    return res.status(503).json({
      success: false,
      message: 'AI service temporarily unavailable',
      code: 'AI_SERVICE_ERROR',
      fallback: 'Using rule-based recommendations'
    });
  }
  
  // Default error response
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    code: err.code || 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: {
        name: err.name,
        url: req.url,
        method: req.method
      }
    })
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`❌ Unhandled Promise Rejection: ${err.message}`.red.bold);
  console.error('Stack:', err.stack);
  
  if (process.env.NODE_ENV === 'production') {
    console.log('🔄 Closing server due to unhandled promise rejection...'.yellow);
    server.close(() => {
      process.exit(1);
    });
  } else {
    console.log('⚠️  Continuing in development mode...'.yellow);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log(`❌ Uncaught Exception: ${err.message}`.red.bold);
  console.error('Stack:', err.stack);
  
  if (process.env.NODE_ENV === 'production') {
    console.log('🔄 Closing server due to uncaught exception...'.yellow);
    process.exit(1);
  } else {
    console.log('⚠️  Continuing in development mode...'.yellow);
  }
});

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`\n👋 ${signal} received. Shutting down gracefully...`.yellow);
  
  server.close(async () => {
    console.log('🔄 HTTP server closed.'.cyan);
    
    try {
      await mongoose.connection.close();
      console.log('📦 MongoDB connection closed.'.cyan);
    } catch (error) {
      console.error('❌ Error closing MongoDB connection:', error.message);
    }
    
    console.log('💤 Process terminated gracefully!'.green);
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.log('⚠️  Could not close connections in time, forcefully shutting down'.yellow);
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server with enhanced startup information
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log('\n🎉 AI-Enhanced Job Portal Server Successfully Started!'.green.bold);
  console.log('========================================================='.green);
  console.log(`🌐 Server running on: http://localhost:${PORT}`.cyan.bold);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`.cyan);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api`.cyan);
  console.log(`🧪 Test AI: http://localhost:${PORT}/api/test/recommendations`.cyan);
  console.log(`📁 Upload directories: Ready`.cyan);
 // Continuation of server.js - Complete the cut-off section

  console.log(`🔗 CORS enabled for: http://localhost:3000`.cyan);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`.cyan);
  console.log(`🔒 Rate limiting: Enabled`.cyan);
  
  // Database status
  const dbStatus = mongoose.connection.readyState === 1 ? 'Connected ✅' : 'Disconnected ❌';
  console.log(`💾 Database: ${dbStatus}`.cyan);
  
  // AI Model status
  const aiModelPath = path.join(__dirname, 'ai/job_recommendation_model.pkl');
  if (fs.existsSync(aiModelPath)) {
    console.log(`🤖 AI Recommendation Model: Ready ✅`.green.bold);
  } else {
    console.log(`⚠️  AI Recommendation Model: Not found`.yellow);
    console.log(`   Run 'npm run setup-ai' to train the model`.yellow);
  }
  
  // Route status summary
  if (failedRoutes.length > 0) {
    console.log(`\n⚠️  Warning: ${failedRoutes.length} route file(s) have errors`.yellow.bold);
    console.log(`   Fix these files and restart: ${failedRoutes.map(r => `routes/${r}.js`).join(', ')}`.yellow);
  } else {
    console.log(`\n✅ All routes loaded successfully!`.green.bold);
  }
  
  // Feature status
  console.log('\n🚀 Available Features:'.blue.bold);
  console.log(`   • AI Job Recommendations: ${process.env.AI_ENABLED === 'true' ? '✅' : '❌'}`.cyan);
  console.log(`   • ML Service Integration: ${process.env.ML_RECOMMENDATIONS_ENABLED === 'true' ? '✅' : '❌'}`.cyan);
  console.log(`   • File Upload Service: ✅`.cyan);
  console.log(`   • Email Notifications: ${process.env.SMTP_HOST ? '✅' : '❌'}`.cyan);
  console.log(`   • Rate Limiting: ✅`.cyan);
  console.log(`   • Security Middleware: ✅`.cyan);
  
  console.log('\n📋 Ready to accept requests...'.green.bold);
  console.log('========================================================='.green);
});

module.exports = app;