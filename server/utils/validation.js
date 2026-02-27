// Validate email
exports.isValidEmail = (email) => {
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return emailRegex.test(email);
  };
  
  // Validate password (min 6 chars, contains number and letter)
  exports.isValidPassword = (password) => {
    return password.length >= 6 && 
           /[0-9]/.test(password) && 
           /[a-zA-Z]/.test(password);
  };
  
  // Validate job input
  exports.validateJobInput = (job) => {
    const errors = {};
  
    // Required fields
    const requiredFields = [
      'title', 'description', 'company', 'location', 'jobType', 'experience', 'skills'
    ];
  
    requiredFields.forEach(field => {
      if (!job[field]) {
        errors[field] = `${field} is required`;
      }
    });
  
    // Validate job type
    const validJobTypes = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote'];
    if (job.jobType && !validJobTypes.includes(job.jobType)) {
      errors.jobType = `Job type must be one of: ${validJobTypes.join(', ')}`;
    }
  
    // Validate experience level
    const validExperienceLevels = ['Entry-level', 'Mid-level', 'Senior', 'Executive'];
    if (job.experience && !validExperienceLevels.includes(job.experience)) {
      errors.experience = `Experience level must be one of: ${validExperienceLevels.join(', ')}`;
    }
  
    // Validate skills array
    if (job.skills && !Array.isArray(job.skills)) {
      errors.skills = 'Skills must be an array';
    }
  
    // Validate salary
    if (job.salary) {
      if (job.salary.min && typeof job.salary.min !== 'number') {
        errors.salaryMin = 'Minimum salary must be a number';
      }
      
      if (job.salary.max && typeof job.salary.max !== 'number') {
        errors.salaryMax = 'Maximum salary must be a number';
      }
      
      if (job.salary.min && job.salary.max && job.salary.min > job.salary.max) {
        errors.salaryRange = 'Minimum salary cannot be greater than maximum salary';
      }
    }
  
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };
  
  // Validate application input
  exports.validateApplicationInput = (application) => {
    const errors = {};
  
    // Cover letter is required
    if (!application.coverLetter) {
      errors.coverLetter = 'Cover letter is required';
    }
  
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };