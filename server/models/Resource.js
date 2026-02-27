// models/Resource.js
const mongoose = require('mongoose');

const ResourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  category: {
    type: String,
    required: [true, 'Please add a category'],
    enum: ['resume', 'interview', 'job-search', 'career', 'employer', 'other']
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  content: {
    type: String,
    required: [true, 'Please add content'],
  },
  imageUrl: {
    type: String,
    default: null
  },
  link: {
    type: String,
    match: [
      /^\/resources\/[\w-]+$/,
      'Please use a valid resource URL format (e.g., /resources/resource-name)'
    ]
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create slug from title for the link
ResourceSchema.pre('save', function(next) {
  // Only create link if not explicitly provided
  if (!this.link) {
    this.link = `/resources/${this.title
      .toLowerCase()
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-')}`;
  }
  
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Resource', ResourceSchema);