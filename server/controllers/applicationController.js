// controllers/applicationController.js - FIXED version with proper data handling
const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');

// @desc    Apply for a job with optional file uploads
// @route   POST /api/applications/:jobId
// @access  Private (Job seekers only)
exports.applyForJob = async (req, res) => {
  try {
    console.log('=== JOB APPLICATION PROCESS START ===');
    console.log('Job ID:', req.params.jobId);
    console.log('User ID:', req.user.id);
    console.log('User Role:', req.user.role);
    console.log('Request body:', req.body);
    console.log('Files:', req.files ? Object.keys(req.files) : 'No files');

    // Check if job exists and is active
    const job = await Job.findById(req.params.jobId).populate('employer', 'name companyName email');

    if (!job) {
      console.log('❌ Job not found');
      return res.status(404).json({
        success: false,
        message: `Job not found with ID: ${req.params.jobId}`
      });
    }

    if (job.status !== 'active') {
      console.log('❌ Job not active, status:', job.status);
      return res.status(400).json({
        success: false,
        message: 'This job is no longer accepting applications'
      });
    }

    console.log('✅ Job found:', job.title, 'at', job.company);
    console.log('✅ Job employer:', job.employer._id, job.employer.companyName || job.employer.name);

    // Check if user is a job seeker
    if (req.user.role !== 'jobseeker') {
      console.log('❌ User is not a jobseeker, role:', req.user.role);
      return res.status(403).json({
        success: false,
        message: 'Only job seekers can apply for jobs'
      });
    }

    // Check if user has already applied for this job
    const existingApplication = await Application.findOne({
      job: req.params.jobId,
      applicant: req.user.id
    });

    if (existingApplication) {
      console.log('❌ User already applied for this job');
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this job'
      });
    }

    // Get user details for application
    const applicantUser = await User.findById(req.user.id);
    console.log('✅ Applicant details:', applicantUser.name, applicantUser.email);

    // Handle file uploads (resume and cover letter files)
    let resumeUrl = null;
    let coverLetterUrl = null;

    if (req.files) {
      console.log('📁 Processing uploaded files:', Object.keys(req.files));

      // Handle resume upload
      if (req.files.resume) {
        const resumeFile = req.files.resume;
        console.log('📄 Processing resume file:', {
          name: resumeFile.name,
          size: resumeFile.size,
          mimetype: resumeFile.mimetype
        });
        
        // Validate resume file
        const allowedResumeTypes = ['.pdf', '.doc', '.docx'];
        const resumeExtension = path.extname(resumeFile.name).toLowerCase();
        
        if (!allowedResumeTypes.includes(resumeExtension)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid resume file type. Only PDF, DOC, and DOCX files are allowed'
          });
        }

        if (resumeFile.size > 5 * 1024 * 1024) { // 5MB limit
          return res.status(400).json({
            success: false,
            message: 'Resume file too large. Maximum size is 5MB'
          });
        }

        // Create unique filename for resume
        const resumeFileName = `resume_${req.user.id}_${req.params.jobId}_${Date.now()}${resumeExtension}`;
        const resumeUploadDir = path.join(__dirname, '../public/uploads/applications/resumes/');
        const resumeUploadPath = path.join(resumeUploadDir, resumeFileName);

        // Ensure directory exists
        if (!fs.existsSync(resumeUploadDir)) {
          fs.mkdirSync(resumeUploadDir, { recursive: true });
          console.log('📁 Created resume upload directory:', resumeUploadDir);
        }

        try {
          // Move file from temp location to final location
          if (resumeFile.tempFilePath && fs.existsSync(resumeFile.tempFilePath)) {
            fs.copyFileSync(resumeFile.tempFilePath, resumeUploadPath);
            fs.unlinkSync(resumeFile.tempFilePath);
            console.log('✅ Resume file moved successfully');
          } else {
            await resumeFile.mv(resumeUploadPath);
            console.log('✅ Resume file uploaded successfully');
          }
          
          resumeUrl = `/uploads/applications/resumes/${resumeFileName}`;
          console.log('✅ Resume URL set to:', resumeUrl);
        } catch (error) {
          console.error('❌ Error moving resume file:', error);
          return res.status(500).json({
            success: false,
            message: 'Error saving resume file',
            error: error.message
          });
        }
      }

      // Handle cover letter file upload
      if (req.files.coverLetterFile) {
        const coverLetterFile = req.files.coverLetterFile;
        console.log('📄 Processing cover letter file:', {
          name: coverLetterFile.name,
          size: coverLetterFile.size,
          mimetype: coverLetterFile.mimetype
        });
        
        // Validate cover letter file
        const allowedCoverLetterTypes = ['.pdf', '.doc', '.docx', '.txt'];
        const coverLetterExtension = path.extname(coverLetterFile.name).toLowerCase();
        
        if (!allowedCoverLetterTypes.includes(coverLetterExtension)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid cover letter file type. Only PDF, DOC, DOCX, and TXT files are allowed'
          });
        }

        if (coverLetterFile.size > 2 * 1024 * 1024) { // 2MB limit
          return res.status(400).json({
            success: false,
            message: 'Cover letter file too large. Maximum size is 2MB'
          });
        }

        // Create unique filename for cover letter
        const coverLetterFileName = `coverletter_${req.user.id}_${req.params.jobId}_${Date.now()}${coverLetterExtension}`;
        const coverLetterUploadDir = path.join(__dirname, '../public/uploads/applications/coverletters/');
        const coverLetterUploadPath = path.join(coverLetterUploadDir, coverLetterFileName);

        // Ensure directory exists
        if (!fs.existsSync(coverLetterUploadDir)) {
          fs.mkdirSync(coverLetterUploadDir, { recursive: true });
          console.log('📁 Created cover letter upload directory:', coverLetterUploadDir);
        }

        try {
          // Move file from temp location to final location
          if (coverLetterFile.tempFilePath && fs.existsSync(coverLetterFile.tempFilePath)) {
            fs.copyFileSync(coverLetterFile.tempFilePath, coverLetterUploadPath);
            fs.unlinkSync(coverLetterFile.tempFilePath);
            console.log('✅ Cover letter file moved successfully');
          } else {
            await coverLetterFile.mv(coverLetterUploadPath);
            console.log('✅ Cover letter file uploaded successfully');
          }
          
          coverLetterUrl = `/uploads/applications/coverletters/${coverLetterFileName}`;
          console.log('✅ Cover letter URL set to:', coverLetterUrl);
        } catch (error) {
          console.error('❌ Error moving cover letter file:', error);
          return res.status(500).json({
            success: false,
            message: 'Error saving cover letter file',
            error: error.message
          });
        }
      }
    }

    // Get user's default resume if no resume uploaded
    if (!resumeUrl) {
      if (applicantUser.resume) {
        resumeUrl = applicantUser.resume;
        console.log('✅ Using user default resume:', resumeUrl);
      } else {
        console.log('❌ No resume found');
        return res.status(400).json({
          success: false,
          message: 'Resume is required. Please upload a resume or set a default resume in your profile.'
        });
      }
    }

    // Parse JSON fields safely
    let portfolioLinks = [];
    let customQuestions = [];

    try {
      if (req.body.portfolioLinks && typeof req.body.portfolioLinks === 'string') {
        portfolioLinks = JSON.parse(req.body.portfolioLinks);
      } else if (Array.isArray(req.body.portfolioLinks)) {
        portfolioLinks = req.body.portfolioLinks;
      }
    } catch (error) {
      console.warn('⚠️ Error parsing portfolioLinks:', error);
    }

    try {
      if (req.body.customQuestions && typeof req.body.customQuestions === 'string') {
        customQuestions = JSON.parse(req.body.customQuestions);
      } else if (Array.isArray(req.body.customQuestions)) {
        customQuestions = req.body.customQuestions;
      }
    } catch (error) {
      console.warn('⚠️ Error parsing customQuestions:', error);
    }

    // Create new application with comprehensive data
    const applicationData = {
      job: req.params.jobId,
      applicant: req.user.id,
      coverLetter: req.body.coverLetter || '',
      resume: resumeUrl,
      coverLetterFile: coverLetterUrl,
      additionalInfo: req.body.additionalInfo || '',
      expectedSalary: req.body.expectedSalary ? Number(req.body.expectedSalary) : null,
      availableStartDate: req.body.availableStartDate ? new Date(req.body.availableStartDate) : null,
      portfolioLinks: portfolioLinks,
      customQuestions: customQuestions,
      status: 'pending',
      appliedAt: new Date(),
      source: 'direct'
    };

    console.log('💾 Creating application with data:', {
      jobId: applicationData.job,
      applicantId: applicationData.applicant,
      status: applicationData.status,
      hasResume: !!applicationData.resume,
      hasCoverLetter: !!applicationData.coverLetter
    });

    // Create the application
    const application = await Application.create(applicationData);
    console.log('✅ Application created with ID:', application._id);

    // CRITICAL: Populate the application with all necessary data
    const populatedApplication = await Application.findById(application._id)
      .populate({
        path: 'applicant',
        select: 'name email phone location skills bio experience education profilePhoto'
      })
      .populate({
        path: 'job',
        select: 'title company location jobType employer requirements responsibilities',
        populate: {
          path: 'employer',
          select: 'name companyName email'
        }
      });

    console.log('✅ Application populated:', {
      id: populatedApplication._id,
      applicantName: populatedApplication.applicant?.name,
      jobTitle: populatedApplication.job?.title,
      employerName: populatedApplication.job?.employer?.companyName || populatedApplication.job?.employer?.name
    });

    // Update job application count
    await Job.findByIdAndUpdate(req.params.jobId, {
      $inc: { applicationCount: 1 }
    });
    console.log('✅ Job application count incremented');

    // Track application for employer dashboard
    console.log('📊 Application tracking info:');
    console.log('- Job ID:', req.params.jobId);
    console.log('- Employer ID:', job.employer._id);
    console.log('- Application ID:', application._id);
    console.log('- Application Status:', application.status);

    console.log('=== JOB APPLICATION PROCESS COMPLETE ===');

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: populatedApplication,
      debug: {
        applicationId: application._id,
        jobId: req.params.jobId,
        employerId: job.employer._id,
        applicantId: req.user.id,
        status: application.status
      }
    });

  } catch (err) {
    console.error('❌ Apply for job error:', err);
    
    // Clean up any uploaded files if application creation failed
    if (req.files) {
      Object.values(req.files).forEach(file => {
        if (file.tempFilePath && fs.existsSync(file.tempFilePath)) {
          try {
            fs.unlinkSync(file.tempFilePath);
          } catch (cleanupError) {
            console.error('❌ Error cleaning up temp file:', cleanupError);
          }
        }
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
};

// @desc    Get all applications for a specific job - FIXED
// @route   GET /api/applications/job/:jobId
// @access  Private (Employer only)
exports.getJobApplications = async (req, res) => {
  try {
    console.log('=== GET JOB APPLICATIONS START ===');
    console.log('Job ID:', req.params.jobId);
    console.log('User ID:', req.user.id);
    console.log('User Role:', req.user.role);

    const { page = 1, limit = 10, status, sortBy = 'appliedAt', sortOrder = 'desc' } = req.query;

    // Check if job exists and populate employer info
    const job = await Job.findById(req.params.jobId).populate('employer', 'name companyName email');

    if (!job) {
      console.log('❌ Job not found');
      return res.status(404).json({
        success: false,
        message: `Job not found with ID: ${req.params.jobId}`
      });
    }

    console.log('✅ Job found:', job.title);
    console.log('✅ Job employer ID:', job.employer._id);
    console.log('✅ Current user ID:', req.user.id);

    // Check if user is the job owner
    if (job.employer._id.toString() !== req.user.id.toString()) {
      console.log('❌ User not authorized - not job owner');
      console.log('Expected employer ID:', job.employer._id.toString());
      console.log('Actual user ID:', req.user.id.toString());
      return res.status(401).json({
        success: false,
        message: `User ${req.user.id} is not authorized to view applications for this job`
      });
    }

    console.log('✅ User authorized as job owner');

    // Build query
    const query = { job: req.params.jobId };
    if (status) {
      query.status = status;
    }

    console.log('🔍 Application query:', query);

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get applications with comprehensive population
    const applications = await Application.find(query)
      .populate({
        path: 'applicant',
        select: 'name email phone location skills bio experience education profilePhoto resumeFileName'
      })
      .populate({
        path: 'job',
        select: 'title company location jobType employer',
        populate: {
          path: 'employer',
          select: 'name companyName email'
        }
      })
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    console.log('📊 Applications found:', applications.length);
    
    // Log each application for debugging
    applications.forEach((app, index) => {
      console.log(`Application ${index + 1}:`, {
        id: app._id,
        status: app.status,
        applicantName: app.applicant?.name,
        appliedAt: app.appliedAt
      });
    });

    // Get total count for pagination
    const total = await Application.countDocuments(query);
    console.log('📊 Total applications count:', total);

    // Get status breakdown
    const statusBreakdown = await Application.aggregate([
      { $match: { job: job._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    console.log('📊 Status breakdown:', statusBreakdown);
    console.log('=== GET JOB APPLICATIONS COMPLETE ===');

    res.status(200).json({
      success: true,
      count: applications.length,
      total,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      },
      statusBreakdown: statusBreakdown.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      data: applications,
      debug: {
        jobId: req.params.jobId,
        employerId: job.employer._id,
        query: query,
        totalFound: total
      }
    });
  } catch (err) {
    console.error('❌ Get job applications error:', err);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
};

// @desc    Get all applications for current employer across all their jobs - NEW
// @route   GET /api/applications/employer/me
// @access  Private (Employer only)
exports.getEmployerApplications = async (req, res) => {
  try {
    console.log('=== GET EMPLOYER ALL APPLICATIONS START ===');
    console.log('Employer ID:', req.user.id);
    console.log('User Role:', req.user.role);

    if (req.user.role !== 'employer') {
      return res.status(403).json({
        success: false,
        message: 'Only employers can access this endpoint'
      });
    }

    const { page = 1, limit = 10, status, sortBy = 'appliedAt', sortOrder = 'desc' } = req.query;

    // First, get all jobs posted by this employer
    const employerJobs = await Job.find({ employer: req.user.id }).select('_id title');
    const jobIds = employerJobs.map(job => job._id);

    console.log('✅ Employer jobs found:', jobIds.length);
    console.log('Job IDs:', jobIds.map(id => id.toString()));

    if (jobIds.length === 0) {
      console.log('ℹ️ No jobs found for employer');
      return res.status(200).json({
        success: true,
        count: 0,
        total: 0,
        data: [],
        message: 'No jobs found for this employer'
      });
    }

    // Build query for applications to these jobs
    const query = { job: { $in: jobIds } };
    if (status) {
      query.status = status;
    }

    console.log('🔍 Application query:', query);

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get applications with comprehensive population
    const applications = await Application.find(query)
      .populate({
        path: 'applicant',
        select: 'name email phone location skills bio experience education profilePhoto resumeFileName'
      })
      .populate({
        path: 'job',
        select: 'title company location jobType employer',
        populate: {
          path: 'employer',
          select: 'name companyName email'
        }
      })
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    console.log('📊 Applications found:', applications.length);

    // Get total count for pagination
    const total = await Application.countDocuments(query);
    console.log('📊 Total applications count:', total);

    // Get status breakdown
    const statusBreakdown = await Application.aggregate([
      { $match: query },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    console.log('📊 Status breakdown:', statusBreakdown);
    console.log('=== GET EMPLOYER ALL APPLICATIONS COMPLETE ===');

    res.status(200).json({
      success: true,
      count: applications.length,
      total,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      },
      statusBreakdown: statusBreakdown.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      data: applications,
      debug: {
        employerId: req.user.id,
        jobsCount: jobIds.length,
        totalApplications: total
      }
    });
  } catch (err) {
    console.error('❌ Get employer applications error:', err);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
};

// Rest of the methods remain the same...
exports.getApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate({
        path: 'applicant',
        select: 'name email phone location skills bio experience education profilePhoto resumeFileName'
      })
      .populate({
        path: 'job',
        select: 'title company location jobType employer requirements responsibilities'
      });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: `Application not found with ID: ${req.params.id}`
      });
    }

    // Security check - Only the applicant or the employer can view this application
    const isApplicant = application.applicant._id.toString() === req.user.id;
    const isEmployer = application.job.employer.toString() === req.user.id;

    if (!isApplicant && !isEmployer) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this application'
      });
    }

    // Track application view if employer is viewing
    if (isEmployer && !application.viewedByEmployer) {
      application.viewedByEmployer = true;
      application.viewedByEmployerAt = new Date();
      application.applicationViews += 1;
      await application.save();
    }

    res.status(200).json({
      success: true,
      data: application
    });
  } catch (err) {
    console.error('Get application error:', err);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
};

exports.updateApplicationStatus = async (req, res) => {
  try {
    let application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: `Application not found with ID: ${req.params.id}`
      });
    }

    // Find the job
    const job = await Job.findById(application.job);

    // Check if user is the job owner
    if (job.employer.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: `User ${req.user.id} is not authorized to update this application`
      });
    }

    // Check if status is valid
    const validStatuses = ['pending', 'reviewing', 'rejected', 'shortlisted', 'accepted', 'interview-scheduled'];
    if (req.body.status && !validStatuses.includes(req.body.status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of ${validStatuses.join(', ')}`
      });
    }

    // Prepare update data
    const updateData = {
      updatedAt: Date.now()
    };

    if (req.body.status) updateData.status = req.body.status;
    if (req.body.employerNotes) updateData.employerNotes = req.body.employerNotes;
    if (req.body.interviewDate) updateData.interviewDate = new Date(req.body.interviewDate);
    if (req.body.interviewLocation) updateData.interviewLocation = req.body.interviewLocation;
    if (req.body.interviewNotes) updateData.interviewNotes = req.body.interviewNotes;

    // Update application
    application = await Application.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate({
      path: 'applicant',
      select: 'name email phone'
    }).populate({
      path: 'job',
      select: 'title company'
    });

    res.status(200).json({
      success: true,
      message: 'Application updated successfully',
      data: application
    });
  } catch (err) {
    console.error('Update application status error:', err);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
};

exports.getMyApplications = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, sortBy = 'appliedAt', sortOrder = 'desc' } = req.query;

    // Check if user is a job seeker
    if (req.user.role !== 'jobseeker') {
      return res.status(403).json({
        success: false,
        message: 'Only job seekers can access this route'
      });
    }

    // Build query
    const query = { applicant: req.user.id };
    if (status) {
      query.status = status;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get applications
    const applications = await Application.find(query)
      .populate({
        path: 'job',
        select: 'title company location jobType createdAt status salary'
      })
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Application.countDocuments(query);

    // Get status breakdown
    const statusBreakdown = await Application.aggregate([
      { $match: { applicant: req.user._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      success: true,
      count: applications.length,
      total,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      },
      statusBreakdown: statusBreakdown.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      data: applications
    });
  } catch (err) {
    console.error('Get my applications error:', err);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
};

exports.withdrawApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: `Application not found with ID: ${req.params.id}`
      });
    }

    // Check if user is the applicant
    if (application.applicant.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'You can only withdraw your own applications'
      });
    }

    // Check if application can be withdrawn (not accepted or in final stages)
    if (['accepted', 'rejected'].includes(application.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot withdraw application with status: ${application.status}`
      });
    }

    // Delete application files if they exist
    if (application.resume && application.resume.includes('/applications/')) {
      const resumePath = path.join(__dirname, '../public', application.resume);
      if (fs.existsSync(resumePath)) {
        try {
          fs.unlinkSync(resumePath);
          console.log('Deleted resume file:', resumePath);
        } catch (error) {
          console.error('Error deleting resume file:', error);
        }
      }
    }

    if (application.coverLetterFile) {
      const coverLetterPath = path.join(__dirname, '../public', application.coverLetterFile);
      if (fs.existsSync(coverLetterPath)) {
        try {
          fs.unlinkSync(coverLetterPath);
          console.log('Deleted cover letter file:', coverLetterPath);
        } catch (error) {
          console.error('Error deleting cover letter file:', error);
        }
      }
    }

    // Remove application
    await Application.findByIdAndDelete(req.params.id);

    // Update job application count
    await Job.findByIdAndUpdate(application.job, {
      $inc: { applicationCount: -1 }
    });

    res.status(200).json({
      success: true,
      message: 'Application withdrawn successfully'
    });

  } catch (err) {
    console.error('Withdraw application error:', err);
    res.status(500).json({
      success: false,
      message:'Server Error',
      error: err.message
    });
  }
};