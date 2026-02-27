// controllers/companyController.js - Complete company controller
const User = require('../models/User');
const Job = require('../models/Job');

// @desc    Get all companies (users with role 'employer')
// @route   GET /api/users/companies
// @access  Public
exports.getCompanies = async (req, res) => {
  try {
    console.log('📊 Getting companies...');
    
    let query = User.find({ role: 'employer' }).select('-password -__v');

    // Add filters if provided
    if (req.query.industry) {
      query = query.find({ industry: req.query.industry });
    }

    if (req.query.location) {
      query = query.find({ location: { $regex: req.query.location, $options: 'i' } });
    }

    if (req.query.search) {
      query = query.find({
        $or: [
          { companyName: { $regex: req.query.search, $options: 'i' } },
          { companyDescription: { $regex: req.query.search, $options: 'i' } },
          { name: { $regex: req.query.search, $options: 'i' } }
        ]
      });
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    
    // Get total count
    const totalQuery = User.find({ role: 'employer' });
    if (req.query.industry) {
      totalQuery.find({ industry: req.query.industry });
    }
    if (req.query.location) {
      totalQuery.find({ location: { $regex: req.query.location, $options: 'i' } });
    }
    if (req.query.search) {
      totalQuery.find({
        $or: [
          { companyName: { $regex: req.query.search, $options: 'i' } },
          { companyDescription: { $regex: req.query.search, $options: 'i' } },
          { name: { $regex: req.query.search, $options: 'i' } }
        ]
      });
    }
    
    const total = await totalQuery.countDocuments();

    query = query.skip(startIndex).limit(limit);

    // Execute query
    const companies = await query;

    console.log(`✅ Found ${companies.length} companies`);

    // Get job counts for each company
    const companiesWithJobCount = await Promise.all(
      companies.map(async (company) => {
        const jobCount = await Job.countDocuments({ 
          employer: company._id,
          status: 'active'
        });
        const companyObj = company.toObject();
        return { ...companyObj, jobCount, activeJobs: jobCount };
      })
    );

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    pagination.currentPage = page;
    pagination.totalPages = Math.ceil(total / limit);
    pagination.total = total;

    res.status(200).json({
      success: true,
      count: companies.length,
      total,
      pagination,
      data: companiesWithJobCount
    });

  } catch (err) {
    console.error('Get companies error:', err);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
};

// @desc    Get company by ID
// @route   GET /api/users/companies/:id
// @access  Public
exports.getCompanyById = async (req, res) => {
  try {
    const company = await User.findById(req.params.id).select('-password -__v');

    if (!company) {
      return res.status(404).json({
        success: false,
        message: `Company not found with ID: ${req.params.id}`
      });
    }

    // Check if user is an employer
    if (company.role !== 'employer') {
      return res.status(400).json({
        success: false,
        message: 'This user is not a company/employer'
      });
    }

    // Get company's job count and recent jobs
    const jobCount = await Job.countDocuments({ 
      employer: req.params.id,
      status: 'active'
    });

    // Get recent jobs
    const recentJobs = await Job.find({ 
      employer: req.params.id,
      status: 'active'
    })
    .select('title location salary jobType createdAt')
    .sort({ createdAt: -1 })
    .limit(5);

    const companyObj = company.toObject();

    res.status(200).json({
      success: true,
      data: { 
        ...companyObj, 
        jobCount,
        activeJobs: jobCount,
        recentJobs
      }
    });

  } catch (err) {
    console.error('Get company by ID error:', err);
    
    if (err.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
};