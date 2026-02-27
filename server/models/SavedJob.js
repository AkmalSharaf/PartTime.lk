// models/SavedJob.js - Model for saved jobs functionality
const mongoose = require('mongoose');

const SavedJobSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  job: {
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
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  tags: [{
    type: String,
    trim: true
  }],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  applicationStatus: {
    type: String,
    enum: ['not_applied', 'planning_to_apply', 'applied', 'interview', 'rejected', 'offered'],
    default: 'not_applied'
  },
  reminderDate: {
    type: Date
  },
  lastViewed: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure user can't save the same job twice
SavedJobSchema.index({ user: 1, job: 1 }, { unique: true });

// Index for efficient queries
SavedJobSchema.index({ user: 1, savedAt: -1 });
SavedJobSchema.index({ user: 1, priority: -1 });
SavedJobSchema.index({ user: 1, applicationStatus: 1 });

// Virtual for days since saved
SavedJobSchema.virtual('daysSaved').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.savedAt);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Static method to get user's saved jobs with analytics
SavedJobSchema.statics.getUserSavedJobsWithAnalytics = async function(userId, options = {}) {
  const { page = 1, limit = 10, status, priority, sortBy = 'savedAt' } = options;
  
  let matchQuery = { user: userId };
  
  if (status) matchQuery.applicationStatus = status;
  if (priority) matchQuery.priority = priority;
  
  let sortOptions = {};
  switch (sortBy) {
    case 'priority':
      sortOptions = { priority: -1, savedAt: -1 };
      break;
    case 'lastViewed':
      sortOptions = { lastViewed: -1 };
      break;
    default:
      sortOptions = { savedAt: -1 };
  }
  
  const skip = (page - 1) * limit;
  
  const pipeline = [
    { $match: matchQuery },
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
      $lookup: {
        from: 'users',
        localField: 'jobDetails.employer',
        foreignField: '_id',
        as: 'employer'
      }
    },
    { $unwind: '$employer' },
    { $sort: sortOptions },
    { $skip: skip },
    { $limit: limit }
  ];
  
  const savedJobs = await this.aggregate(pipeline);
  const total = await this.countDocuments(matchQuery);
  
  return {
    savedJobs,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
      limit
    }
  };
};

SavedJobSchema.set('toJSON', { virtuals: true });
SavedJobSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('SavedJob', SavedJobSchema);