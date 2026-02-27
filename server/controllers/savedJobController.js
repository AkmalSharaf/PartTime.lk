// controllers/savedJobController.js - COMPLETELY FIXED Implementation
const User = require('../models/User');
const Job = require('../models/Job');
const mongoose = require('mongoose');

// @desc    Get user's saved jobs
// @route   GET /api/jobs/saved
// @access  Private (Job seeker only)
exports.getSavedJobs = async (req, res) => {
  try {
    console.log('🔖 Getting saved jobs for user:', req.user.id);
    
    if (req.user.role !== 'jobseeker') {
      return res.status(403).json({
        success: false,
        message: 'Only job seekers can access saved jobs'
      });
    }

    const { page = 1, limit = 10, sortBy = 'savedAt' } = req.query;
    
    // FIXED: Use aggregation pipeline for proper population
    console.log('📊 Using aggregation pipeline to get saved jobs...');
    
    const pipeline = [
      // Match the user
      { $match: { _id: new mongoose.Types.ObjectId(req.user.id) } },
      
      // Unwind savedJobs array
      { $unwind: { path: '$savedJobs', preserveNullAndEmptyArrays: true } },
      
      // Add match stage to filter out null savedJobs
      { $match: { savedJobs: { $exists: true, $ne: null } } },
      
      // Lookup job details
      {
        $lookup: {
          from: 'jobs',
          localField: 'savedJobs.jobId',
          foreignField: '_id',
          as: 'jobDetails'
        }
      },
      
      // Unwind job details
      { $unwind: { path: '$jobDetails', preserveNullAndEmptyArrays: false } },
      
      // Filter only active jobs
      { $match: { 'jobDetails.status': 'active' } },
      
      // Lookup employer details
      {
        $lookup: {
          from: 'users',
          localField: 'jobDetails.employer',
          foreignField: '_id',
          as: 'employer'
        }
      },
      
      // Unwind employer
      { $unwind: { path: '$employer', preserveNullAndEmptyArrays: true } },
      
      // Project the final structure
      {
        $project: {
          _id: '$jobDetails._id',
          title: '$jobDetails.title',
          company: '$jobDetails.company',
          location: '$jobDetails.location',
          jobType: '$jobDetails.jobType',
          experience: '$jobDetails.experience',
          salary: '$jobDetails.salary',
          industry: '$jobDetails.industry',
          skills: '$jobDetails.skills',
          description: '$jobDetails.description',
          status: '$jobDetails.status',
          createdAt: '$jobDetails.createdAt',
          viewCount: '$jobDetails.viewCount',
          applicationCount: '$jobDetails.applicationCount',
          saveCount: '$jobDetails.saveCount',
          workArrangement: '$jobDetails.workArrangement',
          isRemote: '$jobDetails.isRemote',
          benefits: '$jobDetails.benefits',
          applicationDeadline: '$jobDetails.applicationDeadline',
          employer: {
            _id: '$employer._id',
            name: '$employer.name',
            companyName: '$employer.companyName',
            companyDescription: '$employer.companyDescription',
            companyLogo: '$employer.companyLogo',
            companyWebsite: '$employer.companyWebsite',
            industry: '$employer.industry',
            companySize: '$employer.companySize'
          },
          // Saved job specific fields
          savedAt: '$savedJobs.savedAt',
          notes: '$savedJobs.notes',
          priority: '$savedJobs.priority',
          applicationStatus: '$savedJobs.applicationStatus'
        }
      }
    ];
    
    // Add sorting
    let sortOptions = {};
    switch (sortBy) {
      case 'title':
        sortOptions = { title: 1 };
        break;
      case 'company':
        sortOptions = { company: 1 };
        break;
      case 'salary':
        sortOptions = { 'salary.min': -1 };
        break;
      case 'date':
        sortOptions = { createdAt: -1 };
        break;
      case 'savedAt':
      default:
        sortOptions = { savedAt: -1 };
        break;
    }
    pipeline.push({ $sort: sortOptions });
    
    // Get total count
    const countPipeline = [...pipeline];
    countPipeline.push({ $count: 'total' });
    const countResult = await User.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;
    
    // Add pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: parseInt(limit) });
    
    // Execute the aggregation
    const savedJobs = await User.aggregate(pipeline);
    
    console.log(`✅ Found ${savedJobs.length} saved jobs out of ${total} total`);

    res.status(200).json({
      success: true,
      count: savedJobs.length,
      total,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit),
        hasNextPage: skip + parseInt(limit) < total,
        hasPrevPage: parseInt(page) > 1
      },
      data: savedJobs
    });

  } catch (error) {
    console.error('❌ Get saved jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching saved jobs',
      error: error.message
    });
  }
};

// @desc    Save a job
// @route   POST /api/jobs/saved/:id
// @access  Private (Job seeker only)
exports.saveJob = async (req, res) => {
  try {
    console.log('💾 Saving job:', req.params.id, 'for user:', req.user.id);
    
    if (req.user.role !== 'jobseeker') {
      return res.status(403).json({
        success: false,
        message: 'Only job seekers can save jobs'
      });
    }

    const jobId = req.params.id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID'
      });
    }

    // Check if job exists and is active
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    if (job.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot save inactive job'
      });
    }

    // FIXED: Use findOneAndUpdate with $addToSet to prevent duplicates
    const result = await User.findOneAndUpdate(
      { 
        _id: req.user.id,
        'savedJobs.jobId': { $ne: jobId } // Only update if job is not already saved
      },
      {
        $addToSet: {
          savedJobs: {
            jobId: new mongoose.Types.ObjectId(jobId),
            savedAt: new Date(),
            notes: req.body.notes || '',
            priority: req.body.priority || 'medium',
            applicationStatus: 'not_applied'
          }
        }
      },
      { 
        new: true,
        runValidators: true
      }
    );

    if (!result) {
      // Check if user exists
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Job is already saved
      return res.status(400).json({
        success: false,
        message: 'Job is already saved'
      });
    }

    console.log('✅ Job saved successfully. Total saved jobs:', result.savedJobs.length);

    // Increment save count on job (optional analytics)
    try {
      await Job.findByIdAndUpdate(jobId, { $inc: { saveCount: 1 } });
    } catch (err) {
      console.warn('Could not increment job save count:', err.message);
    }

    // Update user engagement metrics
    try {
      await User.findByIdAndUpdate(req.user.id, {
        $inc: { 'engagementMetrics.jobsSaved': 1 },
        $set: { 'engagementMetrics.lastActiveDate': new Date() }
      });
    } catch (err) {
      console.warn('Could not update engagement metrics:', err.message);
    }

    res.status(200).json({
      success: true,
      message: 'Job saved successfully',
      data: {
        jobId: jobId,
        savedAt: new Date(),
        totalSavedJobs: result.savedJobs.length
      }
    });

  } catch (error) {
    console.error('❌ Save job error:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving job',
      error: error.message
    });
  }
};

// @desc    Remove job from saved list
// @route   DELETE /api/jobs/saved/:id
// @access  Private (Job seeker only)
exports.unsaveJob = async (req, res) => {
  try {
    console.log('🗑️ Removing job from saved:', req.params.id, 'for user:', req.user.id);
    
    if (req.user.role !== 'jobseeker') {
      return res.status(403).json({
        success: false,
        message: 'Only job seekers can unsave jobs'
      });
    }

    const jobId = req.params.id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID'
      });
    }

    // FIXED: Use findOneAndUpdate with $pull
    const result = await User.findOneAndUpdate(
      { 
        _id: req.user.id,
        'savedJobs.jobId': jobId // Only update if job is actually saved
      },
      {
        $pull: {
          savedJobs: { jobId: new mongoose.Types.ObjectId(jobId) }
        }
      },
      { 
        new: true,
        runValidators: true
      }
    );

    if (!result) {
      // Check if user exists
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Job was not in saved list
      return res.status(404).json({
        success: false,
        message: 'Job not found in saved list'
      });
    }

    console.log('✅ Job removed from saved list. Remaining saved jobs:', result.savedJobs.length);

    // Decrement save count on job (optional analytics)
    try {
      await Job.findByIdAndUpdate(jobId, { $inc: { saveCount: -1 } });
    } catch (err) {
      console.warn('Could not decrement job save count:', err.message);
    }

    res.status(200).json({
      success: true,
      message: 'Job removed from saved list',
      data: {
        jobId: jobId,
        removedAt: new Date(),
        totalSavedJobs: result.savedJobs.length
      }
    });

  } catch (error) {
    console.error('❌ Unsave job error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing job from saved list',
      error: error.message
    });
  }
};

// @desc    Check if job is saved by user
// @route   GET /api/jobs/saved/:id/check
// @access  Private (Job seeker only)
exports.checkJobSaved = async (req, res) => {
  try {
    console.log('✅ Checking if job is saved:', req.params.id, 'for user:', req.user.id);
    
    if (req.user.role !== 'jobseeker') {
      return res.status(403).json({
        success: false,
        message: 'Only job seekers can check saved status'
      });
    }

    const jobId = req.params.id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID'
      });
    }

    // FIXED: Use aggregation to properly check
    const result = await User.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(req.user.id) } },
      { $unwind: { path: '$savedJobs', preserveNullAndEmptyArrays: true } },
      { $match: { 'savedJobs.jobId': new mongoose.Types.ObjectId(jobId) } },
      {
        $project: {
          savedAt: '$savedJobs.savedAt',
          notes: '$savedJobs.notes',
          priority: '$savedJobs.priority',
          applicationStatus: '$savedJobs.applicationStatus'
        }
      }
    ]);

    const savedEntry = result[0];
    const isSaved = !!savedEntry;

    console.log(`Job ${jobId} saved status for user ${req.user.id}:`, isSaved);

    res.status(200).json({
      success: true,
      data: {
        jobId: jobId,
        isSaved: isSaved,
        savedAt: savedEntry?.savedAt || null,
        notes: savedEntry?.notes || '',
        priority: savedEntry?.priority || 'medium',
        applicationStatus: savedEntry?.applicationStatus || 'not_applied'
      }
    });

  } catch (error) {
    console.error('❌ Check job saved error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking saved status',
      error: error.message
    });
  }
};

// @desc    Update saved job details (notes, priority, etc.)
// @route   PUT /api/jobs/saved/:id
// @access  Private (Job seeker only)
exports.updateSavedJob = async (req, res) => {
  try {
    console.log('📝 Updating saved job:', req.params.id, 'for user:', req.user.id);
    
    if (req.user.role !== 'jobseeker') {
      return res.status(403).json({
        success: false,
        message: 'Only job seekers can update saved jobs'
      });
    }

    const jobId = req.params.id;
    const { notes, priority, applicationStatus } = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID'
      });
    }

    // Prepare update object
    const updateFields = {};
    if (notes !== undefined) updateFields['savedJobs.$.notes'] = notes;
    if (priority !== undefined) updateFields['savedJobs.$.priority'] = priority;
    if (applicationStatus !== undefined) updateFields['savedJobs.$.applicationStatus'] = applicationStatus;

    // FIXED: Use proper array update
    const result = await User.findOneAndUpdate(
      { 
        _id: req.user.id,
        'savedJobs.jobId': new mongoose.Types.ObjectId(jobId)
      },
      { $set: updateFields },
      { 
        new: true,
        runValidators: true
      }
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Job not found in saved list'
      });
    }

    // Find the updated saved job entry
    const updatedSavedJob = result.savedJobs.find(saved => 
      saved.jobId.toString() === jobId
    );

    console.log('✅ Saved job updated successfully');

    res.status(200).json({
      success: true,
      message: 'Saved job updated successfully',
      data: {
        jobId: jobId,
        notes: updatedSavedJob.notes,
        priority: updatedSavedJob.priority,
        applicationStatus: updatedSavedJob.applicationStatus,
        updatedAt: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Update saved job error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating saved job',
      error: error.message
    });
  }
};

// @desc    Get saved jobs analytics
// @route   GET /api/jobs/saved/analytics
// @access  Private (Job seeker only)
exports.getSavedJobsAnalytics = async (req, res) => {
  try {
    if (req.user.role !== 'jobseeker') {
      return res.status(403).json({
        success: false,
        message: 'Only job seekers can access saved jobs analytics'
      });
    }

    // Use aggregation for analytics
    const analytics = await User.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(req.user.id) } },
      { $unwind: { path: '$savedJobs', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'jobs',
          localField: 'savedJobs.jobId',
          foreignField: '_id',
          as: 'jobDetails'
        }
      },
      { $unwind: { path: '$jobDetails', preserveNullAndEmptyArrays: true } },
      { $match: { 'jobDetails.status': 'active' } },
      {
        $group: {
          _id: null,
          totalSaved: { $sum: 1 },
          byPriority: {
            $push: {
              priority: '$savedJobs.priority',
              status: '$savedJobs.applicationStatus'
            }
          },
          industries: { $push: '$jobDetails.industry' },
          jobTypes: { $push: '$jobDetails.jobType' },
          salaries: { $push: '$jobDetails.salary.min' }
        }
      }
    ]);

    const result = analytics[0] || { totalSaved: 0 };

    // Process the results
    const processedAnalytics = {
      totalSaved: result.totalSaved,
      byPriority: {
        high: result.byPriority?.filter(item => item.priority === 'high').length || 0,
        medium: result.byPriority?.filter(item => item.priority === 'medium').length || 0,
        low: result.byPriority?.filter(item => item.priority === 'low').length || 0
      },
      byApplicationStatus: {
        not_applied: result.byPriority?.filter(item => item.status === 'not_applied').length || 0,
        planning_to_apply: result.byPriority?.filter(item => item.status === 'planning_to_apply').length || 0,
        applied: result.byPriority?.filter(item => item.status === 'applied').length || 0,
        interview: result.byPriority?.filter(item => item.status === 'interview').length || 0,
        rejected: result.byPriority?.filter(item => item.status === 'rejected').length || 0,
        offered: result.byPriority?.filter(item => item.status === 'offered').length || 0
      },
      industries: this.getFrequencyMap(result.industries || []),
      jobTypes: this.getFrequencyMap(result.jobTypes || []),
      averageSalary: result.salaries?.length > 0 ? 
        Math.round(result.salaries.reduce((sum, salary) => sum + (salary || 0), 0) / result.salaries.length) : 0
    };

    res.status(200).json({
      success: true,
      data: processedAnalytics
    });

  } catch (error) {
    console.error('❌ Get saved jobs analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching saved jobs analytics',
      error: error.message
    });
  }
};

// Helper function to get frequency map
exports.getFrequencyMap = function(array) {
  const map = {};
  array.forEach(item => {
    if (item) {
      map[item] = (map[item] || 0) + 1;
    }
  });
  return map;
};

// @desc    Bulk operations on saved jobs
// @route   POST /api/jobs/saved/bulk
// @access  Private (Job seeker only)
exports.bulkOperationSavedJobs = async (req, res) => {
  try {
    if (req.user.role !== 'jobseeker') {
      return res.status(403).json({
        success: false,
        message: 'Only job seekers can perform bulk operations'
      });
    }

    const { operation, jobIds, data } = req.body;

    if (!operation || !Array.isArray(jobIds) || jobIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Operation and jobIds array are required'
      });
    }

    // Convert to ObjectIds
    const objectIds = jobIds.map(id => new mongoose.Types.ObjectId(id));
    let updateQuery = {};

    switch (operation) {
      case 'remove':
        updateQuery = {
          $pull: {
            savedJobs: { jobId: { $in: objectIds } }
          }
        };
        break;

      case 'updatePriority':
        if (!data?.priority) {
          return res.status(400).json({
            success: false,
            message: 'Priority is required for updatePriority operation'
          });
        }
        // Use arrayFilters for multiple array element updates
        updateQuery = {
          $set: { 'savedJobs.$[elem].priority': data.priority }
        };
        break;

      case 'updateApplicationStatus':
        if (!data?.applicationStatus) {
          return res.status(400).json({
            success: false,
            message: 'Application status is required for updateApplicationStatus operation'
          });
        }
        updateQuery = {
          $set: { 'savedJobs.$[elem].applicationStatus': data.applicationStatus }
        };
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid operation. Supported operations: remove, updatePriority, updateApplicationStatus'
        });
    }

    const options = {
      new: true,
      runValidators: true
    };

    if (operation !== 'remove') {
      options.arrayFilters = [{ 'elem.jobId': { $in: objectIds } }];
    }

    const result = await User.findOneAndUpdate(
      { _id: req.user.id },
      updateQuery,
      options
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: `Bulk ${operation} completed successfully`,
      data: {
        operation,
        processedJobIds: jobIds.length,
        totalSavedJobs: result.savedJobs?.length || 0
      }
    });

  } catch (error) {
    console.error('❌ Bulk operation saved jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error performing bulk operation',
      error: error.message
    });
  }
};