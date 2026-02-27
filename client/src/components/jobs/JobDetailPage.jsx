// src/components/jobs/JobDetailPage.jsx - Complete Updated Implementation
import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const JobDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // State management
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [similarJobs, setSimilarJobs] = useState([]);
  const [hasApplied, setHasApplied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [jobStats, setJobStats] = useState({
    views: 0,
    applications: 0,
    saves: 0
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        console.log('👤 User loaded:', parsedUser.email, 'Role:', parsedUser.role);
      } catch (error) {
        console.error('Error parsing stored user:', error);
      }
    }

    // Load job details and related data
    loadJobData();
  }, [id]);

  const loadJobData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch job details
      await fetchJobDetails();
      
      // For job seekers, check saved status and application status
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (token && storedUser) {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.role === 'jobseeker') {
          await Promise.all([
            checkIfJobIsSaved(),
            checkIfAlreadyApplied(),
            fetchSimilarJobs()
          ]);
        }
      }
    } catch (error) {
      console.error('Error loading job data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobDetails = async () => {
    try {
      console.log('🔄 Fetching job details for ID:', id);
      
      const config = {};
      const token = localStorage.getItem('token');
      if (token) {
        config.headers = { Authorization: `Bearer ${token}` };
      }

      const response = await axios.get(`http://localhost:5000/api/jobs/${id}`, config);
      
      if (response.data.success) {
        const jobData = response.data.data;
        setJob(jobData);
        setJobStats({
          views: jobData.viewCount || 0,
          applications: jobData.applicationCount || 0,
          saves: jobData.saveCount || 0
        });
        console.log('✅ Job details fetched successfully:', jobData.title);
        
        // Track job view for analytics if user is logged in job seeker
        if (token && user?.role === 'jobseeker') {
          trackJobView();
        }
      } else {
        throw new Error(response.data.message || 'Failed to fetch job details');
      }
    } catch (err) {
      console.error('❌ Error fetching job details:', err);
      
      if (err.response?.status === 404) {
        setError('Job not found or has been removed');
      } else if (err.response?.status === 401) {
        setError('Please log in to view this job');
      } else {
        setError(err.response?.data?.message || 'Error fetching job details. Please try again.');
      }
      throw err;
    }
  };

  const checkIfJobIsSaved = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      console.log('🔍 Checking if job is saved...');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const response = await axios.get(`http://localhost:5000/api/jobs/saved/${id}/check`, config);
      
      if (response.data.success) {
        const savedStatus = response.data.data.isSaved;
        setIsSaved(savedStatus);
        console.log(`✅ Job save status checked: ${savedStatus ? 'Saved' : 'Not saved'}`);
      }
    } catch (err) {
      console.error('❌ Error checking saved status:', err);
      // Don't show error to user for this non-critical operation
    }
  };

  const checkIfAlreadyApplied = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const response = await axios.get('http://localhost:5000/api/applications/me', config);
      
      if (response.data.success) {
        const applications = response.data.data || [];
        const applied = applications.some(app => app.job?._id === id);
        setHasApplied(applied);
        console.log(`✅ Application status checked: ${applied ? 'Applied' : 'Not applied'}`);
      }
    } catch (err) {
      console.error('Error checking application status:', err);
    }
  };

  const fetchSimilarJobs = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/jobs/${id}/similar?limit=4`);
      if (response.data.success) {
        setSimilarJobs(response.data.data || []);
        console.log('✅ Similar jobs fetched:', response.data.count);
      }
    } catch (err) {
      console.error('Error fetching similar jobs:', err);
      // Don't show error for this non-critical feature
    }
  };

  const trackJobView = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      await axios.post(`http://localhost:5000/api/jobs/ai/track/${id}`, {
        action: 'viewed',
        source: 'job_detail_page',
        timestamp: new Date()
      }, config);
      
      console.log('📊 Job view tracked for analytics');
    } catch (err) {
      console.error('Error tracking job view:', err);
    }
  };

  const handleSaveJob = async () => {
    if (!user) {
      navigate('/login', { 
        state: { 
          from: `/jobs/${id}`,
          message: 'Please log in to save jobs' 
        }
      });
      return;
    }

    if (user.role !== 'jobseeker') {
      setError('Only job seekers can save jobs');
      setTimeout(() => setError(''), 3000);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    setSaveLoading(true);
    setError('');

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      if (isSaved) {
        // Remove from saved jobs
        console.log('🗑️ Removing job from saved list...');
        const response = await axios.delete(`http://localhost:5000/api/jobs/saved/${id}`, config);
        
        if (response.data.success) {
          setIsSaved(false);
          setSuccessMessage('Job removed from saved list');
          setJobStats(prev => ({ ...prev, saves: Math.max(0, prev.saves - 1) }));
          console.log('✅ Job removed from saved list');
          
          // Track interaction
          try {
            await axios.post(`http://localhost:5000/api/jobs/ai/track/${id}`, {
              action: 'unsaved',
              source: 'job_detail_page'
            }, config);
          } catch (trackErr) {
            console.warn('Could not track unsave interaction');
          }
        }
      } else {
        // Add to saved jobs
        console.log('💾 Saving job...');
        const response = await axios.post(`http://localhost:5000/api/jobs/saved/${id}`, {
          notes: '',
          priority: 'medium'
        }, config);
        
        if (response.data.success) {
          setIsSaved(true);
          setSuccessMessage('Job saved successfully!');
          setJobStats(prev => ({ ...prev, saves: prev.saves + 1 }));
          console.log('✅ Job saved successfully');
          
          // Track interaction
          try {
            await axios.post(`http://localhost:5000/api/jobs/ai/track/${id}`, {
              action: 'saved',
              source: 'job_detail_page'
            }, config);
          } catch (trackErr) {
            console.warn('Could not track save interaction');
          }
        }
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (err) {
      console.error('❌ Error saving/unsaving job:', err);
      
      if (err.response?.status === 400 && err.response?.data?.message?.includes('already saved')) {
        setError('Job is already saved');
        setIsSaved(true); // Update state to match server state
      } else if (err.response?.status === 401) {
        setError('Please log in to save jobs');
        setTimeout(() => {
          navigate('/login', { state: { from: `/jobs/${id}` } });
        }, 2000);
      } else if (err.response?.status === 403) {
        setError('Only job seekers can save jobs');
      } else if (err.response?.status === 404) {
        setError('Job not found or no longer available');
      } else {
        setError('Failed to save job. Please try again.');
      }
      
      // Clear error message after 5 seconds
      setTimeout(() => setError(''), 5000);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `${job.title} at ${job.company}`,
      text: `Check out this job: ${job.title} at ${job.company}`,
      url: window.location.href
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(window.location.href);
        setSuccessMessage('Job link copied to clipboard!');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error sharing:', err);
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        setSuccessMessage('Job link copied to clipboard!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (clipboardErr) {
        setError('Could not share job');
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  // Helper functions
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatSalary = (salary) => {
    if (!salary || !salary.min) return 'Salary not specified';
    
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: salary.currency || 'USD',
      minimumFractionDigits: 0
    });
    
    const min = formatter.format(salary.min);
    const max = salary.max ? formatter.format(salary.max) : null;
    
    let salaryStr = max ? `${min} - ${max}` : `${min}+`;
    
    if (salary.period === 'hourly') salaryStr += '/hr';
    else if (salary.period === 'monthly') salaryStr += '/mo';
    else salaryStr += '/yr';
    
    if (salary.negotiable) salaryStr += ' (negotiable)';
    
    return salaryStr;
  };

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

  const getDeadlineStatus = () => {
    if (!job.applicationDeadline) return null;
    
    const now = new Date();
    const deadline = new Date(job.applicationDeadline);
    const diffDays = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { status: 'expired', message: 'Application deadline has passed', color: 'text-red-600' };
    if (diffDays === 0) return { status: 'today', message: 'Apply today!', color: 'text-orange-600' };
    if (diffDays <= 3) return { status: 'urgent', message: `${diffDays} days left to apply`, color: 'text-red-600' };
    if (diffDays <= 7) return { status: 'soon', message: `${diffDays} days left to apply`, color: 'text-orange-600' };
    return { status: 'open', message: `${diffDays} days left to apply`, color: 'text-green-600' };
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading job details...</p>
          <p className="mt-2 text-sm text-gray-500">This may take a moment</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !job) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow-md rounded-lg p-6 md:p-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <i className="fas fa-exclamation-triangle text-red-600 text-xl"></i>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Job</h1>
              <p className="text-gray-500 mb-6">{error}</p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <i className="fas fa-redo mr-2"></i>
                  Try Again
                </button>
                <Link 
                  to="/jobs" 
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <i className="fas fa-arrow-left mr-2"></i>
                  Back to Jobs
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Job not found state
  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow-md rounded-lg p-6 md:p-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
                <i className="fas fa-briefcase text-gray-400 text-xl"></i>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Job Not Found</h1>
              <p className="text-gray-500 mb-6">The job you're looking for doesn't exist or has been removed.</p>
              <Link 
                to="/jobs" 
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <i className="fas fa-search mr-2"></i>
                Browse All Jobs
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const deadlineStatus = getDeadlineStatus();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Alert Messages */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-md">
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

        {error && job && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
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

        {/* Breadcrumb Navigation */}
        <nav className="flex mb-6" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link to="/" className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600">
                <i className="fas fa-home mr-2"></i>
                Home
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <i className="fas fa-chevron-right text-gray-400 mx-2"></i>
                <Link to="/jobs" className="ml-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ml-2">
                  Jobs
                </Link>
              </div>
            </li>
            <li aria-current="page">
              <div className="flex items-center">
                <i className="fas fa-chevron-right text-gray-400 mx-2"></i>
                <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2 truncate max-w-xs">
                  {job.title}
                </span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Main Job Card */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Job Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between">
              <div className="flex-1">
                <div className="flex items-start mb-4">
                  {/* Company Logo */}
                  <div className="flex-shrink-0 mr-4">
                    <div className="bg-white rounded-lg p-2 h-16 w-16 flex items-center justify-center">
                      {job.employer?.companyLogo ? (
                        <img
                          src={`http://localhost:5000${job.employer.companyLogo}`}
                          alt={job.company}
                          className="h-12 w-12 object-contain rounded"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className={`${job.employer?.companyLogo ? 'hidden' : 'flex'} h-12 w-12 bg-gray-100 rounded items-center justify-center`}>
                        <span className="text-blue-600 font-bold text-xl">
                          {(job.employer?.companyName || job.company)?.charAt(0) || 'C'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <h1 className="text-2xl md:text-3xl font-bold mb-2">{job.title}</h1>
                    <p className="text-blue-100 text-lg mb-3">
                      {job.employer?.companyName || job.company}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-blue-100">
                      <span className="flex items-center">
                        <i className="fas fa-map-marker-alt mr-2"></i> 
                        {job.location}
                      </span>
                      <span className="flex items-center">
                        <i className="fas fa-briefcase mr-2"></i> 
                        {job.jobType}
                      </span>
                      <span className="flex items-center">
                        <i className="fas fa-user-graduate mr-2"></i> 
                        {job.experience}
                      </span>
                      <span className="flex items-center">
                        <i className="fas fa-clock mr-2"></i> 
                        Posted {getDaysAgo(job.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Salary, Deadline, and Badges */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center bg-blue-500 bg-opacity-75 px-4 py-2 rounded-lg">
                    <i className="fas fa-money-bill-wave mr-2"></i>
                    <span className="font-medium">{formatSalary(job.salary)}</span>
                  </div>
                  
                  {deadlineStatus && deadlineStatus.status !== 'expired' && (
                    <div className={`flex items-center px-4 py-2 rounded-lg ${
                      deadlineStatus.status === 'urgent' || deadlineStatus.status === 'today' 
                        ? 'bg-red-500 bg-opacity-75' 
                        : 'bg-orange-500 bg-opacity-75'
                    }`}>
                      <i className="fas fa-calendar-alt mr-2"></i>
                      <span>{deadlineStatus.message}</span>
                    </div>
                  )}

                  {job.urgent && (
                    <div className="flex items-center bg-red-500 px-4 py-2 rounded-lg">
                      <i className="fas fa-exclamation-circle mr-2"></i>
                      <span className="font-medium">Urgent Hiring</span>
                    </div>
                  )}

                  {job.featured && (
                    <div className="flex items-center bg-yellow-500 px-4 py-2 rounded-lg">
                      <i className="fas fa-star mr-2"></i>
                      <span className="font-medium">Featured</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col space-y-3 mt-6 md:mt-0 md:ml-6">
                {user && user.role === 'jobseeker' && (
                  <button
                    onClick={handleSaveJob}
                    disabled={saveLoading}
                    className={`flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors ${
                      isSaved 
                        ? 'bg-white text-blue-600 hover:bg-blue-50' 
                        : 'bg-blue-500 text-white hover:bg-blue-400'
                    } ${saveLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {saveLoading ? (
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                    ) : (
                      <i className={`fas fa-bookmark mr-2 ${isSaved ? 'text-blue-600' : 'text-white'}`}></i>
                    )}
                    {saveLoading ? 'Saving...' : (isSaved ? 'Saved' : 'Save Job')}
                  </button>
                )}
                
                <button
                  onClick={handleShare}
                  className="flex items-center justify-center px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-colors"
                >
                  <i className="fas fa-share mr-2"></i>
                  Share
                </button>

                {/* Job Stats */}
                <div className="text-center text-sm text-blue-100 space-y-1">
                  <div className="flex justify-between">
                    <span>{jobStats.views} views</span>
                    <span>{jobStats.applications} applied</span>
                  </div>
                  <div>{jobStats.saves} saved</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Job Content */}
          <div className="p-6 md:p-8">
            {/* Quick Apply Section */}
            <div className="mb-8 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="mb-4 md:mb-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {hasApplied ? (
                      <>
                        <i className="fas fa-check-circle text-green-600 mr-2"></i>
                        Application Submitted
                      </>
                    ) : (
                      <>
                        <i className="fas fa-rocket text-blue-600 mr-2"></i>
                        Ready to Apply?
                      </>
                    )}
                  </h3>
                  <p className="text-gray-600">
                    {hasApplied 
                      ? "Thank you for your application! We'll review it and get back to you soon."
                      : deadlineStatus?.status === 'expired'
                        ? "Unfortunately, the application deadline has passed."
                        : "Don't miss this opportunity - apply now!"
                    }
                  </p>
                </div>
                <div className="flex space-x-3">
                  {hasApplied ? (
                    <div className="flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg">
                      <i className="fas fa-check-circle mr-2"></i>
                      Applied
                    </div>
                  ) : deadlineStatus?.status === 'expired' ? (
                    <div className="flex items-center px-4 py-2 bg-gray-100 text-gray-600 rounded-lg">
                      <i className="fas fa-clock mr-2"></i>
                      Deadline Passed
                    </div>
                  ) : (
                    <Link
                      to={`/jobs/${job._id}/apply`}
                      className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                    >
                      <i className="fas fa-paper-plane mr-2"></i>
                      Apply Now
                    </Link>
                  )}
                </div>
              </div>
            </div>


            {/* Job Description Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Job Description */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    <i className="fas fa-file-alt text-blue-600 mr-2"></i>
                    Job Description
                  </h2>
                  <div className="prose max-w-none text-gray-700">
                    {job.description ? (
                      <div dangerouslySetInnerHTML={{ 
                        __html: job.description.replace(/\n/g, '<br/>') 
                      }} />
                    ) : (
                      <p>No description provided for this position.</p>
                    )}
                  </div>
                </div>

                {/* Requirements */}
                {job.requirements && job.requirements.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      <i className="fas fa-list-check text-blue-600 mr-2"></i>
                      Requirements
                    </h2>
                    <ul className="space-y-3">
                      {job.requirements.map((requirement, index) => (
                        <li key={index} className="flex items-start">
                          <i className="fas fa-check-circle text-green-500 mr-3 mt-1"></i>
                          <span className="text-gray-700">{requirement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Responsibilities */}
                {job.responsibilities && job.responsibilities.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      <i className="fas fa-tasks text-blue-600 mr-2"></i>
                      Key Responsibilities
                    </h2>
                    <ul className="space-y-3">
                      {job.responsibilities.map((responsibility, index) => (
                        <li key={index} className="flex items-start">
                          <i className="fas fa-arrow-right text-blue-500 mr-3 mt-1"></i>
                          <span className="text-gray-700">{responsibility}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Skills */}
                {job.skills && job.skills.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      <i className="fas fa-code text-blue-600 mr-2"></i>
                      Required Skills
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {job.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Benefits */}
                {job.benefits && job.benefits.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      <i className="fas fa-gift text-blue-600 mr-2"></i>
                      Benefits & Perks
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {job.benefits.map((benefit, index) => (
                        <div key={index} className="flex items-center p-3 bg-green-50 rounded-lg">
                          <i className="fas fa-star text-green-500 mr-3"></i>
                          <span className="text-gray-700">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Application Process */}
                {job.applicationProcess && (
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                      <i className="fas fa-route text-blue-600 mr-2"></i>
                      Application Process
                    </h2>
                    
                    {job.applicationProcess.steps && job.applicationProcess.steps.length > 0 && (
                      <div className="mb-4">
                        <h3 className="font-semibold text-gray-800 mb-3">Steps:</h3>
                        <div className="space-y-3">
                          {job.applicationProcess.steps.map((step, index) => (
                            <div key={index} className="flex items-start">
                              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                                {index + 1}
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">{step.step}</h4>
                                {step.description && (
                                  <p className="text-gray-600 text-sm mt-1">{step.description}</p>
                                )}
                                {step.estimatedTime && (
                                  <p className="text-blue-600 text-sm mt-1">
                                    <i className="fas fa-clock mr-1"></i>
                                    Est. time: {step.estimatedTime}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      {job.applicationProcess.contactEmail && (
                        <div className="flex items-center">
                          <i className="fas fa-envelope text-blue-500 mr-2"></i>
                          <span>Contact: {job.applicationProcess.contactEmail}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center">
                        <i className="fas fa-file-alt text-blue-500 mr-2"></i>
                        <span>Cover Letter: {job.applicationProcess.requiresCoverLetter ? 'Required' : 'Optional'}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <i className="fas fa-folder text-blue-500 mr-2"></i>
                        <span>Portfolio: {job.applicationProcess.requiresPortfolio ? 'Required' : 'Optional'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                {/* Job Summary Card */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    <i className="fas fa-info-circle text-blue-600 mr-2"></i>
                    Job Summary
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600 flex items-center">
                        <i className="fas fa-calendar-alt mr-2 text-gray-400"></i>
                        Posted
                      </span>
                      <span className="font-medium text-gray-900">{getDaysAgo(job.createdAt)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600 flex items-center">
                        <i className="fas fa-briefcase mr-2 text-gray-400"></i>
                        Job Type
                      </span>
                      <span className="font-medium text-gray-900">{job.jobType}</span>
                    </div>
                    
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600 flex items-center">
                        <i className="fas fa-user-graduate mr-2 text-gray-400"></i>
                        Experience
                      </span>
                      <span className="font-medium text-gray-900">{job.experience}</span>
                    </div>
                    
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600 flex items-center">
                        <i className="fas fa-industry mr-2 text-gray-400"></i>
                        Industry
                      </span>
                      <span className="font-medium text-gray-900">{job.industry}</span>
                    </div>
                    
                    {job.workArrangement && (
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600 flex items-center">
                          <i className="fas fa-home mr-2 text-gray-400"></i>
                          Work Style
                        </span>
                        <span className="font-medium text-gray-900">{job.workArrangement}</span>
                      </div>
                    )}
                    
                    {job.applicationDeadline && (
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600 flex items-center">
                          <i className="fas fa-clock mr-2 text-gray-400"></i>
                          Deadline
                        </span>
                        <span className={`font-medium ${deadlineStatus?.color || 'text-gray-900'}`}>
                          {formatDate(job.applicationDeadline)}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Quick Apply Button */}
                  <div className="mt-6">
                    {hasApplied ? (
                      <div className="w-full py-3 bg-green-100 text-green-800 rounded-lg text-center font-medium">
                        <i className="fas fa-check-circle mr-2"></i>
                        Application Submitted
                      </div>
                    ) : deadlineStatus?.status === 'expired' ? (
                      <div className="w-full py-3 bg-gray-100 text-gray-600 rounded-lg text-center font-medium">
                        <i className="fas fa-clock mr-2"></i>
                        Application Closed
                      </div>
                    ) : (
                      <Link
                        to={`/jobs/${job._id}/apply`}
                        className="w-full block py-3 bg-blue-600 text-white rounded-lg text-center font-medium hover:bg-blue-700 transition-colors"
                      >
                        <i className="fas fa-paper-plane mr-2"></i>
                        Apply for this Job
                      </Link>
                    )}
                  </div>
                </div>

                {/* Company Information */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    <i className="fas fa-building text-blue-600 mr-2"></i>
                    About {job.employer?.companyName || job.company}
                  </h3>
                  
                  <div className="space-y-4">
                    {job.employer?.companyDescription && (
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {job.employer.companyDescription}
                      </p>
                    )}
                    
                    <div className="space-y-3">
                      {job.employer?.industry && (
                        <div className="flex items-center text-sm">
                          <i className="fas fa-tag text-gray-400 mr-3"></i>
                          <span className="text-gray-600">Industry: </span>
                          <span className="font-medium text-gray-900 ml-1">{job.employer.industry}</span>
                        </div>
                      )}
                      
                      {job.employer?.companySize && (
                        <div className="flex items-center text-sm">
                          <i className="fas fa-users text-gray-400 mr-3"></i>
                          <span className="text-gray-600">Company Size: </span>
                          <span className="font-medium text-gray-900 ml-1">{job.employer.companySize} employees</span>
                        </div>
                      )}
                      
                      {job.employer?.companyWebsite && (
                        <div className="flex items-center text-sm">
                          <i className="fas fa-globe text-gray-400 mr-3"></i>
                          <a
                            href={job.employer.companyWebsite}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            Visit Company Website
                            <i className="fas fa-external-link-alt ml-1 text-xs"></i>
                          </a>
                        </div>
                      )}
                    </div>
                    
                    <div className="pt-4 border-t border-gray-100">
                      <Link
                        to={`/companies/${job.employer?._id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline"
                      >
                        View all jobs from this company
                        <i className="fas fa-arrow-right ml-1"></i>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Job Stats */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    <i className="fas fa-chart-bar text-blue-600 mr-2"></i>
                    Job Statistics
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 flex items-center">
                        <i className="fas fa-eye text-gray-400 mr-2"></i>
                        Views
                      </span>
                      <span className="font-medium text-gray-900">{jobStats.views.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 flex items-center">
                        <i className="fas fa-paper-plane text-gray-400 mr-2"></i>
                        Applications
                      </span>
                      <span className="font-medium text-gray-900">{jobStats.applications.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 flex items-center">
                        <i className="fas fa-bookmark text-gray-400 mr-2"></i>
                        Saves
                      </span>
                      <span className="font-medium text-gray-900">{jobStats.saves.toLocaleString()}</span>
                    </div>
                    
                    {jobStats.applications > 0 && jobStats.views > 0 && (
                      <div className="pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 text-sm">Application Rate</span>
                          <span className="font-medium text-blue-600">
                            {((jobStats.applications / jobStats.views) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Similar Jobs Section */}
            {similarJobs.length > 0 && (
              <div className="mt-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  <i className="fas fa-search text-blue-600 mr-2"></i>
                  Similar Jobs You Might Like
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {similarJobs.map((similarJob, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-900 mb-2 hover:text-blue-600">
                            <Link to={`/jobs/${similarJob._id || similarJob.id}`}>
                              {similarJob.job_title || similarJob.title}
                            </Link>
                          </h3>
                          <p className="text-gray-600 mb-2">{similarJob.company}</p>
                          <div className="flex items-center text-sm text-gray-500 space-x-4">
                            <span className="flex items-center">
                              <i className="fas fa-map-marker-alt mr-1"></i>
                              {similarJob.location}
                            </span>
                            {similarJob.salary && (
                              <span className="flex items-center">
                                <i className="fas fa-dollar-sign mr-1"></i>
                                ${similarJob.salary.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {similarJob.similarity_score && (
                          <div className="text-right">
                            <div className="text-sm text-gray-500">Match</div>
                            <div className="font-bold text-blue-600">
                              {(similarJob.similarity_score * 100).toFixed(0)}%
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {similarJob.experience_level && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                              {similarJob.experience_level}
                            </span>
                          )}
                          {similarJob.industry && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-xs">
                              {similarJob.industry}
                            </span>
                          )}
                        </div>
                        
                        <Link
                          to={`/jobs/${similarJob._id || similarJob.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline"
                        >
                          View Details
                          <i className="fas fa-arrow-right ml-1"></i>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="text-center mt-6">
                  <Link
                    to="/jobs"
                    className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <i className="fas fa-search mr-2"></i>
                    Browse More Jobs
                  </Link>
                </div>
              </div>
            )}

            {/* Report Job Section */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Found an issue with this job?</h3>
                  <p className="text-gray-600 text-sm">Help us improve by reporting inappropriate content or errors.</p>
                </div>
                <div className="mt-4 md:mt-0">
                  <button
                    onClick={() => {
                      // You can implement a report modal or redirect to a report form
                      alert('Report functionality would be implemented here');
                    }}
                    className="flex items-center px-4 py-2 text-gray-600 hover:text-red-600 border border-gray-300 rounded-md hover:border-red-300 transition-colors"
                  >
                    <i className="fas fa-flag mr-2"></i>
                    Report this Job
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetailPage;