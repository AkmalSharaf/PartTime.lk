// controllers/resourceController.js
const Resource = require('../models/Resource');

// @desc    Get all resources
// @route   GET /api/resources
// @access  Public
exports.getResources = async (req, res) => {
  try {
    let query = Resource.find();

    // Filter by category if provided
    if (req.query.category) {
      query = query.find({ category: req.query.category });
    }

    // Search functionality
    if (req.query.search) {
      query = query.find({
        $or: [
          { title: { $regex: req.query.search, $options: 'i' } },
          { description: { $regex: req.query.search, $options: 'i' } },
          { content: { $regex: req.query.search, $options: 'i' } }
        ]
      });
    }

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Resource.countDocuments();

    query = query.skip(startIndex).limit(limit);

    // Execute query
    const resources = await query;

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

    res.status(200).json({
      success: true,
      count: resources.length,
      pagination,
      data: resources
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

// @desc    Get resource by ID
// @route   GET /api/resources/:id
// @access  Public
exports.getResourceById = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: `Resource not found with ID: ${req.params.id}`
      });
    }

    res.status(200).json({
      success: true,
      data: resource
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

// @desc    Create new resource
// @route   POST /api/resources
// @access  Private (Admin only)
exports.createResource = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can create resources'
      });
    }

    const resource = await Resource.create(req.body);

    res.status(201).json({
      success: true,
      data: resource
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

// @desc    Update resource
// @route   PUT /api/resources/:id
// @access  Private (Admin only)
exports.updateResource = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can update resources'
      });
    }

    let resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: `Resource not found with ID: ${req.params.id}`
      });
    }

    resource = await Resource.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: resource
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

// @desc    Delete resource
// @route   DELETE /api/resources/:id
// @access  Private (Admin only)
exports.deleteResource = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can delete resources'
      });
    }

    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: `Resource not found with ID: ${req.params.id}`
      });
    }

    await resource.remove();

    res.status(200).json({
      success: true,
      data: {}
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