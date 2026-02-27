import React, { useState, useEffect } from 'react';

const JobPreferencesPage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // FIXED: Updated initial state with skills as array
  const [preferences, setPreferences] = useState({
    skills: [], // FIXED: Changed from string to array
    experience: '',
    jobTypes: [],
    industries: [],
    locations: [],
    salaryRange: {
      min: '',
      max: '',
      currency: 'USD'
    },
    remoteWork: false,
    workEnvironment: [],
    companySize: [],
    benefits: []
  });

  const [savedPreferences, setSavedPreferences] = useState(null);
  const [skillInput, setSkillInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Static data arrays
  const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'];
  
  const industries = [
    'Software', 'Hardware', 'Fintech', 'Healthcare', 'E-commerce',
    'Education', 'Media', 'Gaming', 'AI/ML', 'Blockchain',
    'SaaS', 'Mobile', 'Web Development', 'Data Science', 'DevOps',
    'Cybersecurity', 'Cloud Computing', 'Design', 'Marketing', 'Sales',
    'HR', 'Finance', 'Legal', 'Consulting', 'Manufacturing', 'Other'
  ];

  const experienceLevels = ['Entry-level', 'Mid-level', 'Senior', 'Executive'];
  const workEnvironments = ['Startup', 'Corporate', 'Agency', 'Non-profit', 'Government', 'Freelance'];
  const companySizes = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];
  
  const benefitsList = [
    'Health Insurance', 'Dental Insurance', 'Vision Insurance',
    'Retirement Plan', 'Paid Time Off', 'Flexible Hours',
    'Remote Work', 'Professional Development', 'Stock Options',
    'Gym Membership', 'Free Meals', 'Transportation', 'Childcare',
    'Mental Health Support', 'Learning Budget', 'Conference Attendance'
  ];

  // Popular skills for suggestions
  const popularSkills = [
    'React', 'JavaScript', 'Python', 'Java', 'Node.js', 'Angular', 'Vue.js',
    'TypeScript', 'Machine Learning', 'Data Science', 'AWS', 'Docker',
    'Kubernetes', 'MongoDB', 'PostgreSQL', 'MySQL', 'Git', 'Linux',
    'Project Management', 'Agile', 'Scrum', 'UI/UX Design', 'Figma',
    'Photoshop', 'HTML', 'CSS', 'SASS', 'Bootstrap', 'Tailwind CSS',
    'Redux', 'GraphQL', 'REST API', 'Express.js', 'Django', 'Flask',
    'Spring Boot', 'Laravel', 'PHP', 'C++', 'C#', '.NET', 'Ruby',
    'Go', 'Rust', 'Swift', 'Kotlin', 'Flutter', 'React Native',
    'Firebase', 'Azure', 'Google Cloud', 'DevOps', 'CI/CD', 'Jenkins'
  ];

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      window.location.href = '/login';
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'jobseeker') {
      window.location.href = '/dashboard/employer';
      return;
    }

    setUser(parsedUser);
    await loadUserPreferences();
    setLoading(false);
  };

  const loadUserPreferences = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Load user profile
      const profileResponse = await fetch('http://localhost:5000/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const profileData = await profileResponse.json();
      console.log('Profile data loaded:', profileData);

      // Load job preferences separately
      const prefsResponse = await fetch('http://localhost:5000/api/jobs/preferences', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const prefsData = await prefsResponse.json();
      console.log('Job preferences loaded:', prefsData);

      if (profileData.success) {
        const userProfile = profileData.data;
        const userPrefs = prefsData.success ? prefsData.data : {};
        
        setSavedPreferences(userPrefs);
        
        // FIXED: Properly handle skills from both profile and preferences
        let userSkills = [];
        
        // Get skills from preferences first (if available)
        if (userPrefs.preferredTechnologies && Array.isArray(userPrefs.preferredTechnologies)) {
          userSkills = userPrefs.preferredTechnologies;
        } 
        // Fallback to profile skills
        else if (userProfile.skills && Array.isArray(userProfile.skills)) {
          userSkills = userProfile.skills;
        }
        // Handle string skills
        else if (typeof userProfile.skills === 'string' && userProfile.skills.trim()) {
          userSkills = userProfile.skills.split(',').map(skill => skill.trim()).filter(skill => skill);
        }

        console.log('User skills loaded:', userSkills);
        
        setPreferences({
          skills: userSkills,
          experience: userPrefs.experienceLevel || '',
          jobTypes: userPrefs.jobTypes || [],
          industries: userPrefs.industries || [],
          locations: userPrefs.preferredLocations || [],
          salaryRange: {
            min: userPrefs.salaryRange?.min || '',
            max: userPrefs.salaryRange?.max || '',
            currency: userPrefs.salaryRange?.currency || 'USD'
          },
          remoteWork: userPrefs.remoteWork || false,
          workEnvironment: userPrefs.workEnvironment || [],
          companySize: userPrefs.companySize || [],
          benefits: userPrefs.benefits || []
        });

        // Show recommendations if user has skills and preferences
        if (userSkills.length >= 1) {
          setShowRecommendations(true);
          await getRecommendations();
        }
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      setErrorMessage('Failed to load preferences');
    }
  };

  // FIXED: Skills management functions
  const addSkill = (skill) => {
    const trimmedSkill = skill.trim();
    if (trimmedSkill && !preferences.skills.includes(trimmedSkill)) {
      setPreferences(prev => ({
        ...prev,
        skills: [...prev.skills, trimmedSkill]
      }));
    }
    setSkillInput('');
    setShowSuggestions(false);
  };

  const removeSkill = (skillToRemove) => {
    setPreferences(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleSkillKeyPress = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (skillInput.trim()) {
        addSkill(skillInput.trim());
      }
    }
  };

  const filteredSuggestions = popularSkills.filter(skill => 
    skill.toLowerCase().includes(skillInput.toLowerCase()) &&
    !preferences.skills.includes(skill)
  ).slice(0, 8);

  const handleMultiSelectChange = (field, value) => {
    setPreferences(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const handleInputChange = (field, value) => {
    setPreferences(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSalaryChange = (field, value) => {
    setPreferences(prev => ({
      ...prev,
      salaryRange: {
        ...prev.salaryRange,
        [field]: value
      }
    }));
  };

  // FIXED: Updated save preferences function to handle skills properly
  const savePreferences = async () => {
    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      const token = localStorage.getItem('token');
      
      console.log('Saving preferences with skills:', preferences.skills);
      
      // STEP 1: Update user profile with skills
      const profileResponse = await fetch('http://localhost:5000/api/users/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          skills: preferences.skills,
          // Include other required fields to prevent validation errors
          name: user.name,
          email: user.email,
          bio: user.bio || 'Job seeker looking for opportunities',
          location: user.location || 'United States'
        })
      });

      const profileData = await profileResponse.json();
      console.log('Profile update response:', profileData);
      
      if (!profileData.success) {
        throw new Error(profileData.message || 'Failed to update profile skills');
      }

      // STEP 2: Save job preferences with preferredTechnologies
      const preferencesPayload = {
        preferredJobTypes: preferences.jobTypes,
        preferredLocations: preferences.locations,
        preferredTechnologies: preferences.skills, // Send skills as preferredTechnologies
        salaryRange: {
          min: preferences.salaryRange.min ? parseInt(preferences.salaryRange.min) : undefined,
          max: preferences.salaryRange.max ? parseInt(preferences.salaryRange.max) : undefined,
          currency: preferences.salaryRange.currency
        },
        remoteWork: preferences.remoteWork,
        industries: preferences.industries,
        experienceLevel: preferences.experience || undefined,
        workEnvironment: preferences.workEnvironment,
        companySize: preferences.companySize,
        benefits: preferences.benefits
      };
      
      console.log('Sending preferences payload:', preferencesPayload);
      
      const prefsResponse = await fetch('http://localhost:5000/api/jobs/preferences', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferencesPayload)
      });

      const prefsData = await prefsResponse.json();
      console.log('Preferences save response:', prefsData);
      
      if (prefsData.success) {
        setSavedPreferences(preferences);
        setShowRecommendations(true);
        setSuccessMessage('Skills and preferences saved successfully! Getting your recommendations...');
        
        // Update user data in localStorage
        const updatedUser = { ...user, skills: preferences.skills };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Get recommendations
        await getRecommendations();
      } else {
        throw new Error(prefsData.message || 'Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      setErrorMessage(error.message || 'Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getRecommendations = async () => {
    setLoadingRecommendations(true);
    setErrorMessage('');
    
    try {
      const token = localStorage.getItem('token');
      
      // Try AI recommendations first
      let response = await fetch('http://localhost:5000/api/jobs/ai/recommendations?limit=10&useAI=true', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // If AI endpoint fails, try regular recommendations
      if (!response.ok) {
        console.log('AI endpoint failed, trying regular recommendations...');
        response = await fetch('http://localhost:5000/api/jobs/recommendations?limit=10', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }

      const data = await response.json();
      console.log('Recommendations response:', data);
      
      if (data.success) {
        setRecommendations(data.data || []);
        if (data.data && data.data.length === 0) {
          setErrorMessage('No recommendations found. Make sure you have added skills to your profile and set your preferences.');
        }
      } else {
        setRecommendations([]);
        setErrorMessage(data.message || 'No recommendations found. Try adding skills to your profile first.');
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setRecommendations([]);
      setErrorMessage('Failed to fetch recommendations. Please try again.');
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const formatSalary = (job) => {
    if (!job.salary || !job.salary.min) return 'Salary not specified';
    
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: job.salary.currency || 'USD',
      minimumFractionDigits: 0
    });
    
    const min = formatter.format(job.salary.min);
    const max = job.salary.max ? formatter.format(job.salary.max) : null;
    
    return max ? `${min} - ${max}` : `${min}+`;
  };

  const saveJob = async (jobId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/jobs/saved/${jobId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        setSuccessMessage('Job saved successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error saving job:', error);
      setErrorMessage('Failed to save job');
    }
  };

  const applyToJob = (jobId) => {
    window.location.href = `/jobs/${jobId}/apply`;
  };

  const viewJobDetails = (jobId) => {
    window.location.href = `/jobs/${jobId}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                <i className="fas fa-cog mr-3 text-blue-600"></i>
                Job Preferences & AI Recommendations
              </h1>
              <p className="text-gray-600">
                Set your preferences and get personalized job recommendations powered by AI
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {savedPreferences && (
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                  <i className="fas fa-check mr-1"></i>
                  Preferences Saved
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
            <div className="flex">
              <i className="fas fa-check-circle text-green-500 mr-2 mt-1"></i>
              <p className="text-green-700">{successMessage}</p>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex">
              <i className="fas fa-exclamation-circle text-red-500 mr-2 mt-1"></i>
              <p className="text-red-700">{errorMessage}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Preferences Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <i className="fas fa-sliders-h mr-2 text-blue-600"></i>
                Set Your Job Preferences
              </h2>
              
              {/* FIXED: Enhanced Skills Section */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <i className="fas fa-code mr-1 text-blue-600"></i>
                  Skills & Technologies <span className="text-red-500">*</span>
                </label>
                
                {/* Current Skills Display */}
                {preferences.skills && preferences.skills.length > 0 && (
                  <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-sm font-medium text-blue-900 mb-2">
                      Your Skills ({preferences.skills.length}):
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {preferences.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-300"
                        >
                          <i className="fas fa-check-circle mr-1 text-blue-600"></i>
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="ml-2 text-blue-600 hover:text-blue-800 focus:outline-none"
                            title="Remove skill"
                          >
                            <i className="fas fa-times text-xs"></i>
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skill Input */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Type a skill and press Enter (e.g., React, Python, Machine Learning)"
                    value={skillInput}
                    onChange={(e) => {
                      setSkillInput(e.target.value);
                      setShowSuggestions(e.target.value.length > 0);
                    }}
                    onKeyPress={handleSkillKeyPress}
                    onFocus={() => setShowSuggestions(skillInput.length > 0)}
                    onBlur={() => {
                      // Delay hiding suggestions to allow clicking
                      setTimeout(() => setShowSuggestions(false), 150);
                    }}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
                  />
                  
                  {/* Suggestions Dropdown */}
                  {showSuggestions && filteredSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                      {filteredSuggestions.map((skill, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => addSkill(skill)}
                          className="w-full px-3 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none text-sm border-b border-gray-100 last:border-b-0"
                        >
                          <i className="fas fa-plus mr-2 text-blue-600"></i>
                          {skill}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Popular Skills Quick Add */}
                <div className="mt-3">
                  <div className="text-xs font-medium text-gray-600 mb-2">
                    Popular Skills (click to add):
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {popularSkills
                      .filter(skill => !preferences.skills.includes(skill))
                      .slice(0, 12)
                      .map((skill, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => addSkill(skill)}
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-blue-100 hover:text-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <i className="fas fa-plus mr-1"></i>
                          {skill}
                        </button>
                      ))}
                  </div>
                </div>

                {/* Help Text */}
                <div className="mt-2 text-xs text-gray-500 space-y-1">
                  <p className="flex items-center">
                    <i className="fas fa-info-circle mr-1 text-blue-500"></i>
                    Add at least 1 skill separated by commas or pressing Enter. This helps our AI match you with relevant jobs.
                  </p>
                  <p className="flex items-center">
                    <i className="fas fa-lightbulb mr-1 text-yellow-500"></i>
                    Tip: Include both technical skills (React, Python) and soft skills (Leadership, Communication)
                  </p>
                </div>

                {/* Validation Message */}
                {preferences.skills.length === 0 && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-xs text-yellow-800 flex items-center">
                      <i className="fas fa-exclamation-triangle mr-1"></i>
                      Please add at least one skill to improve AI job matching accuracy.
                    </p>
                  </div>
                )}
              </div>

              {/* Experience Level */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <i className="fas fa-chart-line mr-1"></i>
                  Experience Level
                </label>
                <select
                  value={preferences.experience}
                  onChange={(e) => handleInputChange('experience', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select your experience level</option>
                  {experienceLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              {/* Job Types */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <i className="fas fa-briefcase mr-1"></i>
                  Preferred Job Types
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {jobTypes.map(type => (
                    <label key={type} className="flex items-center p-2 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.jobTypes.includes(type)}
                        onChange={() => handleMultiSelectChange('jobTypes', type)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                      />
                      <span className="text-sm text-gray-700">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Industries */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <i className="fas fa-industry mr-1"></i>
                  Preferred Industries
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {industries.map(industry => (
                    <label key={industry} className="flex items-center p-1 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.industries.includes(industry)}
                        onChange={() => handleMultiSelectChange('industries', industry)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                      />
                      <span className="text-sm text-gray-700">{industry}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Locations */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <i className="fas fa-map-marker-alt mr-1"></i>
                  Preferred Locations
                </label>
                <textarea
                  value={preferences.locations.join(', ')}
                  onChange={(e) => handleInputChange('locations', e.target.value.split(',').map(loc => loc.trim()).filter(loc => loc))}
                  placeholder="e.g., New York, San Francisco, Remote, London, Austin"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="2"
                />
                <p className="text-sm text-gray-500 mt-1">Separate multiple locations with commas. Include "Remote" if you're open to remote work.</p>
              </div>

              {/* Salary Range */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <i className="fas fa-dollar-sign mr-1"></i>
                  Expected Salary Range
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <input
                      type="number"
                      placeholder="Min salary"
                      value={preferences.salaryRange.min}
                      onChange={(e) => handleSalaryChange('min', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Minimum</p>
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Max salary"
                      value={preferences.salaryRange.max}
                      onChange={(e) => handleSalaryChange('max', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Maximum</p>
                  </div>
                  <div>
                    <select
                      value={preferences.salaryRange.currency}
                      onChange={(e) => handleSalaryChange('currency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Currency</p>
                  </div>
                </div>
              </div>

              {/* Remote Work */}
              <div className="mb-6">
                <label className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.remoteWork}
                    onChange={(e) => handleInputChange('remoteWork', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      <i className="fas fa-home mr-1"></i>
                      Open to remote work
                    </span>
                    <p className="text-xs text-gray-500">Include remote job opportunities in recommendations</p>
                  </div>
                </label>
              </div>

              {/* Work Environment */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <i className="fas fa-building mr-1"></i>
                  Preferred Work Environment
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {workEnvironments.map(env => (
                    <label key={env} className="flex items-center p-2 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.workEnvironment.includes(env)}
                        onChange={() => handleMultiSelectChange('workEnvironment', env)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                      />
                      <span className="text-sm text-gray-700">{env}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Company Size */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <i className="fas fa-users mr-1"></i>
                  Preferred Company Size
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {companySizes.map(size => (
                    <label key={size} className="flex items-center p-2 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.companySize.includes(size)}
                        onChange={() => handleMultiSelectChange('companySize', size)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                      />
                      <span className="text-sm text-gray-700">{size} employees</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Benefits */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <i className="fas fa-gift mr-1"></i>
                  Desired Benefits
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {benefitsList.map(benefit => (
                    <label key={benefit} className="flex items-center p-1 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.benefits.includes(benefit)}
                        onChange={() => handleMultiSelectChange('benefits', benefit)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                      />
                      <span className="text-sm text-gray-700">{benefit}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <i className="fas fa-undo mr-2"></i>
                  Reset
                </button>
                <button
                  type="button"
                  onClick={savePreferences}
                  disabled={saving || preferences.skills.length === 0}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save mr-2"></i>
                      Save Skills & Preferences
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Recommendations Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <i className="fas fa-robot mr-2 text-blue-600"></i>
                AI Job Recommendations
              </h3>

              {!showRecommendations ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">
                    <i className="fas fa-lightbulb text-4xl"></i>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">
                    Save your preferences to get personalized AI-powered job recommendations
                  </p>
                  <button
                    onClick={getRecommendations}
                    disabled={preferences.skills.length === 0}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <i className="fas fa-magic mr-2"></i>
                    Get AI Recommendations
                  </button>
                </div>
              ) : (
                <div>
                  {loadingRecommendations ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600 text-sm">AI is analyzing the job market for you...</p>
                    </div>
                  ) : recommendations.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          {recommendations.length} personalized matches
                        </span>
                        <button
                          onClick={getRecommendations}
                          className="text-blue-600 hover:text-blue-700 text-sm"
                        >
                          <i className="fas fa-sync-alt mr-1"></i>
                          Refresh
                        </button>
                      </div>
                      
                      {recommendations.slice(0, 3).map((job, index) => (
                        <div key={job._id || index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-gray-900 text-sm line-clamp-2">{job.title}</h4>
                            {job.recommendationScore && (
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium ml-2 flex-shrink-0">
                                {Math.round(job.recommendationScore)}% match
                              </span>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2">
                            <i className="fas fa-building mr-1"></i>
                            {job.company}
                          </p>
                          
                          <div className="flex items-center text-xs text-gray-500 mb-3 space-x-3">
                            <span>
                              <i className="fas fa-map-marker-alt mr-1"></i>
                              {job.location}
                            </span>
                            <span>
                              <i className="fas fa-clock mr-1"></i>
                              {job.jobType}
                            </span>
                          </div>

                          {job.salary && job.salary.min && (
                            <p className="text-sm font-medium text-green-600 mb-3">
                              <i className="fas fa-dollar-sign mr-1"></i>
                              {formatSalary(job)}
                            </p>
                          )}

                          {job.skills && job.skills.length > 0 && (
                            <div className="mb-3">
                              <div className="flex flex-wrap gap-1">
                                {job.skills.slice(0, 3).map((skill, i) => (
                                  <span key={i} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                    {skill}
                                  </span>
                                ))}
                                {job.skills.length > 3 && (
                                  <span className="text-xs text-gray-500">
                                    +{job.skills.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="flex space-x-2">
                            <button
                              onClick={() => viewJobDetails(job._id)}
                              className="flex-1 px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <i className="fas fa-eye mr-1"></i>
                              View
                            </button>
                            <button
                              onClick={() => saveJob(job._id)}
                              className="px-3 py-1 border border-gray-300 rounded text-xs hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <i className="fas fa-bookmark"></i>
                            </button>
                            <button
                              onClick={() => applyToJob(job._id)}
                              className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                              <i className="fas fa-paper-plane mr-1"></i>
                              Apply
                            </button>
                          </div>
                        </div>
                      ))}

                      {recommendations.length > 3 && (
                        <div className="text-center pt-4">
                          <button
                            onClick={() => window.location.href = '/dashboard/recommendations'}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            View All {recommendations.length} Recommendations
                            <i className="fas fa-arrow-right ml-1"></i>
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-gray-400 mb-4">
                        <i className="fas fa-search text-4xl"></i>
                      </div>
                      <p className="text-gray-600 text-sm mb-4">
                        No recommendations found. Try adding more skills or adjusting your preferences.
                      </p>
                      <button
                        onClick={getRecommendations}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <i className="fas fa-sync-alt mr-2"></i>
                        Try Again
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Profile Completeness */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  <i className="fas fa-chart-pie mr-1 text-blue-600"></i>
                  Profile Completeness
                </h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Skills Added</span>
                    <span className={`font-medium ${preferences.skills.length > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {preferences.skills.length > 0 ? (
                        <><i className="fas fa-check mr-1"></i>Complete</>
                      ) : (
                        <><i className="fas fa-times mr-1"></i>Missing</>
                      )}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Experience Level</span>
                    <span className={`font-medium ${preferences.experience ? 'text-green-600' : 'text-yellow-600'}`}>
                      {preferences.experience ? (
                        <><i className="fas fa-check mr-1"></i>Set</>
                      ) : (
                        <><i className="fas fa-exclamation mr-1"></i>Optional</>
                      )}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Preferences</span>
                    <span className={`font-medium ${savedPreferences ? 'text-green-600' : 'text-yellow-600'}`}>
                      {savedPreferences ? (
                        <><i className="fas fa-check mr-1"></i>Saved</>
                      ) : (
                        <><i className="fas fa-save mr-1"></i>Save to Activate</>
                      )}
                    </span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-800">
                    <i className="fas fa-lightbulb mr-1"></i>
                    <strong>Tip:</strong> Complete all sections to get the most accurate AI job recommendations tailored to your preferences.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        {/* <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            <i className="fas fa-rocket mr-2 text-blue-600"></i>
            Quick Actions
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button
              onClick={() => window.location.href = '/dashboard/saved-jobs'}
              className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="text-center">
                <i className="fas fa-bookmark text-2xl text-blue-600 mb-2"></i>
                <p className="text-sm font-medium text-gray-900">Saved Jobs</p>
                <p className="text-xs text-gray-500">View bookmarked positions</p>
              </div>
            </button>
            
            <button
              onClick={() => window.location.href = '/dashboard/applications'}
              className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="text-center">
                <i className="fas fa-paper-plane text-2xl text-green-600 mb-2"></i>
                <p className="text-sm font-medium text-gray-900">Applications</p>
                <p className="text-xs text-gray-500">Track your applications</p>
              </div>
            </button>
            
            <button
              onClick={() => window.location.href = '/dashboard/profile'}
              className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="text-center">
                <i className="fas fa-user text-2xl text-purple-600 mb-2"></i>
                <p className="text-sm font-medium text-gray-900">Profile</p>
                <p className="text-xs text-gray-500">Update your information</p>
              </div>
            </button>
            
            <button
              onClick={() => window.location.href = '/jobs'}
              className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="text-center">
                <i className="fas fa-search text-2xl text-orange-600 mb-2"></i>
                <p className="text-sm font-medium text-gray-900">Browse Jobs</p>
                <p className="text-xs text-gray-500">Explore all opportunities</p>
              </div>
            </button>
          </div>
        </div> */}

        {/* Skills Helper */}
        {preferences.skills.length === 0 && (
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-start">
              <i className="fas fa-exclamation-triangle text-yellow-600 mr-3 mt-1"></i>
              <div>
                <h3 className="text-yellow-800 font-semibold mb-2">Need help with skills?</h3>
                <p className="text-yellow-700 text-sm mb-3">
                  Add at least 1 skill to get personalized job recommendations. Here are some popular skills by category:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <strong className="text-yellow-800">Frontend:</strong>
                    <p className="text-yellow-700">React, Vue, Angular, JavaScript, TypeScript, CSS, HTML</p>
                  </div>
                  <div>
                    <strong className="text-yellow-800">Backend:</strong>
                    <p className="text-yellow-700">Node.js, Python, Java, PHP, .NET, Ruby, Go</p>
                  </div>
                  <div>
                    <strong className="text-yellow-800">Other:</strong>
                    <p className="text-yellow-700">AWS, Docker, Git, SQL, MongoDB, Kubernetes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobPreferencesPage;