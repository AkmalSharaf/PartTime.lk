// models/Application.js - Enhanced Application model
const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.ObjectId,
    ref: 'Job',
    required: [true, 'Job reference is required']
  },
  applicant: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Applicant reference is required']
  },
  
  // Application content
  coverLetter: {
    type: String,
    maxlength: [2000, 'Cover letter cannot exceed 2000 characters']
  },
  
  // File uploads
  resume: {
    type: String, // URL to resume file (can be user's default or application-specific)
    required: [true, 'Resume is required']
  },
  coverLetterFile: {
    type: String // URL to uploaded cover letter file (optional)
  },
  
  // Additional application data
  additionalInfo: {
    type: String,
    maxlength: [1000, 'Additional information cannot exceed 1000 characters']
  },
  expectedSalary: {
    type: Number,
    min: [0, 'Expected salary cannot be negative']
  },
  availableStartDate: {
    type: Date
  },
  
  // Portfolio and additional links
  portfolioLinks: [{
    name: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true,
      match: [/^https?:\/\/.+/, 'Please provide a valid URL']
    }
  }],
  
  // Custom questions and answers (if job has specific questions)
  customQuestions: [{
    question: {
      type: String,
      required: true
    },
    answer: {
      type: String,
      required: true,
      maxlength: [500, 'Answer cannot exceed 500 characters']
    }
  }],
  
  // Application status tracking
  status: {
    type: String,
    enum: [
      'pending',           // Just submitted
      'reviewing',         // Being reviewed by employer
      'shortlisted',       // Moved to shortlist
      'interview-scheduled', // Interview scheduled
      'interviewed',       // Interview completed
      'under-consideration', // Final consideration
      'accepted',          // Job offer made
      'rejected',          // Application rejected
      'withdrawn'          // Withdrawn by applicant
    ],
    default: 'pending'
  },
  
  // Status history for tracking changes
  statusHistory: [{
    status: {
      type: String,
      required: true
    },
    changedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    notes: String
  }],
  
  // Employer feedback and notes
  employerNotes: {
    type: String,
    maxlength: [1000, 'Employer notes cannot exceed 1000 characters']
  },
  
  // Interview details
  interviewDate: {
    type: Date
  },
  interviewLocation: {
    type: String,
    maxlength: [200, 'Interview location cannot exceed 200 characters']
  },
  interviewType: {
    type: String,
    enum: ['in-person', 'phone', 'video', 'group', 'panel'],
    default: 'in-person'
  },
  interviewNotes: {
    type: String,
    maxlength: [1000, 'Interview notes cannot exceed 1000 characters']
  },
  
  // Rating and scoring
  employerRating: {
    overall: {
      type: Number,
      min: 1,
      max: 5
    },
    skills: {
      type: Number,
      min: 1,
      max: 5
    },
    experience: {
      type: Number,
      min: 1,
      max: 5
    },
    communication: {
      type: Number,
      min: 1,
      max: 5
    },
    cultural_fit: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  
  // Application source tracking
  source: {
    type: String,
    enum: ['direct', 'job-board', 'referral', 'social-media', 'company-website', 'other'],
    default: 'direct'
  },
  referredBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  
  // Communication tracking
  messages: [{
    sender: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },
    recipient: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },
    subject: {
      type: String,
      required: true,
      maxlength: [200, 'Subject cannot exceed 200 characters']
    },
    message: {
      type: String,
      required: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters']
    },
    sentAt: {
      type: Date,
      default: Date.now
    },
    read: {
      type: Boolean,
      default: false
    },
    readAt: Date
  }],
  
  // Application metadata
  appliedAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  viewedByEmployer: {
    type: Boolean,
    default: false
  },
  viewedByEmployerAt: Date,
  
  // Analytics and tracking
  applicationViews: {
    type: Number,
    default: 0
  },
  resumeDownloads: {
    type: Number,
    default: 0
  },
  
  // Rejection feedback
  rejectionReason: {
    type: String,
    enum: [
      'insufficient-experience',
      'skills-mismatch',
      'overqualified',
      'salary-expectations',
      'location-constraints',
      'position-filled',
      'better-candidate',
      'other'
    ]
  },
  rejectionFeedback: {
    type: String,
    maxlength: [500, 'Rejection feedback cannot exceed 500 characters']
  },
  
  // Application completion tracking
  isComplete: {
    type: Boolean,
    default: true
  },
  completedSteps: [{
    step: String,
    completedAt: {
      type: Date,
      default: Date.now
    }
  }]
});

// Compound indexes for better query performance
ApplicationSchema.index({ job: 1, applicant: 1 }, { unique: true }); // Prevent duplicate applications
ApplicationSchema.index({ applicant: 1, appliedAt: -1 }); // For user's applications
ApplicationSchema.index({ job: 1, status: 1, appliedAt: -1 }); // For employer's job applications
ApplicationSchema.index({ status: 1, appliedAt: -1 }); // For status-based queries
ApplicationSchema.index({ appliedAt: -1 }); // For date-based sorting
ApplicationSchema.index({ 'employerRating.overall': -1 }); // For rating-based queries

// Text search index for searching application content
ApplicationSchema.index({
  coverLetter: 'text',
  additionalInfo: 'text',
  employerNotes: 'text',
  'customQuestions.answer': 'text'
});

// Virtual for formatted application date
ApplicationSchema.virtual('formattedAppliedDate').get(function() {
  return this.appliedAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Virtual for days since application
ApplicationSchema.virtual('daysSinceApplied').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.appliedAt);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for application status color (for UI purposes)
ApplicationSchema.virtual('statusColor').get(function() {
  const colors = {
    'pending': 'yellow',
    'reviewing': 'blue',
    'shortlisted': 'purple',
    'interview-scheduled': 'indigo',
    'interviewed': 'pink',
    'under-consideration': 'orange',
    'accepted': 'green',
    'rejected': 'red',
    'withdrawn': 'gray'
  };
  return colors[this.status] || 'gray';
});

// Virtual for overall employer rating
ApplicationSchema.virtual('overallRating').get(function() {
  if (!this.employerRating || !this.employerRating.overall) return null;
  
  const ratings = this.employerRating;
  const scores = [
    ratings.overall,
    ratings.skills,
    ratings.experience,
    ratings.communication,
    ratings.cultural_fit
  ].filter(score => score !== undefined && score !== null);
  
  if (scores.length === 0) return null;
  
  const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  return Math.round(average * 10) / 10; // Round to 1 decimal place
});

// Virtual for interview status
ApplicationSchema.virtual('interviewStatus').get(function() {
  if (!this.interviewDate) return 'not-scheduled';
  
  const now = new Date();
  const interviewDate = new Date(this.interviewDate);
  
  if (interviewDate > now) return 'scheduled';
  if (this.status === 'interviewed') return 'completed';
  return 'pending';
});

// Pre-save middleware
ApplicationSchema.pre('save', function(next) {
  // Update timestamp
  this.updatedAt = Date.now();
  
  // Add status change to history if status is modified
  if (this.isModified('status') && !this.isNew) {
    this.statusHistory.push({
      status: this.status,
      changedBy: this.modifiedBy || this.applicant, // Set modifiedBy in controller
      changedAt: new Date(),
      notes: this.statusChangeNotes || ''
    });
  }
  
  // Set viewedByEmployer timestamp
  if (this.isModified('viewedByEmployer') && this.viewedByEmployer && !this.viewedByEmployerAt) {
    this.viewedByEmployerAt = new Date();
  }
  
  next();
});

// Instance method to update status with history
ApplicationSchema.methods.updateStatus = function(newStatus, changedBy, notes = '') {
  this.status = newStatus;
  this.modifiedBy = changedBy;
  this.statusChangeNotes = notes;
  return this.save();
};

// Instance method to add message
ApplicationSchema.methods.addMessage = function(sender, recipient, subject, message) {
  this.messages.push({
    sender,
    recipient,
    subject,
    message,
    sentAt: new Date()
  });
  return this.save();
};

// Instance method to mark message as read
ApplicationSchema.methods.markMessageAsRead = function(messageId) {
  const message = this.messages.id(messageId);
  if (message) {
    message.read = true;
    message.readAt = new Date();
    return this.save();
  }
  return Promise.reject(new Error('Message not found'));
};

// Instance method to calculate match score (if needed for analytics)
ApplicationSchema.methods.calculateMatchScore = async function() {
  // This would be implemented based on job requirements vs applicant profile
  // For now, return a placeholder
  return Math.floor(Math.random() * 40) + 60; // Random score between 60-100
};

// Static method to get application statistics
ApplicationSchema.statics.getApplicationStats = async function(filters = {}) {
  const pipeline = [
    { $match: filters },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgDaysSinceApplied: {
          $avg: {
            $divide: [
              { $subtract: [new Date(), '$appliedAt'] },
              1000 * 60 * 60 * 24
            ]
          }
        }
      }
    },
    { $sort: { count: -1 } }
  ];
  
  const stats = await this.aggregate(pipeline);
  
  const totalApplications = stats.reduce((total, stat) => total + stat.count, 0);
  
  return {
    total: totalApplications,
    byStatus: stats,
    conversionRates: {
      // Calculate conversion rates between statuses
      reviewRate: this.calculateConversionRate(stats, 'pending', 'reviewing'),
      shortlistRate: this.calculateConversionRate(stats, 'reviewing', 'shortlisted'),
      interviewRate: this.calculateConversionRate(stats, 'shortlisted', 'interview-scheduled'),
      acceptanceRate: this.calculateConversionRate(stats, 'interviewed', 'accepted')
    }
  };
};

// Helper method for conversion rate calculation
ApplicationSchema.statics.calculateConversionRate = function(stats, fromStatus, toStatus) {
  const fromCount = stats.find(s => s._id === fromStatus)?.count || 0;
  const toCount = stats.find(s => s._id === toStatus)?.count || 0;
  
  if (fromCount === 0) return 0;
  return Math.round((toCount / fromCount) * 100 * 100) / 100; // Round to 2 decimal places
};

// Static method to get applications by date range
ApplicationSchema.statics.getApplicationsByDateRange = async function(startDate, endDate, groupBy = 'day') {
  const groupFormat = {
    day: { $dateToString: { format: '%Y-%m-%d', date: '$appliedAt' } },
    week: { $dateToString: { format: '%Y-W%U', date: '$appliedAt' } },
    month: { $dateToString: { format: '%Y-%m', date: '$appliedAt' } }
  };
  
  const pipeline = [
    {
      $match: {
        appliedAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    },
    {
      $group: {
        _id: groupFormat[groupBy],
        count: { $sum: 1 },
        statuses: { $push: '$status' }
      }
    },
    { $sort: { _id: 1 } }
  ];
  
  return await this.aggregate(pipeline);
};

// Ensure virtual fields are serialized
ApplicationSchema.set('toJSON', { 
  virtuals: true,
  transform: function(doc, ret) {
    // Remove sensitive information
    delete ret.__v;
    return ret;
  }
});

ApplicationSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Application', ApplicationSchema);