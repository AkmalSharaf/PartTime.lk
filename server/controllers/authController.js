const User = require('../models/User');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    console.log('Registration request received:', req.body);
    
    const { name, email, password, role } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, password, and role'
      });
    }

    // Validate email format
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email: email.toLowerCase() });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Validate role
    if (!['jobseeker', 'employer', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be either jobseeker, employer, or admin'
      });
    }

    console.log('Creating user with role:', role);

    // Create user data with required fields based on role
    const userData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role,
      isActive: true,
      isVerified: false,
      profileCompleteness: 0,
      lastLogin: new Date(),
      lastProfileUpdate: new Date(),
      profileViews: 0,
      searchAppearances: 0,
      engagementMetrics: {
        jobsViewed: 0,
        jobsApplied: 0,
        jobsSaved: 0,
        profileUpdates: 0,
        lastActiveDate: new Date()
      }
    };

    // Initialize role-specific required fields
    if (role === 'employer') {
      // Set required fields for employers to prevent validation errors
      userData.companyName = name; // Use user's name as default company name
      userData.companyDescription = '';
      userData.industry = 'Other'; // Set default industry
      userData.companySize = '1-10'; // Set default company size
    } else if (role === 'jobseeker') {
      // Initialize arrays for job seekers
      userData.skills = [];
      userData.experience = [];
      userData.education = [];
      userData.savedJobs = [];
      
      // Initialize preferences object
      userData.preferences = {
        emailNotifications: true,
        smsNotifications: false,
        jobAlerts: true,
        marketingEmails: false,
        jobTypes: [],
        preferredLocations: [],
        salaryRange: {
          currency: 'USD',
          negotiable: true
        },
        remoteWork: false,
        industries: [],
        workEnvironment: [],
        companySize: [],
        benefits: [],
        preferredTechnologies: [],
        avoidKeywords: [],
        careerGoals: {},
        workLifeBalance: {
          importance: 3
        },
        travelWillingness: 'occasional',
        jobSearchUrgency: 'passively_looking',
        preferredContactMethods: ['email'],
        availability: {
          immediateStart: false,
          noticePeriod: 2
        },
        interviewPreferences: {
          timeSlots: [],
          timeZone: 'UTC',
          virtualInterviewOk: true
        },
        lastUpdated: new Date()
      };

      // Initialize AI profile
      userData.aiProfile = {
        jobInteractions: [],
        searchPatterns: [],
        inferredPreferences: {
          skillsOfInterest: [],
          companiesOfInterest: [],
          salaryExpectations: {},
          locationFlexibility: 3,
          lastComputed: new Date()
        },
        recommendationFeedback: [],
        personalityVector: [],
        careerStage: 'exploring',
        riskTolerance: 3
      };
    }

    console.log('User data prepared:', { ...userData, password: '[HIDDEN]' });

    // Create user
    const user = await User.create(userData);

    console.log('User created successfully:', user._id);

    // Generate token
    const token = user.getSignedJwtToken();

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileCompleteness: user.profileCompleteness
      },
      message: 'User registered successfully'
    });

  } catch (err) {
    console.error('Registration error:', err);
    
    // Handle specific MongoDB validation errors
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors
      });
    }

    // Handle duplicate key errors
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server Error during registration',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Registration failed'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email and password'
      });
    }

    // Check for user and include password for comparison
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    if (user.engagementMetrics) {
      user.engagementMetrics.lastActiveDate = new Date();
    }
    await user.save({ validateBeforeSave: false });

    // Generate token
    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileCompleteness: user.profileCompleteness,
        profilePhoto: user.profilePhoto,
        companyName: user.companyName,
        companyLogo: user.companyLogo
      },
      message: 'Login successful'
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      success: false,
      message: 'Server Error during login',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Login failed'
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    // user is already available in req due to the protect middleware
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
};

// @desc    Logout user / clear token
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'User logged out successfully'
    });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
};