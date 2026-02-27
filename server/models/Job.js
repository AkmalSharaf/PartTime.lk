// models/Job.js - Enhanced Job model with advanced AI integration
const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a job title'],
    maxlength: [100, 'Title can not be more than 100 characters'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please add a job description'],
    maxlength: [3000, 'Description can not be more than 3000 characters']
  },
  shortDescription: {
    type: String,
    maxlength: [200, 'Short description can not be more than 200 characters'],
    trim: true
  },
  company: {
    type: String,
    required: [true, 'Please add a company name'],
    maxlength: [100, 'Company name can not be more than 100 characters'],
    trim: true
  },
  location: {
    type: String,
    required: [true, 'Please add a location'],
    maxlength: [100, 'Location can not be more than 100 characters'],
    trim: true
  },
  isRemote: {
    type: Boolean,
    default: false
  },
  locationDetails: {
    country: String,
    state: String,
    city: String,
    timezone: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  jobType: {
    type: String,
    required: [true, 'Please add a job type'],
    enum: {
      values: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance', 'Remote'],
      message: 'Job type must be Full-time, Part-time, Contract, Internship, Freelance, or Remote'
    }
  },
  experience: {
    type: String,
    required: [true, 'Please add experience level'],
    enum: {
      values: ['Entry-level', 'Mid-level', 'Senior', 'Executive', 'Intern'],
      message: 'Experience must be Entry-level, Mid-level, Senior, Executive, or Intern'
    }
  },
  experienceYears: {
    min: {
      type: Number,
      min: 0
    },
    max: {
      type: Number,
      min: 0
    }
  },
  skills: {
    type: [String],
    required: [true, 'Please add required skills'],
    validate: {
      validator: function(skills) {
        return skills && skills.length > 0 && skills.length <= 30;
      },
      message: 'Please provide 1-30 skills'
    }
  },
  // Enhanced skill categorization for better matching
  skillCategories: {
    technical: [String],
    soft: [String],
    tools: [String],
    languages: [String],
    frameworks: [String],
    certifications: [String]
  },
  industry: {
    type: String,
    required: [true, 'Please add an industry'],
    enum: {
      values: [
        'Software', 'Hardware', 'Fintech', 'Healthcare', 'E-commerce',
        'Education', 'Media', 'Gaming', 'AI/ML', 'Blockchain',
        'SaaS', 'Mobile', 'Web Development', 'Data Science', 'DevOps',
        'Cybersecurity', 'Cloud Computing', 'Design', 'Marketing', 'Sales',
        'HR', 'Finance', 'Legal', 'Consulting', 'Manufacturing', 'Other'
      ],
      message: 'Please select a valid industry'
    }
  },
  salary: {
    min: {
      type: Number,
      min: [0, 'Minimum salary cannot be negative']
    },
    max: {
      type: Number,
      validate: {
        validator: function(max) {
          return !this.salary.min || max >= this.salary.min;
        },
        message: 'Maximum salary must be greater than or equal to minimum salary'
      }
    },
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR', 'JPY']
    },
    period: {
      type: String,
      default: 'yearly',
      enum: ['hourly', 'monthly', 'yearly']
    },
    negotiable: {
      type: Boolean,
      default: false
    }
  },
  requirements: {
    type: [String],
    default: []
  },
  responsibilities: {
    type: [String],
    default: []
  },
  benefits: {
    type: [String],
    enum: [
      'Health Insurance', 'Dental Insurance', 'Vision Insurance',
      'Retirement Plan', 'Paid Time Off', 'Flexible Hours',
      'Remote Work', 'Professional Development', 'Stock Options',
      'Gym Membership', 'Free Meals', 'Transportation', 'Childcare',
      'Mental Health Support', 'Learning Budget', 'Conference Attendance'
    ],
    default: []
  },
  employer: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'closed', 'draft', 'expired'],
    default: 'active'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  featured: {
    type: Boolean,
    default: false
  },
  urgent: {
    type: Boolean,
    default: false
  },
  applicationDeadline: {
    type: Date
  },
  startDate: {
    type: Date
  },
  // Application and engagement metrics
  applicationCount: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  },
  saveCount: {
    type: Number,
    default: 0
  },
  clickCount: {
    type: Number,
    default: 0
  },
  // Enhanced fields for better AI search and matching
  searchKeywords: {
    type: [String],
    default: []
  },
  educationLevel: {
    type: String,
    enum: ['High School', 'Associate', 'Bachelor', 'Master', 'PhD', 'Not Required', 'Preferred']
  },
  workEnvironment: {
    type: String,
    enum: ['startup', 'corporate', 'agency', 'nonprofit', 'government', 'freelance']
  },
  companySize: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']
  },
  // Work arrangement details
  workArrangement: {
    type: String,
    enum: ['On-site', 'Remote', 'Hybrid'],
    default: 'On-site'
  },
  hybridDetails: {
    daysInOffice: Number,
    flexibleSchedule: Boolean
  },
  // Travel requirements
  travelRequirement: {
    type: String,
    enum: ['none', 'minimal', 'occasional', 'frequent'],
    default: 'none'
  },
  // Application process
  applicationProcess: {
    steps: [{
      step: String,
      description: String,
      estimatedTime: String
    }],
    contactEmail: String,
    applicationUrl: String,
    requiresCoverLetter: {
      type: Boolean,
      default: false
    },
    requiresPortfolio: {
      type: Boolean,
      default: false
    }
  },
  // AI enhancement fields
  aiMetadata: {
    qualityScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    completenessScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    // Automatically extracted tags for better matching
    extractedTags: [String],
    // Predicted user engagement score
    engagementScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    lastOptimized: {
      type: Date,
      default: Date.now
    }
  },
  // Performance tracking
  performance: {
    impressions: {
      type: Number,
      default: 0
    },
    clicks: {
      type: Number,
      default: 0
    },
    applications: {
      type: Number,
      default: 0
    },
    saves: {
      type: Number,
      default: 0
    },
    ctr: {
      type: Number,
      default: 0
    }, // Click-through rate
    applicationRate: {
      type: Number,
      default: 0
    }
  },
  // Expiration and cleanup
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days from now
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create comprehensive indexes for better query performance
JobSchema.index({
  title: 'text',
  description: 'text',
  company: 'text',
  skills: 'text',
  location: 'text',
  industry: 'text',
  searchKeywords: 'text',
  requirements: 'text'
}, {
  weights: {
    title: 10,
    skills: 8,
    company: 6,
    searchKeywords: 5,
    industry: 4,
    description: 3,
    location: 2,
    requirements: 1
  },
  name: 'job_text_search'
});

// Compound indexes for common queries
JobSchema.index({ status: 1, createdAt: -1 });
JobSchema.index({ status: 1, jobType: 1, experience: 1 });
JobSchema.index({ status: 1, location: 1, isRemote: 1 });
JobSchema.index({ status: 1, industry: 1 });
JobSchema.index({ employer: 1, status: 1, createdAt: -1 });
JobSchema.index({ skills: 1, status: 1 });
JobSchema.index({ 'salary.min': 1, 'salary.max': 1, status: 1 });
JobSchema.index({ featured: 1, status: 1, createdAt: -1 });
JobSchema.index({ urgent: 1, status: 1, createdAt: -1 });
JobSchema.index({ 'aiMetadata.qualityScore': -1, status: 1 });
JobSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Geospatial index for location-based queries
JobSchema.index({ 'locationDetails.coordinates': '2dsphere' });

// Pre-save middleware for AI enhancements
JobSchema.pre('save', function(next) {
  // Update search keywords
  if (this.isModified('title') || this.isModified('description') || this.isModified('skills')) {
    this.generateSearchKeywords();
  }
  
  // Set remote flag based on location or work arrangement
  if (this.location && (this.location.toLowerCase().includes('remote') || this.workArrangement === 'Remote')) {
    this.isRemote = true;
  }
  
  // Generate short description if not provided
  if (!this.shortDescription && this.description) {
    this.shortDescription = this.description.substring(0, 197) + '...';
  }
  
  // Calculate AI scores
  this.calculateAIScores();
  
  // Update performance metrics
  this.updatePerformanceMetrics();
  
  next();
});

// Method to generate search keywords
JobSchema.methods.generateSearchKeywords = function() {
  const keywords = new Set();
  
  // Extract from title
  const titleWords = this.title.toLowerCase()
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2);
  titleWords.forEach(word => keywords.add(word));
  
  // Extract from description
  const descWords = this.description.toLowerCase()
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2)
    .slice(0, 30); // Limit to prevent too many keywords
  descWords.forEach(word => keywords.add(word));
  
  // Add skills
  this.skills.forEach(skill => {
    const skillWords = skill.toLowerCase().split(/\s+/);
    skillWords.forEach(word => {
      if (word.length > 1) keywords.add(word);
    });
  });
  
  // Add industry
  if (this.industry) {
    keywords.add(this.industry.toLowerCase());
  }
  
  // Add common tech terms and abbreviations
  const techTerms = {
    'javascript': ['js', 'es6', 'es2015'],
    'typescript': ['ts'],
    'react': ['reactjs'],
    'angular': ['angularjs'],
    'vue': ['vuejs'],
    'node': ['nodejs'],
    'artificial intelligence': ['ai', 'ml', 'machine learning'],
    'user interface': ['ui'],
    'user experience': ['ux']
  };
  
  keywords.forEach(keyword => {
    if (techTerms[keyword]) {
      techTerms[keyword].forEach(term => keywords.add(term));
    }
  });
  
  this.searchKeywords = Array.from(keywords);
};

// Method to calculate AI quality and completeness scores
JobSchema.methods.calculateAIScores = function() {
  let qualityScore = 0;
  let completenessScore = 0;
  
  // Quality factors
  if (this.title && this.title.length >= 10) qualityScore += 15;
  if (this.description && this.description.length >= 200) qualityScore += 20;
  if (this.skills && this.skills.length >= 3) qualityScore += 15;
  if (this.requirements && this.requirements.length >= 2) qualityScore += 10;
  if (this.benefits && this.benefits.length >= 3) qualityScore += 10;
  if (this.salary && this.salary.min) qualityScore += 10;
  if (this.applicationProcess && this.applicationProcess.contactEmail) qualityScore += 10;
  if (this.responsibilities && this.responsibilities.length >= 3) qualityScore += 10;
  
  // Completeness factors
  const requiredFields = ['title', 'description', 'company', 'location', 'jobType', 'experience', 'industry'];
  const optionalFields = ['salary', 'benefits', 'requirements', 'responsibilities', 'educationLevel'];
  
  const completedRequired = requiredFields.filter(field => {
    const value = this[field];
    return value && (typeof value === 'string' ? value.trim() : true);
  }).length;
  
  const completedOptional = optionalFields.filter(field => {
    const value = this[field];
    return value && (Array.isArray(value) ? value.length > 0 : (typeof value === 'string' ? value.trim() : true));
  }).length;
  
  completenessScore = Math.round(
    (completedRequired / requiredFields.length) * 70 + 
    (completedOptional / optionalFields.length) * 30
  );
  
  this.aiMetadata = {
    ...this.aiMetadata,
    qualityScore: Math.min(qualityScore, 100),
    completenessScore: Math.min(completenessScore, 100),
    lastOptimized: new Date()
  };
};

// Method to update performance metrics
JobSchema.methods.updatePerformanceMetrics = function() {
  if (this.performance.impressions > 0) {
    this.performance.ctr = (this.performance.clicks / this.performance.impressions) * 100;
  }
  
  if (this.performance.clicks > 0) {
    this.performance.applicationRate = (this.performance.applications / this.performance.clicks) * 100;
  }
};

// Virtual for formatted salary
JobSchema.virtual('formattedSalary').get(function() {
  if (!this.salary || !this.salary.min) return 'Salary not specified';
  
  const formatNumber = (num) => {
    if (this.salary.currency === 'USD' && num >= 1000) {
      return `${Math.round(num / 1000)}k`;
    }
    return num.toLocaleString();
  };
  
  const symbol = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'CAD': 'C$',
    'AUD': 'A$',
    'INR': '₹',
    'JPY': '¥'
  }[this.salary.currency] || '$';
  
  const min = formatNumber(this.salary.min);
  const max = this.salary.max ? formatNumber(this.salary.max) : null;
  
  let salaryStr = max ? `${symbol}${min} - ${symbol}${max}` : `${symbol}${min}+`;
  
  if (this.salary.period === 'hourly') salaryStr += '/hr';
  if (this.salary.period === 'monthly') salaryStr += '/mo';
  if (this.salary.period === 'yearly') salaryStr += '/yr';
  
  if (this.salary.negotiable) salaryStr += ' (negotiable)';
  
  return salaryStr;
});

// Virtual for days since posted
JobSchema.virtual('daysAgo').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.createdAt);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
});

// Virtual for application deadline status
JobSchema.virtual('deadlineStatus').get(function() {
  if (!this.applicationDeadline) return null;
  
  const now = new Date();
  const deadline = new Date(this.applicationDeadline);
  const diffDays = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'expired';
  if (diffDays === 0) return 'today';
  if (diffDays <= 3) return 'urgent';
  if (diffDays <= 7) return 'soon';
  return 'open';
});

// Static method for advanced search with AI scoring
JobSchema.statics.advancedSearch = function(searchParams, userProfile = null) {
  const {
    query,
    location,
    jobType,
    experience,
    salaryMin,
    salaryMax,
    skills,
    industry,
    workArrangement,
    benefits,
    page = 1,
    limit = 12,
    sortBy = 'relevance'
  } = searchParams;
  
  let pipeline = [];
  
  // Stage 1: Initial matching
  let matchQuery = { 
    status: 'active',
    $or: [
      { expiresAt: { $gt: new Date() } },
      { expiresAt: { $exists: false } }
    ]
  };
  
  // Text search
  if (query) {
    matchQuery.$text = { $search: query };
  }
  
  // Location filter (improved to handle remote)
  if (location) {
    if (location.toLowerCase() === 'remote') {
      matchQuery.$or = [
        { isRemote: true },
        { workArrangement: 'Remote' },
        { location: { $regex: 'remote', $options: 'i' } }
      ];
    } else {
      matchQuery.location = { $regex: location, $options: 'i' };
    }
  }
  
  // Other filters
  if (jobType) matchQuery.jobType = jobType;
  if (experience) matchQuery.experience = experience;
  if (industry) matchQuery.industry = industry;
  if (workArrangement) matchQuery.workArrangement = workArrangement;
  
  // Salary filter
  if (salaryMin || salaryMax) {
    matchQuery['salary.min'] = {};
    if (salaryMin) matchQuery['salary.min'].$gte = parseInt(salaryMin);
    if (salaryMax) matchQuery['salary.max'] = { $lte: parseInt(salaryMax) };
  }
  
  // Skills filter
  if (skills && skills.length > 0) {
    const skillRegexes = skills.map(skill => new RegExp(skill, 'i'));
    matchQuery.skills = { $in: skillRegexes };
  }
  
  // Benefits filter
  if (benefits && benefits.length > 0) {
    matchQuery.benefits = { $in: benefits };
  }
  
  pipeline.push({ $match: matchQuery });
  
  // Stage 2: Add relevance scoring
  let scoringStage = {
    $addFields: {
      relevanceScore: {
        $add: [
          // Text search score
          query ? { $multiply: [{ $meta: 'textScore' }, 20] } : 0,
          
          // Quality score weight
          { $multiply: [{ $divide: ['$aiMetadata.qualityScore', 100] }, 15] },
          
          // Recency boost
          {
            $multiply: [
              {
                $max: [0, {
                  $subtract: [30, {
                    $divide: [
                      { $subtract: [new Date(), '$createdAt'] },
                      1000 * 60 * 60 * 24
                    ]
                  }]
                }]
              },
              0.5
            ]
          },
          
          // Featured boost
          { $cond: ['$featured', 10, 0] },
          
          // Urgent boost
          { $cond: ['$urgent', 5, 0] }
        ]
      }
    }
  };
  
  // Add user-specific scoring if profile provided
  if (userProfile) {
    const userSkills = userProfile.skills || [];
    const userLocation = userProfile.location || '';
    const userPreferences = userProfile.preferences || {};
    
    scoringStage.$addFields.personalizedScore = {
      $add: [
        // Skills matching
        userSkills.length > 0 ? {
          $multiply: [
            {
              $divide: [
                {
                  $size: {
                    $setIntersection: [
                      { $map: { input: '$skills', as: 'skill', in: { $toLower: '$$skill' } } },
                      userSkills.map(s => s.toLowerCase())
                    ]
                  }
                },
                { $max: [userSkills.length, 1] }
              ]
            },
            40
          ]
        } : 0,
        
        // Location preference matching
        userLocation ? {
          $cond: [
            { $regexMatch: { input: '$location', regex: userLocation, options: 'i' } },
            20,
            { $cond: ['$isRemote', 10, 0] }
          ]
        } : 0,
        
        // Job type preference
        userPreferences.jobTypes && userPreferences.jobTypes.length > 0 ? {
          $cond: [
            { $in: ['$jobType', userPreferences.jobTypes] },
            15,
            0
          ]
        } : 0,
        
        // Industry preference
        userPreferences.industries && userPreferences.industries.length > 0 ? {
          $cond: [
            { $in: ['$industry', userPreferences.industries] },
            10,
            0
          ]
        } : 0,
        
        // Salary preference
        userPreferences.salaryRange && userPreferences.salaryRange.min ? {
          $cond: [
            { $gte: ['$salary.min', userPreferences.salaryRange.min] },
            10,
            0
          ]
        } : 0
      ]
    };
    
    scoringStage.$addFields.finalScore = {
      $add: ['$relevanceScore', { $ifNull: ['$personalizedScore', 0] }]
    };
  } else {
    scoringStage.$addFields.finalScore = '$relevanceScore';
  }
  
  pipeline.push(scoringStage);
  
  // Stage 3: Sort
  let sortStage = {};
  switch (sortBy) {
    case 'date':
      sortStage = { $sort: { createdAt: -1 } };
      break;
    case 'salary':
      sortStage = { $sort: { 'salary.min': -1, createdAt: -1 } };
      break;
    case 'relevance':
    default:
      sortStage = { $sort: { finalScore: -1, createdAt: -1 } };
      break;
  }
  pipeline.push(sortStage);
  
  // Stage 4: Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  pipeline.push({ $skip: skip });
  pipeline.push({ $limit: parseInt(limit) });
  
  // Stage 5: Populate employer
  pipeline.push({
    $lookup: {
      from: 'users',
      localField: 'employer',
      foreignField: '_id',
      as: 'employer',
      pipeline: [
        { 
          $project: { 
            name: 1, 
            companyName: 1, 
            companyDescription: 1, 
            companyLogo: 1,
            companyWebsite: 1,
            industry: 1,
            companySize: 1
          } 
        }
      ]
    }
  });
  
  pipeline.push({ $unwind: '$employer' });
  
  return this.aggregate(pipeline);
};

// Static method for getting personalized recommendations
JobSchema.statics.getPersonalizedRecommendations = async function(userProfile, options = {}) {
  const { limit = 10, excludeIds = [] } = options;
  
  const userSkills = userProfile.skills || [];
  const userLocation = userProfile.location || '';
  const userPreferences = userProfile.preferences || {};
  const userExperience = userProfile.inferredExperienceLevel || 'Entry-level';
  
  const pipeline = [
    // Match active jobs, excluding already seen ones
    {
      $match: {
        status: 'active',
        _id: { $nin: excludeIds.map(id => mongoose.Types.ObjectId(id)) },
        $or: [
          { expiresAt: { $gt: new Date() } },
          { expiresAt: { $exists: false } }
        ]
      }
    },
    
    // Calculate comprehensive matching score
    {
      $addFields: {
        matchScore: {
          $add: [
            // Skills matching (40% weight)
            userSkills.length > 0 ? {
              $multiply: [
                {
                  $divide: [
                    {
                      $size: {
                        $setIntersection: [
                          { $map: { input: '$skills', as: 'skill', in: { $toLower: '$$skill' } } },
                          userSkills.map(skill => skill.toLowerCase())
                        ]
                      }
                    },
                    { $max: [{ $size: '$skills' }, 1] }
                  ]
                },
                40
              ]
            } : 0,
            
            // Location matching (20% weight)
            {
              $cond: [
                {
                  $or: [
                    userLocation ? { $regexMatch: { input: '$location', regex: userLocation, options: 'i' } } : false,
                    userPreferences.remoteWork ? '$isRemote' : false,
                    { $in: ['$location', userPreferences.preferredLocations || []] }
                  ]
                },
                20,
                0
              ]
            },
            
            // Experience level matching (15% weight)
            {
              $switch: {
                branches: [
                  { case: { $eq: ['$experience', userExperience] }, then: 15 },
                  { 
                    case: {
                      $or: [
                        { $and: [{ $eq: [userExperience, 'Entry-level'] }, { $eq: ['$experience', 'Mid-level'] }] },
                        { $and: [{ $eq: [userExperience, 'Mid-level'] }, { $in: ['$experience', ['Entry-level', 'Senior']] }] },
                        { $and: [{ $eq: [userExperience, 'Senior'] }, { $in: ['$experience', ['Mid-level', 'Executive']] }] }
                      ]
                    },
                    then: 8
                  }
                ],
                default: 0
              }
            },
            
            // Job type preferences (10% weight)
            {
              $cond: [
                userPreferences.jobTypes && userPreferences.jobTypes.length > 0 ? {
                  $in: ['$jobType', userPreferences.jobTypes]
                } : false,
                10,
                0
              ]
            },
            
            // Industry preferences (10% weight)
            {
              $cond: [
                userPreferences.industries && userPreferences.industries.length > 0 ? {
                  $in: ['$industry', userPreferences.industries]
                } : false,
                10,
                0
              ]
            },
            
            // Quality score (5% weight)
            { $multiply: [{ $divide: ['$aiMetadata.qualityScore', 100] }, 5] }
          ]
        }
      }
    },
    
    // Filter jobs with minimum relevance
    { $match: { matchScore: { $gte: 10 } } },
    
    // Sort by match score and quality
    { $sort: { matchScore: -1, 'aiMetadata.qualityScore': -1, createdAt: -1 } },
    
    // Limit results
    { $limit: limit },
    
    // Populate employer information
    {
      $lookup: {
        from: 'users',
        localField: 'employer',
        foreignField: '_id',
        as: 'employer',
        pipeline: [
          { 
            $project: { 
              name: 1, 
              companyName: 1, 
              companyDescription: 1, 
              companyLogo: 1,
              companyWebsite: 1,
              industry: 1,
              companySize: 1,
              location: 1
            } 
          }
        ]
      }
    },
    { $unwind: '$employer' },
    
    // Add recommendation metadata
    {
      $addFields: {
        recommendationScore: { $round: ['$matchScore', 0] },
        recommendationReasons: {
          $filter: {
            input: [
              {
                $cond: [
                  { $gte: [{ $size: { $setIntersection: [
                    { $map: { input: '$skills', as: 'skill', in: { $toLower: '$skill' } } },
                    userSkills.map(skill => skill.toLowerCase())
                  ]}}, 1] },
                  'Skills match your profile',
                  null
                ]
              },
              {
                $cond: [
                  userLocation && { $regexMatch: { input: '$location', regex: userLocation, options: 'i' } },
                  'Location matches your preference',
                  null
                ]
              },
              {
                $cond: [
                  { $eq: ['$experience', userExperience] },
                  'Experience level is a perfect match',
                  null
                ]
              },
              {
                $cond: [
                  userPreferences.jobTypes && { $in: ['$jobType', userPreferences.jobTypes] },
                  'Job type matches your preference',
                  null
                ]
              },
              {
                $cond: [
                  userPreferences.industries && { $in: ['$industry', userPreferences.industries] },
                  'Industry aligns with your interests',
                  null
                ]
              }
            ],
            cond: { $ne: ['$this', null] }
          }
        }
      }
    }
  ];
  
  return this.aggregate(pipeline);
};

// Static method for job analytics
JobSchema.statics.getJobAnalytics = function(filters = {}) {
  return this.aggregate([
    { $match: { status: 'active', ...filters } },
    {
      $group: {
        _id: null,
        totalJobs: { $sum: 1 },
        avgQualityScore: { $avg: '$aiMetadata.qualityScore' },
        avgSalaryMin: { $avg: '$salary.min' },
        avgSalaryMax: { $avg: '$salary.max' },
        totalViews: { $sum: '$viewCount' },
        totalApplications: { $sum: '$applicationCount' },
        jobTypeDistribution: {
          $push: '$jobType'
        },
        experienceDistribution: {
          $push: '$experience'
        },
        industryDistribution: {
          $push: '$industry'
        },
        topSkills: {
          $push: '$skills'
        },
        topLocations: {
          $push: '$location'
        }
      }
    },
    {
      $addFields: {
        avgApplicationRate: {
          $cond: [
            { $gt: ['$totalViews', 0] },
            { $multiply: [{ $divide: ['$totalApplications', '$totalViews'] }, 100] },
            0
          ]
        }
      }
    }
  ]);
};

// Instance method to check compatibility with user preferences
JobSchema.methods.calculateUserCompatibility = function(userProfile) {
  let compatibility = {
    score: 0,
    reasons: [],
    concerns: []
  };
  
  const userSkills = userProfile.skills || [];
  const userPreferences = userProfile.preferences || {};
  const userExperience = userProfile.inferredExperienceLevel || 'Entry-level';
  
  // Skills compatibility (40% weight)
  if (userSkills.length > 0) {
    const matchingSkills = this.skills.filter(skill =>
      userSkills.some(userSkill =>
        skill.toLowerCase().includes(userSkill.toLowerCase()) ||
        userSkill.toLowerCase().includes(skill.toLowerCase())
      )
    );
    
    const skillScore = (matchingSkills.length / userSkills.length) * 40;
    compatibility.score += skillScore;
    
    if (matchingSkills.length > 0) {
      compatibility.reasons.push(`${matchingSkills.length} of your skills match this role`);
    } else {
      compatibility.concerns.push('Limited skill overlap with your profile');
    }
  }
  
  // Location compatibility (20% weight)
  if (userProfile.location) {
    if (this.location.toLowerCase().includes(userProfile.location.toLowerCase()) || 
        this.isRemote || 
        (userPreferences.remoteWork && this.workArrangement === 'Remote')) {
      compatibility.score += 20;
      compatibility.reasons.push('Location aligns with your preferences');
    } else {
      compatibility.concerns.push('Location may not match your preference');
    }
  }
  
  // Experience compatibility (20% weight)
  const experienceLevels = ['Entry-level', 'Mid-level', 'Senior', 'Executive'];
  const userIndex = experienceLevels.indexOf(userExperience);
  const jobIndex = experienceLevels.indexOf(this.experience);
  
  if (userIndex === jobIndex) {
    compatibility.score += 20;
    compatibility.reasons.push('Perfect experience level match');
  } else if (Math.abs(userIndex - jobIndex) === 1) {
    compatibility.score += 10;
    compatibility.reasons.push('Compatible experience level');
  } else {
    compatibility.concerns.push('Experience level may not be ideal');
  }
  
  // Salary compatibility (10% weight)
  if (this.salary && this.salary.min && userPreferences.salaryRange && userPreferences.salaryRange.min) {
    if (this.salary.min >= userPreferences.salaryRange.min) {
      compatibility.score += 10;
      compatibility.reasons.push('Salary meets your expectations');
    } else {
      compatibility.concerns.push('Salary may be below your expectations');
    }
  }
  
  // Job type compatibility (10% weight)
  if (userPreferences.jobTypes && userPreferences.jobTypes.includes(this.jobType)) {
    compatibility.score += 10;
    compatibility.reasons.push('Job type matches your preference');
  }
  
  compatibility.score = Math.round(compatibility.score);
  return compatibility;
};

// Instance method to increment view count
JobSchema.methods.incrementView = function() {
  this.viewCount += 1;
  this.performance.impressions += 1;
  return this.save({ validateBeforeSave: false });
};

// Instance method to increment click count
JobSchema.methods.incrementClick = function() {
  this.clickCount += 1;
  this.performance.clicks += 1;
  this.updatePerformanceMetrics();
  return this.save({ validateBeforeSave: false });
};

// Instance method to increment application count
JobSchema.methods.incrementApplication = function() {
  this.applicationCount += 1;
  this.performance.applications += 1;
  this.updatePerformanceMetrics();
  return this.save({ validateBeforeSave: false });
};

// Instance method to increment save count
JobSchema.methods.incrementSave = function() {
  this.saveCount += 1;
  this.performance.saves += 1;
  return this.save({ validateBeforeSave: false });
};

// Static method for trending jobs
JobSchema.statics.getTrendingJobs = function(timeframe = 7, limit = 10) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - timeframe);
  
  return this.aggregate([
    {
      $match: {
        status: 'active',
        createdAt: { $gte: cutoffDate }
      }
    },
    {
      $addFields: {
        trendingScore: {
          $add: [
            { $multiply: ['$viewCount', 1] },
            { $multiply: ['$applicationCount', 5] },
            { $multiply: ['$saveCount', 3] },
            { $multiply: ['$clickCount', 2] }
          ]
        }
      }
    },
    { $sort: { trendingScore: -1, createdAt: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: 'employer',
        foreignField: '_id',
        as: 'employer',
        pipeline: [
          { $project: { name: 1, companyName: 1, companyLogo: 1 } }
        ]
      }
    },
    { $unwind: '$employer' }
  ]);
};

// Static method for similar jobs
JobSchema.statics.findSimilarJobs = function(jobId, limit = 5) {
  return this.aggregate([
    { $match: { _id: mongoose.Types.ObjectId(jobId) } },
    {
      $lookup: {
        from: 'jobs',
        let: { 
          jobSkills: '$skills', 
          jobIndustry: '$industry', 
          jobExperience: '$experience',
          currentId: '$_id'
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $ne: ['$_id', '$currentId'] },
                  { $eq: ['$status', 'active'] },
                  {
                    $or: [
                      { $eq: ['$industry', '$jobIndustry'] },
                      { $eq: ['$experience', '$jobExperience'] },
                      {
                        $gt: [
                          { $size: { $setIntersection: ['$skills', '$jobSkills'] } },
                          0
                        ]
                      }
                    ]
                  }
                ]
              }
            }
          },
          {
            $addFields: {
              similarityScore: {
                $add: [
                  { $cond: [{ $eq: ['$industry', '$jobIndustry'] }, 20, 0] },
                  { $cond: [{ $eq: ['$experience', '$jobExperience'] }, 15, 0] },
                  {
                    $multiply: [
                      { $size: { $setIntersection: ['$skills', '$jobSkills'] } },
                      5
                    ]
                  }
                ]
              }
            }
          },
          { $sort: { similarityScore: -1, createdAt: -1 } },
          { $limit: limit },
          {
            $lookup: {
              from: 'users',
              localField: 'employer',
              foreignField: '_id',
              as: 'employer',
              pipeline: [
                { $project: { name: 1, companyName: 1, companyLogo: 1 } }
              ]
            }
          },
          { $unwind: '$employer' }
        ],
        as: 'similarJobs'
      }
    },
    { $project: { similarJobs: 1 } },
    { $unwind: '$similarJobs' },
    { $replaceRoot: { newRoot: '$similarJobs' } }
  ]);
};

// Auto-expire jobs middleware
JobSchema.pre('save', function(next) {
  // Auto-expire jobs after deadline
  if (this.applicationDeadline && new Date() > this.applicationDeadline && this.status === 'active') {
    this.status = 'expired';
  }
  next();
});

// Post-save middleware for cleanup
JobSchema.post('save', function(doc) {
  // Update employer's job count
  this.model('User').findByIdAndUpdate(
    doc.employer,
    { $inc: { 'engagementMetrics.jobsPosted': 1 } },
    { upsert: false }
  ).exec();
});

// Index for automatic expiration
JobSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Job', JobSchema);