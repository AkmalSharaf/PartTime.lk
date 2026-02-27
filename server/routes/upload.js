const express = require('express');
const router = express.Router();
const {
  uploadCV,
  uploadPhoto,
  uploadCompanyLogo,
  deleteFile,
  getUserFiles,
  testUpload
} = require('../controllers/uploadController');
const { protect, authorize } = require('../middleware/auth');

// Test route for debugging
router.post('/test', protect, testUpload);

// Get user files
router.get('/files', protect, getUserFiles);

// Upload routes - specific routes first
router.post('/cv', protect, authorize('jobseeker'), uploadCV);
router.post('/photo', protect, uploadPhoto);
router.post('/logo', protect, authorize('employer'), uploadCompanyLogo);

// Delete file route - parameterized route last
router.delete('/:type/:filename', protect, deleteFile);

module.exports = router;