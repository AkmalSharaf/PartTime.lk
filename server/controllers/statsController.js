// controllers/statsController.js
const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');

// @desc    Get platform statistics
// @route   GET /api/stats
// @access  Public
exports.getStats = async (req, res) => {
  try {
    // Get total jobs count
    const jobsCount = await Job.countDocuments();
    
    // Get total employers count
    const employersCount = await User.countDocuments({ role: 'employer' });
    
    // Get total job seekers count
    const jobSeekersCount = await User.countDocuments({ role: 'jobseeker' });
    
    // Get total applications count
    const applicationsCount = await Application.countDocuments();
    
    res.status(200).json({
      success: true,
      data: {
        jobsCount,
        employersCount,
        jobSeekersCount,
        applicationsCount
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
};