// controllers/uploadController.js
const path = require('path');
const fs = require('fs');
const User = require('../models/User');

// @desc    Upload CV/Resume file
// @route   POST /api/upload/cv
// @access  Private (Job seekers only)
exports.uploadCV = async (req, res) => {
  try {
    console.log('Upload CV request received');
    console.log('Files:', req.files);
    console.log('User:', req.user);

    // Check if user is a job seeker
    if (req.user.role !== 'jobseeker') {
      return res.status(403).json({
        success: false,
        message: 'Only job seekers can upload CV'
      });
    }

    // Check if file was uploaded
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No file was uploaded',
        debug: {
          hasFiles: !!req.files,
          filesKeys: req.files ? Object.keys(req.files) : [],
          contentType: req.headers['content-type']
        }
      });
    }

    const cvFile = req.files.cv || req.files.file; // Try both field names

    if (!cvFile) {
      return res.status(400).json({
        success: false,
        message: 'CV file not found in request',
        availableFields: Object.keys(req.files)
      });
    }

    // Validate file type
    const allowedExtensions = ['.pdf', '.doc', '.docx'];
    const fileExtension = path.extname(cvFile.name).toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Only PDF, DOC, and DOCX files are allowed'
      });
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (cvFile.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 5MB'
      });
    }

    // Create unique filename
    const fileName = `cv_${req.user.id}_${Date.now()}${fileExtension}`;
    const uploadDir = path.join(__dirname, '../public/uploads/cvs/');
    const uploadPath = path.join(uploadDir, fileName);

    // Ensure upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Move file to upload directory
    await cvFile.mv(uploadPath);

    // Update user profile with CV path
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id, 
      { 
        resume: `/uploads/cvs/${fileName}`,
        resumeFileName: cvFile.name
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'CV uploaded successfully',
      data: {
        fileName: fileName,
        filePath: `/uploads/cvs/${fileName}`,
        originalName: cvFile.name,
        size: cvFile.size,
        uploadedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during file upload',
      error: error.message
    });
  }
};

// @desc    Upload profile photo
// @route   POST /api/upload/photo
// @access  Private
exports.uploadPhoto = async (req, res) => {
  try {
    console.log('Upload photo request received');
    console.log('Files:', req.files);

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No file was uploaded'
      });
    }

    const photo = req.files.photo || req.files.file;

    if (!photo) {
      return res.status(400).json({
        success: false,
        message: 'Photo file not found in request',
        availableFields: Object.keys(req.files)
      });
    }

    // Validate file type
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
    const fileExtension = path.extname(photo.name).toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Only JPG, PNG, and GIF files are allowed'
      });
    }

    // Validate file size (2MB limit for images)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (photo.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 2MB'
      });
    }

    // Create unique filename
    const fileName = `photo_${req.user.id}_${Date.now()}${fileExtension}`;
    const uploadDir = path.join(__dirname, '../public/uploads/photos/');
    const uploadPath = path.join(uploadDir, fileName);

    // Ensure upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Move file to upload directory
    await photo.mv(uploadPath);

    // Update user profile with photo path
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { 
        profilePhoto: `/uploads/photos/${fileName}`,
        profilePhotoFileName: photo.name
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Photo uploaded successfully',
      data: {
        fileName: fileName,
        filePath: `/uploads/photos/${fileName}`,
        originalName: photo.name,
        size: photo.size,
        uploadedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during file upload',
      error: error.message
    });
  }
};

// @desc    Upload company logo
// @route   POST /api/upload/logo
// @access  Private (Employers only)
exports.uploadCompanyLogo = async (req, res) => {
  try {
    // Check if user is an employer
    if (req.user.role !== 'employer') {
      return res.status(403).json({
        success: false,
        message: 'Only employers can upload company logo'
      });
    }

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No file was uploaded'
      });
    }

    const logo = req.files.logo || req.files.file;

    if (!logo) {
      return res.status(400).json({
        success: false,
        message: 'Logo file not found in request',
        availableFields: Object.keys(req.files)
      });
    }

    // Validate file type
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg'];
    const fileExtension = path.extname(logo.name).toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Only JPG, PNG, GIF, and SVG files are allowed'
      });
    }

    // Validate file size (1MB limit for logos)
    const maxSize = 1 * 1024 * 1024; // 1MB
    if (logo.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 1MB'
      });
    }

    // Create unique filename
    const fileName = `logo_${req.user.id}_${Date.now()}${fileExtension}`;
    const uploadDir = path.join(__dirname, '../public/uploads/logos/');
    const uploadPath = path.join(uploadDir, fileName);

    // Ensure upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Move file to upload directory
    await logo.mv(uploadPath);

    // Update user profile with logo path
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { 
        companyLogo: `/uploads/logos/${fileName}`,
        companyLogoFileName: logo.name
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Company logo uploaded successfully',
      data: {
        fileName: fileName,
        filePath: `/uploads/logos/${fileName}`,
        originalName: logo.name,
        size: logo.size,
        uploadedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during file upload',
      error: error.message
    });
  }
};

// @desc    Delete uploaded file
// @route   DELETE /api/upload/:type/:filename
// @access  Private
exports.deleteFile = async (req, res) => {
  try {
    const { type, filename } = req.params;
    
    // Validate type
    const validTypes = ['cvs', 'photos', 'logos'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type'
      });
    }

    const filePath = path.join(__dirname, `../public/uploads/${type}/`, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Delete file
    fs.unlinkSync(filePath);

    // Update user profile
    let updateField;
    let fileNameField;
    
    switch (type) {
      case 'cvs':
        updateField = 'resume';
        fileNameField = 'resumeFileName';
        break;
      case 'photos':
        updateField = 'profilePhoto';
        fileNameField = 'profilePhotoFileName';
        break;
      case 'logos':
        updateField = 'companyLogo';
        fileNameField = 'companyLogoFileName';
        break;
    }

    await User.findByIdAndUpdate(req.user.id, {
      [updateField]: null,
      [fileNameField]: null
    });

    res.status(200).json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during file deletion',
      error: error.message
    });
  }
};

// @desc    Get user files
// @route   GET /api/upload/files
// @access  Private
exports.getUserFiles = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('resume resumeFileName profilePhoto profilePhotoFileName companyLogo companyLogoFileName');
    
    const files = {
      cv: user.resume ? {
        url: user.resume,
        fileName: user.resumeFileName,
        exists: fs.existsSync(path.join(__dirname, '../public', user.resume))
      } : null,
      photo: user.profilePhoto ? {
        url: user.profilePhoto,
        fileName: user.profilePhotoFileName,
        exists: fs.existsSync(path.join(__dirname, '../public', user.profilePhoto))
      } : null,
      logo: user.companyLogo ? {
        url: user.companyLogo,
        fileName: user.companyLogoFileName,
        exists: fs.existsSync(path.join(__dirname, '../public', user.companyLogo))
      } : null
    };

    res.status(200).json({
      success: true,
      data: files
    });

  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving files',
      error: error.message
    });
  }
};

// @desc    Test upload endpoint
// @route   POST /api/upload/test
// @access  Private
exports.testUpload = async (req, res) => {
  try {
    console.log('=== TEST UPLOAD DEBUG ===');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('Files:', req.files);
    console.log('User:', req.user);
    console.log('Content-Type:', req.headers['content-type']);
    console.log('========================');

    res.json({
      success: true,
      message: 'Test upload endpoint reached',
      debug: {
        hasFiles: !!req.files,
        filesCount: req.files ? Object.keys(req.files).length : 0,
        fileKeys: req.files ? Object.keys(req.files) : [],
        contentType: req.headers['content-type'],
        userRole: req.user?.role,
        userId: req.user?.id
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};