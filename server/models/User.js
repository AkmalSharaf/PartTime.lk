// models/User.js - FIXED Complete Enhanced User Model with Saved Jobs
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please add a name"],
    trim: true,
    maxlength: [50, "Name cannot exceed 50 characters"],
  },
  email: {
    type: String,
    required: [true, "Please add an email"],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "Please add a valid email",
    ],
  },
  phone: {
    type: String,
    match: [/^\+?[\d\s\-\(\)]+$/, "Please add a valid phone number"],
  },
  password: {
    type: String,
    required: [true, "Please add a password"],
    minlength: [6, "Password must be at least 6 characters"],
    select: false,
  },
  role: {
    type: String,
    enum: ["jobseeker", "employer", "admin"],
    required: [true, "Please specify a role"],
    default: "jobseeker",
  },

  // Profile Photo
  profilePhoto: {
    type: String,
    default: null,
  },
  profilePhotoFileName: {
    type: String,
    default: null,
  },

  // Job Seeker specific fields
  resume: {
    type: String,
    default: null,
  },
  resumeFileName: {
    type: String,
    default: null,
  },
  bio: {
    type: String,
    maxlength: [500, "Bio cannot exceed 500 characters"],
  },
  location: {
    type: String,
    maxlength: [100, "Location cannot exceed 100 characters"],
  },
  skills: [
    {
      type: String,
      trim: true,
    },
  ],

  // Enhanced experience with better AI processing
  experience: [
    {
      company: {
        type: String,
        required: function () {
          return this.role === "jobseeker" && this.experience?.length > 0;
        },
      },
      position: {
        type: String,
        required: function () {
          return this.role === "jobseeker" && this.experience?.length > 0;
        },
      },
      startDate: {
        type: Date,
        required: function () {
          return this.role === "jobseeker" && this.experience?.length > 0;
        },
      },
      endDate: {
        type: Date,
      },
      current: {
        type: Boolean,
        default: false,
      },
      description: {
        type: String,
        maxlength: [500, "Description cannot exceed 500 characters"],
      },
      // Enhanced fields for better recommendations
      industry: String,
      companySize: {
        type: String,
        enum: ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"],
      },
      achievements: [String],
      technologies: [String],
    },
  ],

  // Enhanced education
  education: [
    {
      institution: {
        type: String,
        required: function () {
          return this.role === "jobseeker" && this.education?.length > 0;
        },
      },
      degree: {
        type: String,
        required: function () {
          return this.role === "jobseeker" && this.education?.length > 0;
        },
      },
      fieldOfStudy: {
        type: String,
      },
      startDate: {
        type: Date,
        required: function () {
          return this.role === "jobseeker" && this.education?.length > 0;
        },
      },
      endDate: {
        type: Date,
      },
      current: {
        type: Boolean,
        default: false,
      },
      gpa: {
        type: Number,
        min: 0,
        max: 4,
      },
      // Enhanced fields
      honors: [String],
      relevantCoursework: [String],
    },
  ],

  // Enhanced portfolio
  portfolio: {
    website: {
      type: String,
      match: [/^https?:\/\/.+/, "Please provide a valid URL"],
    },
    linkedin: {
      type: String,
      match: [
        /^https?:\/\/(www\.)?linkedin\.com\/.+/,
        "Please provide a valid LinkedIn URL",
      ],
    },
    github: {
      type: String,
      match: [
        /^https?:\/\/(www\.)?github\.com\/.+/,
        "Please provide a valid GitHub URL",
      ],
    },
    portfolio: String,
    behance: String,
    dribbble: String,
  },

  // FIXED: Saved Jobs Schema - Properly integrated in User Model
  savedJobs: [{
    jobId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Job',
      required: true
    },
    savedAt: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: ''
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    applicationStatus: {
      type: String,
      enum: ['not_applied', 'planning_to_apply', 'applied', 'interview', 'rejected', 'offered'],
      default: 'not_applied'
    }
  }],

  // Employer specific fields
  companyName: {
    type: String,
    required: function () {
      return this.role === "employer";
    },
    maxlength: [100, "Company name cannot exceed 100 characters"],
  },
  companyDescription: {
    type: String,
    maxlength: [1000, "Company description cannot exceed 1000 characters"],
  },
  companyWebsite: {
    type: String,
    match: [/^https?:\/\/.+/, "Please provide a valid website URL"],
  },
  companyLogo: {
    type: String,
    default: null,
  },
  companyLogoFileName: {
    type: String,
    default: null,
  },
  companySize: {
    type: String,
    enum: ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"],
  },
  industry: {
    type: String,
    enum: [
      "Technology",
      "Healthcare",
      "Finance",
      "Education",
      "Manufacturing",
      "Retail",
      "Construction",
      "Transportation",
      "Hospitality",
      "Other",
    ],
  },

  // Common fields
  isActive: {
    type: Boolean,
    default: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: String,
  emailVerificationExpire: Date,
  resetPasswordToken: String,
  resetPasswordExpire: Date,

  // Enhanced subscription and premium features
  isPremium: {
    type: Boolean,
    default: false,
  },
  subscriptionType: {
    type: String,
    enum: ["free", "basic", "premium", "enterprise"],
    default: "free",
  },
  subscriptionExpire: Date,

  // Profile completion tracking
  profileCompleteness: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },

  // Activity tracking
  lastLogin: {
    type: Date,
    default: Date.now,
  },
  lastProfileUpdate: {
    type: Date,
    default: Date.now,
  },

  // ENHANCED AI-POWERED JOB RECOMMENDATION PREFERENCES
  preferences: {
    // Notification settings
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    smsNotifications: {
      type: Boolean,
      default: false,
    },
    jobAlerts: {
      type: Boolean,
      default: true,
    },
    marketingEmails: {
      type: Boolean,
      default: false,
    },

    // Core job preferences
    jobTypes: [
      {
        type: String,
        enum: [
          "Full-time",
          "Part-time",
          "Contract",
          "Internship",
          "Freelance",
          "Remote",
        ],
      },
    ],

    preferredLocations: [
      {
        type: String,
        trim: true,
      },
    ],

    salaryRange: {
      min: {
        type: Number,
        min: 0,
      },
      max: {
        type: Number,
        min: 0,
      },
      currency: {
        type: String,
        default: "USD",
        enum: ["USD", "EUR", "GBP", "CAD", "AUD", "INR", "JPY"],
      },
      negotiable: {
        type: Boolean,
        default: true,
      },
    },

    remoteWork: {
      type: Boolean,
      default: false,
    },

    industries: [
      {
        type: String,
        enum: [
          "Software",
          "Hardware",
          "Fintech",
          "Healthcare",
          "E-commerce",
          "Education",
          "Media",
          "Gaming",
          "AI/ML",
          "Blockchain",
          "SaaS",
          "Mobile",
          "Web Development",
          "Data Science",
          "DevOps",
          "Cybersecurity",
          "Cloud Computing",
          "Design",
          "Marketing",
          "Sales",
          "HR",
          "Finance",
          "Legal",
          "Consulting",
          "Manufacturing",
          "Other",
        ],
      },
    ],

    experienceLevel: {
      type: String,
      enum: ["Entry-level", "Mid-level", "Senior", "Executive", "Intern"],
    },

    workEnvironment: [
      {
        type: String,
        enum: [
          "Startup",
          "Corporate",
          "Agency",
          "Non-profit",
          "Government",
          "Freelance",
        ],
      },
    ],

    companySize: [
      {
        type: String,
        enum: ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"],
      },
    ],

    benefits: [
      {
        type: String,
        enum: [
          "Health Insurance",
          "Dental Insurance",
          "Vision Insurance",
          "Retirement Plan",
          "Paid Time Off",
          "Flexible Hours",
          "Remote Work",
          "Professional Development",
          "Stock Options",
          "Gym Membership",
          "Free Meals",
          "Transportation",
          "Childcare",
          "Mental Health Support",
          "Learning Budget",
          "Conference Attendance",
        ],
      },
    ],

    // Advanced AI preferences
    preferredTechnologies: [
      {
        type: String,
        trim: true,
      },
    ],

    avoidKeywords: [
      {
        type: String,
        trim: true,
      },
    ],

    careerGoals: {
      shortTerm: {
        type: String,
        maxlength: 500,
      },
      longTerm: {
        type: String,
        maxlength: 500,
      },
    },

    // Work-life balance preferences
    workLifeBalance: {
      importance: {
        type: Number,
        min: 1,
        max: 5,
        default: 3,
      },
      maxHoursPerWeek: {
        type: Number,
        min: 20,
        max: 80,
      },
      flexibleSchedule: {
        type: Boolean,
        default: false,
      },
      overtimeAcceptable: {
        type: Boolean,
        default: true,
      },
    },

    // Travel preferences
    travelWillingness: {
      type: String,
      enum: ["none", "minimal", "occasional", "frequent"],
      default: "occasional",
    },

    // Job search urgency
    jobSearchUrgency: {
      type: String,
      enum: [
        "not_looking",
        "passively_looking",
        "actively_looking",
        "urgently_looking",
      ],
      default: "passively_looking",
    },

    // Preferred communication methods
    preferredContactMethods: [
      {
        type: String,
        enum: ["email", "phone", "linkedin", "text"],
      },
    ],

    // Availability
    availability: {
      immediateStart: {
        type: Boolean,
        default: false,
      },
      noticePeriod: {
        type: Number, // in weeks
        default: 2,
      },
      preferredStartDate: Date,
    },

    // Interview preferences
    interviewPreferences: {
      timeSlots: [
        {
          day: {
            type: String,
            enum: [
              "monday",
              "tuesday",
              "wednesday",
              "thursday",
              "friday",
              "saturday",
              "sunday",
            ],
          },
          startTime: String, // HH:MM format
          endTime: String, // HH:MM format
        },
      ],
      timeZone: {
        type: String,
        default: "UTC",
      },
      virtualInterviewOk: {
        type: Boolean,
        default: true,
      },
    },

    // Last updated timestamp
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },

  // AI Learning Data for Personalization
  aiProfile: {
    // Job interaction history for ML
    jobInteractions: [
      {
        jobId: {
          type: mongoose.Schema.ObjectId,
          ref: "Job",
        },
        action: {
          type: String,
          enum: [
            "viewed",
            "saved",
            "applied",
            "rejected",
            "interview",
            "hired",
          ],
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        feedback: {
          rating: Number, // 1-5 stars
          reason: String,
        },
      },
    ],

    // Search behavior patterns
    searchPatterns: [
      {
        query: String,
        timestamp: Date,
        resultsClicked: Number,
        timeSpent: Number, // seconds
      },
    ],

    // Computed preferences based on behavior
    inferredPreferences: {
      skillsOfInterest: [String],
      companiesOfInterest: [String],
      salaryExpectations: {
        min: Number,
        max: Number,
      },
      locationFlexibility: Number, // 1-5 scale
      lastComputed: Date,
    },

    // Recommendation feedback
    recommendationFeedback: [
      {
        jobId: {
          type: mongoose.Schema.ObjectId,
          ref: "Job",
        },
        liked: Boolean,
        reason: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // ML model scores
    personalityVector: [Number], // For advanced ML matching
    careerStage: String,
    riskTolerance: Number, // 1-5, for startup vs corporate preference
  },

  // Social login
  googleId: String,
  linkedinId: String,

  // Analytics and engagement
  profileViews: {
    type: Number,
    default: 0,
  },
  searchAppearances: {
    type: Number,
    default: 0,
  },

  // Engagement metrics
  engagementMetrics: {
    jobsViewed: {
      type: Number,
      default: 0,
    },
    jobsApplied: {
      type: Number,
      default: 0,
    },
    jobsSaved: {
      type: Number,
      default: 0,
    },
    profileUpdates: {
      type: Number,
      default: 0,
    },
    lastActiveDate: {
      type: Date,
      default: Date.now,
    },
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for better query performance
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1 });
UserSchema.index({ location: 1 });
UserSchema.index({ skills: 1 });
UserSchema.index({ companyName: 1 });
UserSchema.index({ industry: 1 });
UserSchema.index({ isActive: 1, isVerified: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ "preferences.industries": 1 });
UserSchema.index({ "preferences.jobTypes": 1 });
UserSchema.index({ "preferences.preferredLocations": 1 });
UserSchema.index({ "preferences.salaryRange.min": 1 });
UserSchema.index({ "preferences.salaryRange.max": 1 });
UserSchema.index({ "aiProfile.careerStage": 1 });
UserSchema.index({ "engagementMetrics.lastActiveDate": -1 });
UserSchema.index({ "savedJobs.jobId": 1 }); // FIXED: Index for saved jobs

// Text search index for user profiles
UserSchema.index(
  {
    name: "text",
    bio: "text",
    skills: "text",
    companyName: "text",
    companyDescription: "text",
  },
  {
    weights: {
      name: 10,
      skills: 8,
      companyName: 6,
      bio: 4,
      companyDescription: 2,
    },
  }
);

// Virtual for full profile photo URL
UserSchema.virtual("profilePhotoUrl").get(function () {
  if (this.profilePhoto) {
    return `${process.env.BASE_URL || "http://localhost:5000"}/${
      this.profilePhoto
    }`;
  }
  return null;
});

// Virtual for full resume URL
UserSchema.virtual("resumeUrl").get(function () {
  if (this.resume) {
    return `${process.env.BASE_URL || "http://localhost:5000"}/${this.resume}`;
  }
  return null;
});

// Virtual for full company logo URL
UserSchema.virtual("companyLogoUrl").get(function () {
  if (this.companyLogo) {
    return `${process.env.BASE_URL || "http://localhost:5000"}/${
      this.companyLogo
    }`;
  }
  return null;
});

// Virtual for current experience
UserSchema.virtual("currentExperience").get(function () {
  if (this.role === "jobseeker" && this.experience) {
    return this.experience.find((exp) => exp.current === true);
  }
  return null;
});

// Virtual for total years of experience
UserSchema.virtual("totalExperience").get(function () {
  if (this.role === "jobseeker" && this.experience) {
    let totalYears = 0;
    this.experience.forEach((exp) => {
      const startDate = new Date(exp.startDate);
      const endDate = exp.current ? new Date() : new Date(exp.endDate);
      const years = Math.max(
        0,
        (endDate - startDate) / (1000 * 60 * 60 * 24 * 365)
      );
      totalYears += years;
    });
    return Math.round(totalYears * 10) / 10; // Round to 1 decimal place
  }
  return 0;
});

// Virtual for inferred experience level
UserSchema.virtual("inferredExperienceLevel").get(function () {
  const totalYears = this.totalExperience;

  if (totalYears < 1) return "Entry-level";
  if (totalYears < 3) return "Mid-level";
  if (totalYears < 8) return "Senior";
  return "Executive";
});

// Virtual for current education
UserSchema.virtual("currentEducation").get(function () {
  if (this.role === "jobseeker" && this.education) {
    return this.education.find((edu) => edu.current === true);
  }
  return null;
});

// Virtual for recommendation readiness score
UserSchema.virtual("recommendationReadiness").get(function () {
  let score = 0;

  // Profile completeness (40%)
  score += (this.profileCompleteness || 0) * 0.4;

  // Preferences completeness (30%)
  const prefs = this.preferences || {};
  let prefScore = 0;
  if (prefs.jobTypes && prefs.jobTypes.length > 0) prefScore += 25;
  if (prefs.industries && prefs.industries.length > 0) prefScore += 25;
  if (prefs.preferredLocations && prefs.preferredLocations.length > 0)
    prefScore += 25;
  if (prefs.salaryRange && prefs.salaryRange.min) prefScore += 25;
  score += prefScore * 0.3;

  // Activity level (30%)
  const engagement = this.engagementMetrics || {};
  let activityScore = 0;
  if (engagement.jobsViewed > 0) activityScore += 33;
  if (engagement.jobsApplied > 0) activityScore += 33;
  if (
    engagement.lastActiveDate &&
    (new Date() - engagement.lastActiveDate) / (1000 * 60 * 60 * 24) < 30
  )
    activityScore += 34;
  score += activityScore * 0.3;

  return Math.round(score);
});

// Pre-save middleware
UserSchema.pre("save", async function (next) {
  // Update timestamp
  this.updatedAt = Date.now();

  // Hash password if modified
  if (!this.isModified("password")) {
    // Calculate profile completeness
    this.profileCompleteness = this.calculateProfileCompleteness();

    // Update AI profile data
    this.updateAIProfile();

    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

  // Calculate profile completeness
  this.profileCompleteness = this.calculateProfileCompleteness();

  // Update AI profile data
  this.updateAIProfile();

  next();
});

// Method to calculate enhanced profile completeness
UserSchema.methods.calculateProfileCompleteness = function () {
  let completeness = 0;
  const weights = {
    basic: 25, // name, email, phone, bio, location
    files: 20, // profile photo, resume/logo
    detailed: 30, // skills, experience/company info
    portfolio: 15, // social links, website
    preferences: 10, // job preferences
  };

  // Basic information (25%)
  let basicScore = 0;
  if (this.name) basicScore += 5;
  if (this.email) basicScore += 5;
  if (this.phone) basicScore += 5;
  if (this.bio) basicScore += 5;
  if (this.location) basicScore += 5;
  completeness += Math.min(basicScore, weights.basic);

  // Files (20%)
  let filesScore = 0;
  if (this.profilePhoto) filesScore += 10;
  if (this.role === "jobseeker" && this.resume) filesScore += 10;
  if (this.role === "employer" && this.companyLogo) filesScore += 10;
  completeness += Math.min(filesScore, weights.files);

  // Detailed information (30%)
  let detailedScore = 0;
  if (this.role === "jobseeker") {
    if (this.skills && this.skills.length >= 3) detailedScore += 10;
    if (this.experience && this.experience.length > 0) detailedScore += 10;
    if (this.education && this.education.length > 0) detailedScore += 10;
  } else if (this.role === "employer") {
    if (this.companyName) detailedScore += 10;
    if (this.companyDescription) detailedScore += 10;
    if (this.industry) detailedScore += 5;
    if (this.companySize) detailedScore += 5;
  }
  completeness += Math.min(detailedScore, weights.detailed);

  // Portfolio/Links (15%)
  let portfolioScore = 0;
  if (this.portfolio) {
    if (this.portfolio.website) portfolioScore += 5;
    if (this.portfolio.linkedin) portfolioScore += 5;
    if (this.portfolio.github) portfolioScore += 5;
  }
  if (this.role === "employer" && this.companyWebsite) portfolioScore += 10;
  completeness += Math.min(portfolioScore, weights.portfolio);

  // Preferences (10%) - for job seekers
  let preferencesScore = 0;
  if (this.role === "jobseeker" && this.preferences) {
    if (this.preferences.jobTypes && this.preferences.jobTypes.length > 0)
      preferencesScore += 3;
    if (this.preferences.industries && this.preferences.industries.length > 0)
      preferencesScore += 3;
    if (
      this.preferences.preferredLocations &&
      this.preferences.preferredLocations.length > 0
    )
      preferencesScore += 2;
    if (this.preferences.salaryRange && this.preferences.salaryRange.min)
      preferencesScore += 2;
  }
  completeness += Math.min(preferencesScore, weights.preferences);

  return Math.round(completeness);
};

// Method to update AI profile data
UserSchema.methods.updateAIProfile = function () {
  if (!this.aiProfile) {
    this.aiProfile = {
      jobInteractions: [],
      searchPatterns: [],
      inferredPreferences: {},
      recommendationFeedback: [],
      personalityVector: [],
      careerStage: "exploring",
      riskTolerance: 3,
    };
  }

  // Infer career stage based on experience
  const totalExp = this.totalExperience;
  if (totalExp < 1) {
    this.aiProfile.careerStage = "entry";
  } else if (totalExp < 3) {
    this.aiProfile.careerStage = "growing";
  } else if (totalExp < 8) {
    this.aiProfile.careerStage = "established";
  } else {
    this.aiProfile.careerStage = "senior";
  }

  // Update inferred preferences based on profile
  if (!this.aiProfile.inferredPreferences) {
    this.aiProfile.inferredPreferences = {};
  }

  this.aiProfile.inferredPreferences.skillsOfInterest = this.skills || [];
  this.aiProfile.inferredPreferences.lastComputed = new Date();
};

// Method to add job interaction for AI learning
UserSchema.methods.addJobInteraction = function (
  jobId,
  action,
  feedback = null
) {
  if (!this.aiProfile) {
    this.updateAIProfile();
  }

  const interaction = {
    jobId: jobId,
    action: action,
    timestamp: new Date(),
    feedback: feedback,
  };

  this.aiProfile.jobInteractions.push(interaction);

  // Keep only last 100 interactions
  if (this.aiProfile.jobInteractions.length > 100) {
    this.aiProfile.jobInteractions = this.aiProfile.jobInteractions.slice(-100);
  }

  // Update engagement metrics
  if (!this.engagementMetrics) {
    this.engagementMetrics = {
      jobsViewed: 0,
      jobsApplied: 0,
      jobsSaved: 0,
      profileUpdates: 0,
      lastActiveDate: new Date(),
    };
  }

  switch (action) {
    case "viewed":
      this.engagementMetrics.jobsViewed += 1;
      break;
    case "applied":
      this.engagementMetrics.jobsApplied += 1;
      break;
    case "saved":
      this.engagementMetrics.jobsSaved += 1;
      break;
  }

  this.engagementMetrics.lastActiveDate = new Date();
};

// Method to sign JWT token
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign(
    {
      id: this._id,
      role: this.role,
      email: this.email,
    },
    process.env.JWT_SECRET || "your-secret-key",
    {
      expiresIn: process.env.JWT_EXPIRE || "30d",
    }
  );
};

// Method to match password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to get reset password token
UserSchema.methods.getResetPasswordToken = function () {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString("hex");

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Set expire
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

// Method to get email verification token
UserSchema.methods.getEmailVerificationToken = function () {
  const verificationToken = crypto.randomBytes(20).toString("hex");

  this.emailVerificationToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  return verificationToken;
};

// Method to check if user can receive premium recommendations
UserSchema.methods.canAccessPremiumFeatures = function () {
  if (this.subscriptionType === "free") return false;
  if (this.subscriptionExpire && new Date() > this.subscriptionExpire)
    return false;
  return true;
};

// Method to get preference completion percentage
UserSchema.methods.getPreferenceCompleteness = function () {
  if (this.role !== "jobseeker" || !this.preferences) return 0;

  const prefs = this.preferences;
  let completed = 0;
  let total = 8; // Total preference categories

  if (prefs.jobTypes && prefs.jobTypes.length > 0) completed++;
  if (prefs.industries && prefs.industries.length > 0) completed++;
  if (prefs.preferredLocations && prefs.preferredLocations.length > 0)
    completed++;
  if (prefs.salaryRange && prefs.salaryRange.min) completed++;
  if (prefs.workEnvironment && prefs.workEnvironment.length > 0) completed++;
  if (prefs.benefits && prefs.benefits.length > 0) completed++;
  if (prefs.experienceLevel) completed++;
  if (prefs.remoteWork !== undefined) completed++;

  return Math.round((completed / total) * 100);
};

// Method to update user activity
UserSchema.methods.updateActivity = function (activityType = "general") {
  if (!this.engagementMetrics) {
    this.engagementMetrics = {
      jobsViewed: 0,
      jobsApplied: 0,
      jobsSaved: 0,
      profileUpdates: 0,
      lastActiveDate: new Date(),
    };
  }

  this.engagementMetrics.lastActiveDate = new Date();
  this.lastLogin = new Date();

  if (activityType === "profile_update") {
    this.engagementMetrics.profileUpdates += 1;
    this.lastProfileUpdate = new Date();
  }
};

// Ensure virtual fields are serialized
UserSchema.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret.password;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpire;
    delete ret.emailVerificationToken;
    delete ret.emailVerificationExpire;

    // Remove sensitive AI profile data in public responses
    if (ret.aiProfile) {
      delete ret.aiProfile.personalityVector;
      delete ret.aiProfile.recommendationFeedback;
    }

    return ret;
  },
});

UserSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("User", UserSchema);