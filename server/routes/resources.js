// routes/resources.js
const express = require('express');
const router = express.Router();
const {
  getResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource
} = require('../controllers/resourceController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', getResources);
router.get('/:id', getResourceById);

// Admin only routes
router.post('/', protect, authorize('admin'), createResource);
router.put('/:id', protect, authorize('admin'), updateResource);
router.delete('/:id', protect, authorize('admin'), deleteResource);

module.exports = router;