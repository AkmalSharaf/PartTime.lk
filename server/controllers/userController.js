const User = require('../models/User');
const fs = require('fs');
const path = require('path');

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
    try {
      console.log('Profile update request received');
      console.log('Request body:', req.body);
      console.log('Files:', req.files ? Object.keys(req.files) : 'No files');

      // Fields to update based on role
      const updateFields = {};
      
      // Common fields for both roles
      const commonFields = ['name', 'email', 'phone', 'bio', 'location'];
      commonFields.forEach(field => {
        if (req.body[field] !== undefined && req.body[field] !== '') {
          updateFields[field] = req.body[field];
        }
      });
      
      // FIXED: Handle skills array properly
      if (req.body.skills) {
        try {
          console.log('Processing skills:', req.body.skills, typeof req.body.skills);
          
          if (typeof req.body.skills === 'string') {
            // Check if it's JSON array string
            if (req.body.skills.startsWith('[') && req.body.skills.endsWith(']')) {
              updateFields.skills = JSON.parse(req.body.skills);
            } else {
              // It's a comma-separated string
              updateFields.skills = req.body.skills
                .split(',')
                .map(skill => skill.trim())
                .filter(skill => skill && skill.length > 0);
            }
          } else if (Array.isArray(req.body.skills)) {
            updateFields.skills = req.body.skills.filter(skill => skill && skill.trim().length > 0);
          }
          
          console.log('Processed skills:', updateFields.skills);
        } catch (err) {
          console.log('Skills parsing error:', err);
          // Fallback to comma-separated string
          if (typeof req.body.skills === 'string') {
            updateFields.skills = req.body.skills
              .split(',')
              .map(skill => skill.trim())
              .filter(skill => skill && skill.length > 0);
          }
        }
      }
      
      // Handle portfolio/social media data
      if (req.body.portfolio) {
        updateFields.portfolio = {};
        const portfolioFields = ['website', 'linkedin', 'github', 'portfolio', 'behance', 'dribbble'];
        portfolioFields.forEach(field => {
          if (req.body.portfolio[field]) {
            updateFields.portfolio[field] = req.body.portfolio[field];
          }
        });
      }

      // Social media fields for employers
      if (req.user.role === 'employer') {
        const socialFields = ['linkedin', 'twitter', 'facebook', 'instagram'];
        socialFields.forEach(field => {
          if (req.body[field] !== undefined && req.body[field] !== '') {
            if (!updateFields.socialMedia) updateFields.socialMedia = {};
            updateFields.socialMedia[field] = req.body[field];
          }
        });
      }
      
      // FIXED: Handle file uploads with express-fileupload
      if (req.files) {
        // Create upload directories if they don't exist
        const profilesDir = path.join(__dirname, '../public/uploads/profiles');
        const resumesDir = path.join(__dirname, '../public/uploads/resumes');
        
        if (!fs.existsSync(profilesDir)) {
          fs.mkdirSync(profilesDir, { recursive: true });
        }
        
        if (!fs.existsSync(resumesDir)) {
          fs.mkdirSync(resumesDir, { recursive: true });
        }
        
        // FIXED: Handle profile photo - Check multiple possible field names
        const profilePhotoFile = req.files.profilePhoto || req.files.profileImage || req.files.photo;
        if (profilePhotoFile) {
          const file = profilePhotoFile;
          
          console.log('Processing profile photo:', {
            name: file.name,
            size: file.size,
            mimetype: file.mimetype
          });
          
          // Validate file type
          const allowedTypes = ['.jpg', '.jpeg', '.png', '.gif'];
          const fileExtension = path.extname(file.name).toLowerCase();
          
          if (!allowedTypes.includes(fileExtension)) {
            return res.status(400).json({
              success: false,
              message: 'Invalid file type. Only JPG, PNG, and GIF files are allowed for profile photos'
            });
          }
          
          // Validate file size (5MB limit for profile photos)
          const maxSize = 5 * 1024 * 1024; // 5MB
          if (file.size > maxSize) {
            return res.status(400).json({
              success: false,
              message: 'Profile photo too large. Maximum size is 5MB'
            });
          }
          
          const fileName = `profile_${req.user.id}_${Date.now()}${fileExtension}`;
          const uploadPath = path.join(profilesDir, fileName);
          
          try {
            // Move the file
            await file.mv(uploadPath);
            updateFields.profilePhoto = `uploads/profiles/${fileName}`;
            updateFields.profilePhotoFileName = file.name;
            
            console.log('Profile photo uploaded successfully:', fileName);
            
            // Delete old file if exists
            const user = await User.findById(req.user.id);
            if (user.profilePhoto && user.profilePhoto !== updateFields.profilePhoto) {
              const oldPath = path.join(__dirname, '../public', user.profilePhoto);
              if (fs.existsSync(oldPath)) {
                try {
                  fs.unlinkSync(oldPath);
                  console.log('Old profile photo deleted');
                } catch (deleteError) {
                  console.log('Error deleting old photo:', deleteError);
                }
              }
            }
          } catch (uploadError) {
            console.error('Error uploading profile photo:', uploadError);
            return res.status(500).json({
              success: false,
              message: 'Error uploading profile photo',
              error: uploadError.message
            });
          }
        }
        
        // Handle company logo
        if (req.files.companyLogo) {
          const file = req.files.companyLogo;
          
          console.log('Processing company logo:', {
            name: file.name,
            size: file.size,
            mimetype: file.mimetype
          });
          
          // Validate file type
          const allowedTypes = ['.jpg', '.jpeg', '.png', '.gif', '.svg'];
          const fileExtension = path.extname(file.name).toLowerCase();
          
          if (!allowedTypes.includes(fileExtension)) {
            return res.status(400).json({
              success: false,
              message: 'Invalid file type. Only JPG, PNG, GIF, and SVG files are allowed for company logos'
            });
          }
          
          // Validate file size (2MB limit for logos)
          const maxSize = 2 * 1024 * 1024; // 2MB
          if (file.size > maxSize) {
            return res.status(400).json({
              success: false,
              message: 'Company logo too large. Maximum size is 2MB'
            });
          }
          
          const fileName = `logo_${req.user.id}_${Date.now()}${fileExtension}`;
          const uploadPath = path.join(profilesDir, fileName);
          
          try {
            // Move the file
            await file.mv(uploadPath);
            updateFields.companyLogo = `uploads/profiles/${fileName}`;
            updateFields.companyLogoFileName = file.name;
            
            console.log('Company logo uploaded successfully:', fileName);
            
            // Delete old file if exists
            const user = await User.findById(req.user.id);
            if (user.companyLogo && user.companyLogo !== updateFields.companyLogo) {
              const oldPath = path.join(__dirname, '../public', user.companyLogo);
              if (fs.existsSync(oldPath)) {
                try {
                  fs.unlinkSync(oldPath);
                  console.log('Old company logo deleted');
                } catch (deleteError) {
                  console.log('Error deleting old logo:', deleteError);
                }
              }
            }
          } catch (uploadError) {
            console.error('Error uploading company logo:', uploadError);
            return res.status(500).json({
              success: false,
              message: 'Error uploading company logo',
              error: uploadError.message
            });
          }
        }
        
        // Handle resume
        if (req.files.resume) {
          const file = req.files.resume;
          
          console.log('Processing resume:', {
            name: file.name,
            size: file.size,
            mimetype: file.mimetype
          });
          
          // Validate file type
          const allowedTypes = ['.pdf', '.doc', '.docx'];
          const fileExtension = path.extname(file.name).toLowerCase();
          
          if (!allowedTypes.includes(fileExtension)) {
            return res.status(400).json({
              success: false,
              message: 'Invalid file type. Only PDF, DOC, and DOCX files are allowed for resumes'
            });
          }
          
          // Validate file size (10MB limit for resumes)
          const maxSize = 10 * 1024 * 1024; // 10MB
          if (file.size > maxSize) {
            return res.status(400).json({
              success: false,
              message: 'Resume file too large. Maximum size is 10MB'
            });
          }
          
          const fileName = `resume_${req.user.id}_${Date.now()}${fileExtension}`;
          const uploadPath = path.join(resumesDir, fileName);
          
          try {
            // Move the file
            await file.mv(uploadPath);
            updateFields.resume = `uploads/resumes/${fileName}`;
            updateFields.resumeFileName = file.name;
            
            console.log('Resume uploaded successfully:', fileName);
            
            // Delete old file if exists
            const user = await User.findById(req.user.id);
            if (user.resume && user.resume !== updateFields.resume) {
              const oldPath = path.join(__dirname, '../public', user.resume);
              if (fs.existsSync(oldPath)) {
                try {
                  fs.unlinkSync(oldPath);
                  console.log('Old resume deleted');
                } catch (deleteError) {
                  console.log('Error deleting old resume:', deleteError);
                }
              }
            }
          } catch (uploadError) {
            console.error('Error uploading resume:', uploadError);
            return res.status(500).json({
              success: false,
              message: 'Error uploading resume',
              error: uploadError.message
            });
          }
        }
      }
      
      // Role-specific fields
      if (req.user.role === 'employer') {
        // Employer specific fields
        const employerFields = ['companyName', 'companyDescription', 'companyWebsite', 'industry', 'companySize'];
        employerFields.forEach(field => {
          if (req.body[field] !== undefined && req.body[field] !== '') {
            updateFields[field] = req.body[field];
          }
        });
      }
      
      // Update last profile update timestamp
      updateFields.lastProfileUpdate = new Date();
      
      console.log('Final update fields:', updateFields);
      
      // Find and update user
      const user = await User.findByIdAndUpdate(
        req.user.id,
        { $set: updateFields },
        { new: true, runValidators: true }
      );
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      console.log('Profile updated successfully');
      
      res.status(200).json({
        success: true,
        data: user,
        message: 'Profile updated successfully'
      });
    } catch (err) {
      console.error('Profile update error:', err);
      res.status(500).json({
        success: false,
        message: 'Server Error',
        error: err.message
      });
    }
};

// @desc    Add experience to profile - FIXED field mapping
// @route   PUT /api/users/experience
// @access  Private (Job seeker only)
exports.addExperience = async (req, res) => {
  try {
    if (req.user.role !== 'jobseeker') {
      return res.status(403).json({
        success: false,
        message: 'Only job seekers can add experience'
      });
    }
    
    console.log('Add experience request:', req.body);
    
    const {
      title,      // Frontend sends 'title'
      company,
      location,
      from,       // Frontend sends 'from'
      to,         // Frontend sends 'to'
      current,
      description,
      industry,
      companySize,
      achievements,
      technologies
    } = req.body;
    
    // Validate required fields
    if (!title || !company || !from) {
      return res.status(400).json({
        success: false,
        message: 'Job title, company, and start date are required'
      });
    }
    
    // Validate date format
    if (!Date.parse(from)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid start date format'
      });
    }
    
    if (!current && to && !Date.parse(to)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid end date format'
      });
    }
    
    const newExp = {
      position: title,        // Map 'title' to 'position' for database
      company: company.trim(),
      startDate: new Date(from),        // Map 'from' to 'startDate' for database
      endDate: current ? null : (to ? new Date(to) : null),  // Map 'to' to 'endDate' for database
      current: Boolean(current),
      description: description ? description.trim() : '',
      industry: industry ? industry.trim() : '',
      companySize: companySize || '',
      achievements: achievements || [],
      technologies: technologies || []
    };
    
    console.log('New experience object:', newExp);
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Initialize experience array if it doesn't exist
    if (!user.experience) {
      user.experience = [];
    }
    
    user.experience.unshift(newExp);
    await user.save();
    
    console.log('Experience added successfully');
    
    res.status(200).json({
      success: true,
      data: user,
      message: 'Experience added successfully'
    });
  } catch (err) {
    console.error('Add experience error:', err);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
};

// @desc    Add education to profile - FIXED field mapping
// @route   PUT /api/users/education
// @access  Private (Job seeker only)
exports.addEducation = async (req, res) => {
  try {
    if (req.user.role !== 'jobseeker') {
      return res.status(403).json({
        success: false,
        message: 'Only job seekers can add education'
      });
    }
    
    console.log('Add education request:', req.body);
    
    const {
      school,          // Frontend sends 'school'
      degree,
      fieldOfStudy,
      from,           // Frontend sends 'from'
      to,             // Frontend sends 'to'
      current,
      description,
      gpa,
      honors,
      relevantCoursework
    } = req.body;
    
    // Validate required fields
    if (!school || !degree || !from) {
      return res.status(400).json({
        success: false,
        message: 'School/University, degree, and start date are required'
      });
    }
    
    // Validate date format
    if (!Date.parse(from)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid start date format'
      });
    }
    
    if (!current && to && !Date.parse(to)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid end date format'
      });
    }
    
    const newEdu = {
      institution: school.trim(),    // Map 'school' to 'institution' for database
      degree: degree.trim(),
      fieldOfStudy: fieldOfStudy ? fieldOfStudy.trim() : '',
      startDate: new Date(from),        // Map 'from' to 'startDate' for database
      endDate: current ? null : (to ? new Date(to) : null),  // Map 'to' to 'endDate' for database
      current: Boolean(current),
      description: description ? description.trim() : '',
      gpa: gpa ? parseFloat(gpa) : null,
      honors: honors || [],
      relevantCoursework: relevantCoursework || []
    };
    
    console.log('New education object:', newEdu);
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Initialize education array if it doesn't exist
    if (!user.education) {
      user.education = [];
    }
    
    user.education.unshift(newEdu);
    await user.save();
    
    console.log('Education added successfully');
    
    res.status(200).json({
      success: true,
      data: user,
      message: 'Education added successfully'
    });
  } catch (err) {
    console.error('Add education error:', err);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
};

// Rest of the methods remain the same as in the original file...
// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
};

// @desc    Get public profile of a user
// @route   GET /api/users/:id
// @access  Public
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -resetPasswordToken -resetPasswordExpire -emailVerificationToken -emailVerificationExpire -preferences.emailNotifications -preferences.smsNotifications -aiProfile');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `User not found with ID: ${req.params.id}`
      });
    }
    
    // Increment profile views
    await User.findByIdAndUpdate(req.params.id, { $inc: { profileViews: 1 } });
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
};

// @desc    Delete experience from profile
// @route   DELETE /api/users/experience/:exp_id
// @access  Private (Job seeker only)
exports.deleteExperience = async (req, res) => {
  try {
    if (req.user.role !== 'jobseeker') {
      return res.status(403).json({
        success: false,
        message: 'Only job seekers can delete experience'
      });
    }
    
    const user = await User.findById(req.user.id);
    
    if (!user || !user.experience) {
      return res.status(404).json({
        success: false,
        message: 'User or experience not found'
      });
    }
    
    const removeIndex = user.experience
      .map(item => item.id)
      .indexOf(req.params.exp_id);
    
    if (removeIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Experience not found'
      });
    }
    
    user.experience.splice(removeIndex, 1);
    await user.save();
    
    res.status(200).json({
      success: true,
      data: user,
      message: 'Experience deleted successfully'
    });
  } catch (err) {
    console.error('Delete experience error:', err);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
};

// @desc    Delete education from profile
// @route   DELETE /api/users/education/:edu_id
// @access  Private (Job seeker only)
exports.deleteEducation = async (req, res) => {
  try {
    if (req.user.role !== 'jobseeker') {
      return res.status(403).json({
        success: false,
        message: 'Only job seekers can delete education'
      });
    }
    
    const user = await User.findById(req.user.id);
    
    if (!user || !user.education) {
      return res.status(404).json({
        success: false,
        message: 'User or education not found'
      });
    }
    
    const removeIndex = user.education
      .map(item => item.id)
      .indexOf(req.params.edu_id);
    
    if (removeIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Education not found'
      });
    }
    
    user.education.splice(removeIndex, 1);
    await user.save();
    
    res.status(200).json({
      success: true,
      data: user,
      message: 'Education deleted successfully'
    });
  } catch (err) {
    console.error('Delete education error:', err);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
};