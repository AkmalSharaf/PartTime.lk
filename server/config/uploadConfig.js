// config/uploadConfig.js - Upload configuration and utilities
const path = require('path');
const fs = require('fs');

// Upload configuration
const uploadConfig = {
  // File size limits (in bytes)
  limits: {
    cv: 5 * 1024 * 1024,        // 5MB for CV/Resume
    photo: 2 * 1024 * 1024,     // 2MB for photos
    logo: 1 * 1024 * 1024,      // 1MB for company logos
    coverLetter: 2 * 1024 * 1024 // 2MB for cover letter files
  },
  
  // Allowed file types
  allowedTypes: {
    cv: ['.pdf', '.doc', '.docx'],
    photo: ['.jpg', '.jpeg', '.png', '.gif'],
    logo: ['.jpg', '.jpeg', '.png', '.gif', '.svg'],
    coverLetter: ['.pdf', '.doc', '.docx', '.txt']
  },
  
  // Upload directories
  directories: {
    base: path.join(__dirname, '../public/uploads'),
    cvs: path.join(__dirname, '../public/uploads/cvs'),
    photos: path.join(__dirname, '../public/uploads/photos'),
    logos: path.join(__dirname, '../public/uploads/logos'),
    applications: {
      resumes: path.join(__dirname, '../public/uploads/applications/resumes'),
      coverletters: path.join(__dirname, '../public/uploads/applications/coverletters')
    },
    temp: path.join(__dirname, '../tmp')
  }
};

// Create upload directories
const createUploadDirectories = () => {
  const directories = [
    uploadConfig.directories.base,
    uploadConfig.directories.cvs,
    uploadConfig.directories.photos,
    uploadConfig.directories.logos,
    uploadConfig.directories.applications.resumes,
    uploadConfig.directories.applications.coverletters,
    uploadConfig.directories.temp
  ];

  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Created upload directory: ${dir}`);
    }
  });
};

// Validate file type
const validateFileType = (fileName, fileType) => {
  const extension = path.extname(fileName).toLowerCase();
  const allowedExtensions = uploadConfig.allowedTypes[fileType];
  
  if (!allowedExtensions) {
    throw new Error(`Unknown file type: ${fileType}`);
  }
  
  if (!allowedExtensions.includes(extension)) {
    throw new Error(`Invalid file type. Allowed types: ${allowedExtensions.join(', ')}`);
  }
  
  return true;
};

// Validate file size
const validateFileSize = (fileSize, fileType) => {
  const maxSize = uploadConfig.limits[fileType];
  
  if (!maxSize) {
    throw new Error(`Unknown file type: ${fileType}`);
  }
  
  if (fileSize > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    throw new Error(`File too large. Maximum size: ${maxSizeMB}MB`);
  }
  
  return true;
};

// Generate unique filename
const generateUniqueFileName = (originalName, userId, prefix = '') => {
  const extension = path.extname(originalName);
  const baseName = path.basename(originalName, extension);
  const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9]/g, '_');
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  
  return `${prefix}${userId}_${timestamp}_${random}_${sanitizedBaseName}${extension}`;
};

// Clean old files (utility function)
const cleanOldFiles = (directory, maxAge = 30) => {
  try {
    const files = fs.readdirSync(directory);
    const now = Date.now();
    const maxAgeMs = maxAge * 24 * 60 * 60 * 1000; // Convert days to milliseconds
    
    files.forEach(file => {
      const filePath = path.join(directory, file);
      const stats = fs.statSync(filePath);
      
      if (now - stats.mtime.getTime() > maxAgeMs) {
        fs.unlinkSync(filePath);
        console.log(`🗑️  Deleted old file: ${file}`);
      }
    });
  } catch (error) {
    console.error(`Error cleaning old files in ${directory}:`, error);
  }
};

// File upload middleware configuration
const getFileUploadConfig = () => {
  return {
    limits: { 
      fileSize: Math.max(...Object.values(uploadConfig.limits)), // Use largest limit
      files: 5 // Allow up to 5 files per request
    },
    abortOnLimit: true,
    responseOnLimit: 'File size limit exceeded',
    createParentPath: true,
    useTempFiles: true,
    tempFileDir: uploadConfig.directories.temp,
    debug: process.env.NODE_ENV === 'development',
    parseNested: true,
    preserveExtension: true,
    safeFileNames: true,
    uploadTimeout: 120000, // 2 minutes timeout
    defCharset: 'utf8',
    defParamCharset: 'utf8'
  };
};

// Express-fileupload helper functions
const handleFileUpload = async (file, fileType, userId, uploadDir, prefix = '') => {
  try {
    // Validate file
    validateFileType(file.name, fileType);
    validateFileSize(file.size, fileType);
    
    // Generate unique filename
    const fileName = generateUniqueFileName(file.name, userId, prefix);
    const uploadPath = path.join(uploadDir, fileName);
    
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Move file
    await file.mv(uploadPath);
    
    // Return file info
    return {
      fileName,
      originalName: file.name,
      size: file.size,
      mimetype: file.mimetype,
      relativePath: path.relative(path.join(__dirname, '../public'), uploadPath),
      url: `/${path.relative(path.join(__dirname, '../public'), uploadPath).replace(/\\/g, '/')}`
    };
    
  } catch (error) {
    throw error;
  }
};

// Delete file helper
const deleteFile = (filePath) => {
  try {
    const fullPath = path.join(__dirname, '../public', filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

// Get file info
const getFileInfo = (filePath) => {
  try {
    const fullPath = path.join(__dirname, '../public', filePath);
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      return {
        exists: true,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      };
    }
    return { exists: false };
  } catch (error) {
    return { exists: false, error: error.message };
  }
};

// Schedule cleanup of old temp files
const scheduleCleanup = () => {
  // Clean temp files every hour
  setInterval(() => {
    cleanOldFiles(uploadConfig.directories.temp, 1); // Clean files older than 1 day
  }, 60 * 60 * 1000); // 1 hour
  
  // Clean old application files every day
  setInterval(() => {
    // Only clean application-specific uploads, not user profile files
    cleanOldFiles(uploadConfig.directories.applications.resumes, 90); // 90 days
    cleanOldFiles(uploadConfig.directories.applications.coverletters, 90); // 90 days
  }, 24 * 60 * 60 * 1000); // 24 hours
};

module.exports = {
  uploadConfig,
  createUploadDirectories,
  validateFileType,
  validateFileSize,
  generateUniqueFileName,
  cleanOldFiles,
  getFileUploadConfig,
  handleFileUpload,
  deleteFile,
  getFileInfo,
  scheduleCleanup
};