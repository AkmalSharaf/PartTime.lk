// src/pages/dashboard/SeekerDashboard.jsx - FIXED with proper saved jobs functionality
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const SeekerDashboard = () => {
  const [user, setUser] = useState(null);
  const [applications, setApplications] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [personalizedRecommendations, setPersonalizedRecommendations] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState({
    jobTypes: [],
    locations: [],
    salaryRange: { min: '', max: '' },
    remoteWork: false,
    industries: []
  });
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if there's a tab parameter in the URL
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }

    // Check if there's a success message in the location state
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the message from location state after 5 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    }

    // Check if user is logged in
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!storedUser || !token) {
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    
    // If user is not a job seeker, redirect to appropriate dashboard
    if (parsedUser.role !== 'jobseeker') {
      navigate('/dashboard/employer');
      return;
    }
    
    // Fetch job seeker data
    fetchSeekerData(token);
  }, [navigate, location]);

  const fetchSeekerData = async (token) => {
    setLoading(true);
    setError(''); // Clear any previous errors
    
    try {
      // Configure axios headers with token
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      console.log('🔄 Fetching seeker data...');
      
      // Fetch seeker profile
      const profileResponse = await axios.get('http://localhost:5000/api/users/profile', config);
      console.log('✅ Profile fetched successfully');
      setUser(profileResponse.data.data);
      
      // Set user preferences from profile
      const userPref = profileResponse.data.data.preferences || {};
      setPreferences({
        jobTypes: userPref.jobTypes || [],
        locations: userPref.locations || [],
        salaryRange: userPref.salaryRange || { min: '', max: '' },
        remoteWork: userPref.remoteWork || false,
        industries: userPref.industries || []
      });
      
      // Fetch applications
      try {
        console.log('🔄 Fetching applications...');
        const applicationsResponse = await axios.get('http://localhost:5000/api/applications/me', config);
        console.log('✅ Applications fetched:', applicationsResponse.data.data?.length || 0);
        setApplications(applicationsResponse.data.data || []);
      } catch (appErr) {
        console.error('❌ Error fetching applications:', appErr);
        setApplications([]);
      }
      
      // FIXED: Fetch saved jobs using the correct endpoint
      try {
        console.log('🔄 Fetching saved jobs...');
        const savedJobsResponse = await axios.get('http://localhost:5000/api/jobs/saved', config);
        console.log('✅ Saved jobs response:', savedJobsResponse.data);
        
        if (savedJobsResponse.data.success) {
          const savedJobsData = savedJobsResponse.data.data || [];
          console.log('✅ Saved jobs fetched:', savedJobsData.length);
          setSavedJobs(savedJobsData);
        } else {
          console.warn('⚠️ Saved jobs request not successful:', savedJobsResponse.data.message);
          setSavedJobs([]);
        }
      } catch (savedErr) {
        console.error('❌ Error fetching saved jobs:', savedErr);
        if (savedErr.response?.status === 403) {
          console.log('User role restriction for saved jobs');
        }
        setSavedJobs([]);
      }
      
      // Fetch personalized recommendations (AI-powered)
      try {
        console.log('🔄 Fetching AI recommendations...');
        const recommendationsResponse = await axios.get('http://localhost:5000/api/jobs/ai/recommendations', config);
        if (recommendationsResponse.data.success) {
          console.log('✅ AI recommendations fetched:', recommendationsResponse.data.count || 0);
          setPersonalizedRecommendations(recommendationsResponse.data.data || []);
          setUserProfile(recommendationsResponse.data.userProfile);
        }
      } catch (recErr) {
        console.error('❌ Error fetching AI recommendations:', recErr);
        setPersonalizedRecommendations([]);
        
        // Try fallback general recommendations
        try {
          console.log('🔄 Fetching fallback recommendations...');
          const skillsQuery = profileResponse.data.data.skills?.join(',') || '';
          const fallbackResponse = await axios.get('http://localhost:5000/api/jobs', {
            params: { 
              limit: 5,
              skills: skillsQuery
            },
            ...config
          });
          setRecommendedJobs(fallbackResponse.data.data || []);
        } catch (fallbackErr) {
          console.error('❌ Error fetching fallback recommendations:', fallbackErr);
          setRecommendedJobs([]);
        }
      }
      
    } catch (err) {
      console.error('❌ Error fetching seeker data:', err);
      setError('Failed to load dashboard data. Please try again.');
      
      // If token is invalid or expired, redirect to login
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Save job functionality with proper error handling
  const handleSaveJob = async (jobId) => {
    try {
      console.log('💾 Saving job:', jobId);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to save jobs');
        return;
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      // Save the job using the correct endpoint
      const response = await axios.post(`http://localhost:5000/api/jobs/saved/${jobId}`, {}, config);
      console.log('✅ Save job response:', response.data);
      
      if (response.data.success) {
        setSuccessMessage('Job saved successfully!');
        
        // Refresh saved jobs list to get the updated data
        const savedJobsResponse = await axios.get('http://localhost:5000/api/jobs/saved', config);
        if (savedJobsResponse.data.success) {
          setSavedJobs(savedJobsResponse.data.data || []);
          console.log('✅ Saved jobs list refreshed');
        }
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('❌ Error saving job:', err);
      if (err.response?.status === 400 && err.response?.data?.message?.includes('already saved')) {
        setError('Job is already saved');
      } else if (err.response?.status === 401) {
        setError('Please log in to save jobs');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      } else if (err.response?.status === 404) {
        setError('Job not found or no longer available');
      } else {
        setError('Failed to save job. Please try again.');
      }
      
      // Clear error message after 5 seconds
      setTimeout(() => setError(''), 5000);
    }
  };

  // FIXED: Remove from saved jobs with proper error handling
  const handleRemoveFromSaved = async (jobId) => {
    try {
      console.log('🗑️ Removing job from saved:', jobId);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to manage saved jobs');
        return;
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      const response = await axios.delete(`http://localhost:5000/api/jobs/saved/${jobId}`, config);
      console.log('✅ Remove from saved response:', response.data);
      
      if (response.data.success) {
        // Remove from local state immediately for better UX
        setSavedJobs(prevSavedJobs => prevSavedJobs.filter(job => job._id !== jobId));
        setSuccessMessage('Job removed from saved list');
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('❌ Error removing job from saved list:', err);
      if (err.response?.status === 401) {
        setError('Please log in to manage saved jobs');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      } else if (err.response?.status === 404) {
        setError('Job not found in saved list');
      } else {
        setError('Failed to remove job from saved list. Please try again.');
      }
      
      // Clear error message after 5 seconds
      setTimeout(() => setError(''), 5000);
    }
  };

  // FIXED: Check if job is saved (for UI state)
  const isJobSaved = (jobId) => {
    return savedJobs.some(job => job._id === jobId);
  };

  // Update user preferences for better recommendations
  const updatePreferences = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      await axios.put('http://localhost:5000/api/users/preferences', {
        jobTypes: preferences.jobTypes,
        preferredLocations: preferences.locations,
        salaryRange: preferences.salaryRange,
        remoteWork: preferences.remoteWork,
        industries: preferences.industries
      }, config);

      setShowPreferences(false);
      setSuccessMessage('Preferences updated successfully!');
      
      // Refresh recommendations
      try {
        const recommendationsResponse = await axios.get('http://localhost:5000/api/jobs/ai/recommendations', config);
        if (recommendationsResponse.data.success) {
          setPersonalizedRecommendations(recommendationsResponse.data.data || []);
        }
      } catch (recErr) {
        console.warn('Could not refresh recommendations after preference update');
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (err) {
      console.error('Error updating preferences:', err);
      setError('Failed to update preferences');
      setTimeout(() => setError(''), 5000);
    }
  };

  // Calculate profile completion percentage
  const calculateProfileCompletion = () => {
    if (!user) return 0;
    
    const fields = [
      !!user.name,
      !!user.email,
      !!user.phone,
      !!user.bio,
      !!user.location,
      user.skills && user.skills.length > 0,
      user.experience && user.experience.length > 0,
      user.education && user.education.length > 0,
      !!user.resume
    ];
    
    const completedFields = fields.filter(Boolean).length;
    return Math.round((completedFields / fields.length) * 100);
  };

  // Format salary helper
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

  // Get days ago helper
  const getDaysAgo = (date) => {
    const now = new Date();
    const jobDate = new Date(date);
    const diffTime = Math.abs(now - jobDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const profileCompletion = calculateProfileCompletion();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <i className="fas fa-check-circle text-green-500"></i>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
              <div className="ml-auto pl-3">
                <button 
                  onClick={() => setSuccessMessage('')}
                  className="text-green-500 hover:text-green-700"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <i className="fas fa-exclamation-circle text-red-500"></i>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <button 
                  onClick={() => setError('')}
                  className="text-red-500 hover:text-red-700"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <i className="fas fa-home mr-2"></i> Overview
            </button>
            <button
              onClick={() => setActiveTab('recommendations')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'recommendations'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <i className="fas fa-star mr-2"></i> AI Recommendations
              {personalizedRecommendations.length > 0 && (
                <span className="ml-1 bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
                  {personalizedRecommendations.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'applications'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <i className="fas fa-file-alt mr-2"></i> Applications
              {applications.length > 0 && (
                <span className="ml-1 bg-green-500 text-white text-xs rounded-full px-2 py-0.5">
                  {applications.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'saved'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <i className="fas fa-bookmark mr-2"></i> Saved Jobs
              {savedJobs.length > 0 && (
                <span className="ml-1 bg-purple-500 text-white text-xs rounded-full px-2 py-0.5">
                  {savedJobs.length}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="p-6">
              {/* Welcome Section */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg text-white p-6 mb-8">
                <h1 className="text-2xl font-bold mb-2">
                  Welcome back, {user?.name}!
                </h1>
                <p className="text-blue-100 mb-4">
                  Here's what's happening with your job search today.
                </p>
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() => setActiveTab('recommendations')}
                    className="bg-white text-blue-600 px-4 py-2 rounded-md font-medium hover:bg-blue-50 transition-colors"
                  >
                    <i className="fas fa-star mr-2"></i>
                    View AI Recommendations
                  </button>
                  <Link
                    to="/jobs"
                    className="border border-white text-white px-4 py-2 rounded-md font-medium hover:bg-white hover:text-blue-600 transition-colors"
                  >
                    Browse All Jobs
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Stats Cards */}
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Applications</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{applications.length}</p>
                    </div>
                    <div className="bg-blue-100 rounded-full p-3">
                      <i className="fas fa-file-alt text-blue-600"></i>
                    </div>
                  </div>
                  <button onClick={() => setActiveTab('applications')} className="text-sm text-blue-600 mt-4 inline-block hover:text-blue-800">
                    View all applications →
                  </button>
                </div>

                <div className="bg-green-50 border border-green-100 rounded-lg p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-green-600">Saved Jobs</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{savedJobs.length}</p>
                    </div>
                    <div className="bg-green-100 rounded-full p-3">
                      <i className="fas fa-bookmark text-green-600"></i>
                    </div>
                  </div>
                  <button onClick={() => setActiveTab('saved')} className="text-sm text-green-600 mt-4 inline-block hover:text-green-800">
                    View saved jobs →
                  </button>
                </div>

                <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-yellow-600">AI Recommendations</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{personalizedRecommendations.length}</p>
                    </div>
                    <div className="bg-yellow-100 rounded-full p-3">
                      <i className="fas fa-star text-yellow-600"></i>
                    </div>
                  </div>
                  <button onClick={() => setActiveTab('recommendations')} className="text-sm text-yellow-600 mt-4 inline-block hover:text-yellow-800">
                    View recommendations →
                  </button>
                </div>

                <div className="bg-purple-50 border border-purple-100 rounded-lg p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-purple-600">Profile Completion</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{profileCompletion}%</p>
                    </div>
                    <div className="bg-purple-100 rounded-full p-3">
                      <i className="fas fa-user-check text-purple-600"></i>
                    </div>
                  </div>
                  <Link to="/profile/seeker" className="text-sm text-purple-600 mt-4 inline-block hover:text-purple-800">
                    Complete profile →
                  </Link>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-8 bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setActiveTab('recommendations')}
                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-white transition-colors"
                  >
                    <i className="fas fa-magic text-blue-600 mr-3"></i>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">AI Job Matching</p>
                      <p className="text-sm text-gray-600">Get personalized recommendations</p>
                    </div>
                  </button>

                  <Link
                    to="/profile/seeker"
                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-white transition-colors"
                  >
                    <i className="fas fa-user-edit text-green-600 mr-3"></i>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Update Profile</p>
                      <p className="text-sm text-gray-600">Improve job matching accuracy</p>
                    </div>
                  </Link>

                  <Link
                    to="/jobs"
                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-white transition-colors"
                  >
                    <i className="fas fa-search text-purple-600 mr-3"></i>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Search Jobs</p>
                      <p className="text-sm text-gray-600">Find new opportunities</p>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Recent Activity Preview */}
              {personalizedRecommendations.length > 0 && (
                <div className="mt-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      <i className="fas fa-star text-yellow-500 mr-2"></i>
                      Top AI Recommendations
                    </h3>
                    <button
                      onClick={() => setActiveTab('recommendations')}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View All →
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {personalizedRecommendations.slice(0, 3).map((job, index) => (
                      <div key={job._id || index} className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 p-4 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-gray-900">{job.title}</h4>
                              {job.recommendationScore && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <i className="fas fa-star mr-1"></i>
                                  {job.recommendationScore}% Match
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{job.company}</p>
                            <div className="flex items-center text-sm text-gray-500 space-x-4">
                              <span className="flex items-center">
                                <i className="fas fa-map-marker-alt mr-1"></i>
                                {job.location}
                              </span>
                              <span className="flex items-center">
                                <i className="fas fa-briefcase mr-1"></i>
                                {job.jobType}
                              </span>
                              <span className="flex items-center">
                                <i className="fas fa-dollar-sign mr-1"></i>
                                {formatSalary(job)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4 flex space-x-2">
                            <button
                              onClick={() => handleSaveJob(job._id)}
                              disabled={isJobSaved(job._id)}
                              className={`text-sm px-2 py-1 rounded ${
                                isJobSaved(job._id) 
                                  ? 'text-blue-600 bg-blue-100' 
                                  : 'text-gray-400 hover:text-blue-500'
                              }`}
                            >
                              <i className={`fas fa-bookmark ${isJobSaved(job._id) ? 'text-blue-600' : ''}`}></i>
                            </button>
                            <Link
                              to={`/jobs/${job._id}`}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                            >
                              View Job
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AI Recommendations Tab */}
          {activeTab === 'recommendations' && (
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    <i className="fas fa-star text-yellow-500 mr-2"></i>
                    AI-Powered Job Recommendations
                  </h3>
                  <p className="text-gray-600">
                    Personalized job suggestions based on your profile and preferences
                  </p>
                  {userProfile && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {userProfile.skills?.slice(0, 5).map((skill, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                          {skill}
                        </span>
                      ))}
                      {userProfile.location && (
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                          📍 {userProfile.location}
                        </span>
                      )}
                      {userProfile.experienceLevel && (
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                          {userProfile.experienceLevel}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShowPreferences(!showPreferences)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <i className="fas fa-cog mr-2"></i>
                  Preferences
                </button>
              </div>

              {/* Preferences Panel */}
              {showPreferences && (
                <div className="bg-gray-50 rounded-lg p-6 mb-8">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Update Your Preferences</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Job Types */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Preferred Job Types
                      </label>
                      <div className="space-y-2">
                        {['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote'].map((type) => (
                          <label key={type} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={preferences.jobTypes.includes(type)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setPreferences({
                                    ...preferences,
                                    jobTypes: [...preferences.jobTypes, type]
                                  });
                                } else {
                                  setPreferences({
                                    ...preferences,
                                    jobTypes: preferences.jobTypes.filter(t => t !== type)
                                  });
                                }
                              }}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">{type}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Salary Range */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Salary Range (USD)
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="number"
                          placeholder="Min salary"
                          value={preferences.salaryRange.min}
                          onChange={(e) => setPreferences({
                            ...preferences,
                            salaryRange: { ...preferences.salaryRange, min: e.target.value }
                          })}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                        <input
                          type="number"
                          placeholder="Max salary"
                          value={preferences.salaryRange.max}
                          onChange={(e) => setPreferences({
                            ...preferences,
                            salaryRange: { ...preferences.salaryRange, max: e.target.value }
                          })}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Remote Work */}
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={preferences.remoteWork}
                          onChange={(e) => setPreferences({
                            ...preferences,
                            remoteWork: e.target.checked
                          })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Open to remote work</span>
                      </label>
                    </div>

                    {/* Locations */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Preferred Locations (comma separated)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., New York, San Francisco, Remote"
                        value={preferences.locations.join(', ')}
                        onChange={(e) => setPreferences({
                          ...preferences,
                          locations: e.target.value.split(',').map(loc => loc.trim()).filter(loc => loc)
                        })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-4">
                    <button
                      onClick={() => setShowPreferences(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={updatePreferences}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Save Preferences
                    </button>
                  </div>
                </div>
              )}

              {/* Recommendations List */}
              {personalizedRecommendations.length > 0 ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h4 className="text-lg font-medium text-gray-900">
                      {personalizedRecommendations.length} Personalized Recommendations
                    </h4>
                    <button
                      onClick={() => fetchSeekerData(localStorage.getItem('token'))}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      <i className="fas fa-sync-alt mr-2"></i>
                      Refresh
                    </button>
                  </div>

                  {personalizedRecommendations.map((job, index) => (
                    <div key={job._id || index} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          {/* Job Header */}
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h5 className="text-xl font-semibold text-gray-900 mb-1">
                                {job.title}
                              </h5>
                              <p className="text-lg text-blue-600 font-medium mb-2">
                                {job.employer?.companyName || job.company}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              {job.recommendationScore && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                  <i className="fas fa-star mr-1"></i>
                                  {job.recommendationScore}% Match
                                </span>
                              )}
                              <button
                                onClick={() => handleSaveJob(job._id)}
                                disabled={isJobSaved(job._id)}
                                className={`p-2 rounded-full transition-colors ${
                                  isJobSaved(job._id) 
                                    ? 'text-blue-600 bg-blue-100' 
                                    : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50'
                                }`}
                                title={isJobSaved(job._id) ? 'Job already saved' : 'Save this job'}
                              >
                                <i className={`fas fa-bookmark ${isJobSaved(job._id) ? 'text-blue-600' : ''}`}></i>
                              </button>
                            </div>
                          </div>

                          {/* Job Details */}
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                            <span className="flex items-center">
                              <i className="fas fa-map-marker-alt mr-1"></i>
                              {job.location}
                            </span>
                            <span className="flex items-center">
                              <i className="fas fa-briefcase mr-1"></i>
                              {job.jobType}
                            </span>
                            <span className="flex items-center">
                              <i className="fas fa-chart-line mr-1"></i>
                              {job.experience}
                            </span>
                            <span className="flex items-center">
                              <i className="fas fa-dollar-sign mr-1"></i>
                              {formatSalary(job)}
                            </span>
                            <span className="flex items-center">
                              <i className="fas fa-clock mr-1"></i>
                              {getDaysAgo(job.createdAt)}
                            </span>
                          </div>

                          {/* Job Description */}
                          <p className="text-gray-700 mb-4 line-clamp-3">
                            {job.description}
                          </p>

                          {/* Skills */}
                          {job.skills && job.skills.length > 0 && (
                            <div className="mb-4">
                              <h6 className="text-sm font-medium text-gray-900 mb-2">Required Skills:</h6>
                              <div className="flex flex-wrap gap-2">
                                {job.skills.slice(0, 6).map((skill, skillIndex) => (
                                  <span
                                    key={skillIndex}
                                    className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-md"
                                  >
                                    {skill}
                                  </span>
                                ))}
                                {job.skills.length > 6 && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                                    +{job.skills.length - 6} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex items-center space-x-3">
                            <Link
                              to={`/jobs/${job._id}`}
                              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            >
                              View Details
                            </Link>
                            <Link
                              to={`/jobs/${job._id}/apply`}
                              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                            >
                              <i className="fas fa-paper-plane mr-1"></i>
                              Apply Now
                            </Link>
                          </div>
                        </div>
                      </div>

                      {/* Why recommended section */}
                      {job.recommendationScore > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200 bg-gray-50 -mx-6 -mb-6 px-6 py-3 rounded-b-lg">
                          <details className="group">
                            <summary className="flex items-center justify-between cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                              <span className="flex items-center">
                                <i className="fas fa-lightbulb mr-2 text-yellow-500"></i>
                                Why this job is recommended for you
                              </span>
                              <i className="fas fa-chevron-down group-open:rotate-180 transition-transform"></i>
                            </summary>
                            <div className="mt-2 text-sm text-gray-600">
                              <ul className="space-y-1">
                                {userProfile?.skills?.some(skill => 
                                  job.skills?.some(jobSkill => 
                                    jobSkill.toLowerCase().includes(skill.toLowerCase())
                                  )
                                ) && (
                                  <li className="flex items-center">
                                    <i className="fas fa-check text-green-500 mr-2"></i>
                                    Your skills match the job requirements
                                  </li>
                                )}
                                {userProfile?.location && job.location.toLowerCase().includes(userProfile.location.toLowerCase()) && (
                                  <li className="flex items-center">
                                    <i className="fas fa-check text-green-500 mr-2"></i>
                                    Location matches your preference
                                  </li>
                                )}
                                {userProfile?.experienceLevel === job.experience && (
                                  <li className="flex items-center">
                                    <i className="fas fa-check text-green-500 mr-2"></i>
                                    Experience level matches your background
                                  </li>
                                )}
                                <li className="flex items-center">
                                  <i className="fas fa-check text-green-500 mr-2"></i>
                                  High relevance score based on your profile
                                </li>
                              </ul>
                            </div>
                          </details>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <div className="flex justify-center mb-4">
                    <div className="bg-gray-200 rounded-full p-4">
                      <i className="fas fa-robot text-gray-400 text-3xl"></i>
                    </div>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No AI Recommendations Yet</h4>
                  <p className="text-gray-500 mb-6">Complete your profile with skills and experience to get personalized job recommendations.</p>
                  <Link
                    to="/profile/seeker"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Complete Profile
                  </Link>
                </div>
              )}

              {/* Tips Section */}
              <div className="mt-8 bg-blue-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-blue-900 mb-3">
                  <i className="fas fa-lightbulb mr-2"></i>
                  Tips to Get Better Recommendations
                </h4>
                <ul className="space-y-2 text-blue-800">
                  <li className="flex items-start">
                    <i className="fas fa-check-circle mt-1 mr-2 text-blue-600"></i>
                    <span>Keep your skills list updated with relevant technologies</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-check-circle mt-1 mr-2 text-blue-600"></i>
                    <span>Add detailed work experience to improve matching accuracy</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-check-circle mt-1 mr-2 text-blue-600"></i>
                    <span>Update your preferences regularly based on your career goals</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-check-circle mt-1 mr-2 text-blue-600"></i>
                    <span>Save and apply to jobs that interest you to improve our recommendations</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Applications Tab */}
          {activeTab === 'applications' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">Your Applications</h3>
                <Link
                  to="/jobs"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <i className="fas fa-search mr-2"></i> Browse Jobs
                </Link>
              </div>

              {applications.length > 0 ? (
                <div className="bg-white shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Job
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Company
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Applied Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {applications.map((application) => (
                        <tr key={application._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{application.job?.title || 'Unknown Position'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{application.job?.company || 'Unknown Company'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(application.appliedAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              application.status === 'accepted' ? 'bg-green-100 text-green-800' : 
                              application.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                              application.status === 'shortlisted' ? 'bg-blue-100 text-blue-800' :
                              application.status === 'reviewing' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {application.status.charAt(0).toUpperCase() + application.status.slice(1).replace('-', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Link 
                              to={`/applications/${application._id}`} 
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              View Details
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <div className="flex justify-center mb-4">
                    <div className="bg-gray-200 rounded-full p-4">
                      <i className="fas fa-file-alt text-gray-400 text-3xl"></i>
                    </div>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Yet</h3>
                  <p className="text-gray-500 mb-6">You haven't applied to any jobs yet. Start exploring available positions.</p>
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={() => setActiveTab('recommendations')}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <i className="fas fa-star mr-2"></i> View Recommendations
                    </button>
                    <Link
                      to="/jobs"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <i className="fas fa-search mr-2"></i> Browse All Jobs
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* FIXED: Saved Jobs Tab */}
          {activeTab === 'saved' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">Saved Jobs</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => fetchSeekerData(localStorage.getItem('token'))}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <i className="fas fa-sync-alt mr-2"></i> Refresh
                  </button>
                  <Link
                    to="/jobs"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <i className="fas fa-search mr-2"></i> Browse Jobs
                  </Link>
                </div>
              </div>

              {savedJobs.length > 0 ? (
                <div className="space-y-6">
                  <div className="text-sm text-gray-600 mb-4">
                    You have {savedJobs.length} saved job{savedJobs.length !== 1 ? 's' : ''}
                  </div>
                  
                  {savedJobs.map((job) => (
                    <div key={job._id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start flex-1">
                          <div className="bg-gray-100 rounded-md h-12 w-12 flex items-center justify-center mr-4 flex-shrink-0">
                            {job.employer?.companyLogo ? (
                              <img
                                src={`http://localhost:5000${job.employer.companyLogo}`}
                                alt={job.company}
                                className="h-8 w-8 rounded object-contain"
                              />
                            ) : (
                              <span className="text-gray-600 font-bold text-lg">
                                {(job.employer?.companyName || job.company)?.charAt(0) || 'C'}
                              </span>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="text-lg font-medium text-gray-900 mb-1">{job.title}</h4>
                                <p className="text-gray-600 font-medium">{job.employer?.companyName || job.company}</p>
                              </div>
                              {job.savedAt && (
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                  Saved {getDaysAgo(job.savedAt)}
                                </span>
                              )}
                            </div>
                            
                            {/* Job Details */}
                            <div className="flex flex-wrap gap-2 mt-2 mb-3">
                              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                <i className="fas fa-briefcase mr-1"></i>
                                {job.jobType}
                              </span>
                              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                <i className="fas fa-chart-line mr-1"></i>
                                {job.experience}
                              </span>
                              {job.salary?.min && (
                                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                  <i className="fas fa-dollar-sign mr-1"></i>
                                  {formatSalary(job)}
                                </span>
                              )}
                            </div>

                            {/* Location and Posted Date */}
                            <div className="flex items-center text-sm text-gray-500 space-x-4 mb-4">
                              <span className="flex items-center">
                                <i className="fas fa-map-marker-alt mr-1"></i>
                                {job.location}
                              </span>
                              <span className="flex items-center">
                                <i className="fas fa-clock mr-1"></i>
                                Posted {getDaysAgo(job.createdAt)}
                              </span>
                            </div>

                            {/* Skills Preview */}
                            {job.skills && job.skills.length > 0 && (
                              <div className="mb-4">
                                <div className="flex flex-wrap gap-1">
                                  {job.skills.slice(0, 4).map((skill, index) => (
                                    <span key={index} className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded">
                                      {skill}
                                    </span>
                                  ))}
                                  {job.skills.length > 4 && (
                                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded">
                                      +{job.skills.length - 4} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Description Preview */}
                            {job.description && (
                              <p className="text-gray-700 text-sm line-clamp-2 mb-4">
                                {job.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col space-y-2 ml-4 flex-shrink-0">
                          <button 
                            onClick={() => handleRemoveFromSaved(job._id)} 
                            className="p-2 text-blue-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                            title="Remove from saved jobs"
                          >
                            <i className="fas fa-bookmark"></i>
                          </button>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-6 flex space-x-3">
                        <Link
                          to={`/jobs/${job._id}`}
                          className="flex-1 text-center bg-white border border-blue-600 text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                          View Details
                        </Link>
                        <Link
                          to={`/jobs/${job._id}/apply`}
                          className="flex-1 text-center bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                          Apply Now
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <div className="flex justify-center mb-4">
                    <div className="bg-gray-200 rounded-full p-4">
                      <i className="fas fa-bookmark text-gray-400 text-3xl"></i>
                    </div>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Saved Jobs</h3>
                  <p className="text-gray-500 mb-6">You haven't saved any jobs yet. Save jobs to apply to them later.</p>
                  <div className="flex justify-center space-x-4">
                 
                    <button
                      onClick={() => setActiveTab('recommendations')}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <i className="fas fa-star mr-2"></i> View Recommendations
                    </button>
                    <Link
                      to="/jobs"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <i className="fas fa-search mr-2"></i> Browse All Jobs
                    </Link>
                  </div>
                </div>
              )}

              {/* Tips for saving jobs */}
              <div className="mt-8 bg-purple-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-purple-900 mb-3">
                  <i className="fas fa-lightbulb mr-2"></i>
                  Saved Jobs Tips
                </h4>
                <ul className="space-y-2 text-purple-800">
                  <li className="flex items-start">
                    <i className="fas fa-check-circle mt-1 mr-2 text-purple-600"></i>
                    <span>Save jobs you're interested in to apply later</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-check-circle mt-1 mr-2 text-purple-600"></i>
                    <span>Set reminders to apply before deadlines</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-check-circle mt-1 mr-2 text-purple-600"></i>
                    <span>Organize saved jobs by priority or industry</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-check-circle mt-1 mr-2 text-purple-600"></i>
                    <span>Check saved jobs regularly as positions may close</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Profile Completion Call-to-Action */}
        {profileCompletion < 80 && (
          <div className="mt-8 bg-gradient-to-r from-orange-400 to-pink-500 rounded-lg shadow-lg text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold mb-2">
                  <i className="fas fa-chart-line mr-2"></i>
                  Complete Your Profile
                </h3>
                <p className="text-orange-100 mb-2">
                  Your profile is {profileCompletion}% complete. Complete it to get better job recommendations!
                </p>
                <div className="w-full bg-orange-200 rounded-full h-2 mb-4">
                  <div 
                    className="bg-white h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${profileCompletion}%` }}
                  ></div>
                </div>
              </div>
              <div className="ml-6">
                <Link
                  to="/profile/seeker"
                  className="bg-white text-orange-600 px-6 py-3 rounded-md font-medium hover:bg-orange-50 transition-colors"
                >
                  Complete Now
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity Summary */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent Applications */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                <i className="fas fa-clock mr-2 text-blue-600"></i>
                Recent Applications
              </h3>
              <button
                onClick={() => setActiveTab('applications')}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View All →
              </button>
            </div>
            
            {applications.length > 0 ? (
              <div className="space-y-3">
                {applications.slice(0, 3).map((application, index) => (
                  <div key={application._id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {application.job?.title}
                      </p>
                      <p className="text-gray-600 text-xs">
                        {application.job?.company} • {getDaysAgo(application.appliedAt)}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      application.status === 'accepted' ? 'bg-green-100 text-green-800' : 
                      application.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                      application.status === 'shortlisted' ? 'bg-blue-100 text-blue-800' :
                      application.status === 'reviewing' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <i className="fas fa-file-alt text-gray-300 text-2xl mb-2"></i>
                <p className="text-gray-500 text-sm">No recent applications</p>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              <i className="fas fa-chart-bar mr-2 text-green-600"></i>
              Quick Stats
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-blue-100 rounded-full p-2 mr-3">
                    <i className="fas fa-eye text-blue-600 text-sm"></i>
                  </div>
                  <span className="text-gray-700 text-sm">Profile Views</span>
                </div>
                <span className="font-semibold text-gray-900">{user?.profileViews || 0}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-green-100 rounded-full p-2 mr-3">
                    <i className="fas fa-thumbs-up text-green-600 text-sm"></i>
                  </div>
                  <span className="text-gray-700 text-sm">Application Rate</span>
                </div>
                <span className="font-semibold text-gray-900">
                  {savedJobs.length > 0 ? Math.round((applications.length / savedJobs.length) * 100) : 0}%
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-purple-100 rounded-full p-2 mr-3">
                    <i className="fas fa-calendar text-purple-600 text-sm"></i>
                  </div>
                  <span className="text-gray-700 text-sm">Member Since</span>
                </div>
                <span className="font-semibold text-gray-900">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { 
                    month: 'short', 
                    year: 'numeric' 
                  }) : 'N/A'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-yellow-100 rounded-full p-2 mr-3">
                    <i className="fas fa-star text-yellow-600 text-sm"></i>
                  </div>
                  <span className="text-gray-700 text-sm">Skills Listed</span>
                </div>
                <span className="font-semibold text-gray-900">{user?.skills?.length || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Job Search Tips */}
        <div className="mt-8 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-6 border border-indigo-100">
          <h3 className="text-lg font-semibold text-indigo-900 mb-4">
            <i className="fas fa-graduation-cap mr-2"></i>
            Job Search Tips
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-indigo-800 mb-2">Profile Optimization</h4>
              <ul className="space-y-1 text-sm text-indigo-700">
                <li className="flex items-start">
                  <i className="fas fa-arrow-right mt-1 mr-2 text-indigo-500 text-xs"></i>
                  Keep your skills updated with market trends
                </li>
                <li className="flex items-start">
                  <i className="fas fa-arrow-right mt-1 mr-2 text-indigo-500 text-xs"></i>
                  Add quantifiable achievements to your experience
                </li>
                <li className="flex items-start">
                  <i className="fas fa-arrow-right mt-1 mr-2 text-indigo-500 text-xs"></i>
                  Upload a professional profile photo
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-indigo-800 mb-2">Application Strategy</h4>
              <ul className="space-y-1 text-sm text-indigo-700">
                <li className="flex items-start">
                  <i className="fas fa-arrow-right mt-1 mr-2 text-indigo-500 text-xs"></i>
                  Apply within 24-48 hours of job posting
                </li>
                <li className="flex items-start">
                  <i className="fas fa-arrow-right mt-1 mr-2 text-indigo-500 text-xs"></i>
                  Customize your cover letter for each position
                </li>
                <li className="flex items-start">
                  <i className="fas fa-arrow-right mt-1 mr-2 text-indigo-500 text-xs"></i>
                  Follow up professionally after applying
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/profile/seeker"
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <i className="fas fa-user-edit mr-2"></i>
            Edit Profile
          </Link>
          <Link
            to="/jobs"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <i className="fas fa-search mr-2"></i>
            Browse All Jobs
          </Link>
          <button
            onClick={() => fetchSeekerData(localStorage.getItem('token'))}
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <i className="fas fa-sync-alt mr-2"></i>
            Refresh Data
          </button>
        </div>
      </main>
    </div>
  );
};

export default SeekerDashboard;