// utils/preferenceValidation.js
const validateJobPreferences = (preferences) => {
  const errors = [];
  
  try {
    // For now, just basic validation to avoid blocking functionality
    if (preferences && typeof preferences === 'object') {
      // Validate job types if provided
      if (preferences.preferredJobTypes && !Array.isArray(preferences.preferredJobTypes)) {
        errors.push('Preferred job types must be an array');
      }

      // Validate salary range if provided
      if (preferences.salaryRange) {
        if (typeof preferences.salaryRange !== 'object') {
          errors.push('Salary range must be an object');
        } else {
          if (preferences.salaryRange.min && preferences.salaryRange.min < 0) {
            errors.push('Minimum salary cannot be negative');
          }
          if (preferences.salaryRange.max && preferences.salaryRange.max < 0) {
            errors.push('Maximum salary cannot be negative');
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };

  } catch (error) {
    return {
      isValid: false,
      errors: [`Validation error: ${error.message}`]
    };
  }
};

module.exports = {
  validateJobPreferences
};