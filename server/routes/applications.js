// routes/applications.js - FIXED routes with new employer endpoint
const express = require('express');
const router = express.Router();
const {
  applyForJob,
  getApplication,
  getJobApplications,
  getEmployerApplications, // NEW - Add this import
  updateApplicationStatus,
  getMyApplications,
  withdrawApplication
} = require('../controllers/applicationController');
const { protect, authorize } = require('../middleware/auth');

// Specific routes MUST come before parameterized routes
router.get('/me', protect, authorize('jobseeker'), getMyApplications);

// NEW ROUTE: Get all applications for current employer across all their jobs
router.get('/employer/me', protect, authorize('employer'), getEmployerApplications);

// Job-specific routes
router.get('/job/:jobId', protect, authorize('employer'), getJobApplications);

// Application CRUD with ID parameter - these come last
router.post('/:jobId', protect, authorize('jobseeker'), applyForJob);
router.get('/:id', protect, getApplication);
router.put('/:id', protect, authorize('employer'), updateApplicationStatus);
router.delete('/:id', protect, authorize('jobseeker'), withdrawApplication);

module.exports = router;