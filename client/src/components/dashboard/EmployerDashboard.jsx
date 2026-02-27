// src/pages/dashboard/EmployerDashboard.jsx - Fixed version with proper error handling
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const EmployerDashboard = () => {
  const [user, setUser] = useState(null);
  const [postedJobs, setPostedJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [successMessage, setSuccessMessage] = useState('');
  const [backendStatus, setBackendStatus] = useState('checking');
  
  const navigate = useNavigate();
  const location = useLocation();

  // API Base URL
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

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
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    }

    // Initialize dashboard
    initializeDashboard();
  }, [navigate, location]);

  const initializeDashboard = async () => {
    try {
      // Check authentication first
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      if (!storedUser || !token) {
        console.log('No authentication found, redirecting to login');
        navigate('/login');
        return;
      }

      const parsedUser = JSON.parse(storedUser);
      console.log('Stored user:', parsedUser);
      
      // Check user role
      if (parsedUser.role !== 'employer') {
        console.log('User is not an employer, redirecting');
        navigate('/dashboard/seeker');
        return;
      }
      
      // Set initial user data from localStorage
      setUser(parsedUser);
      
      // Check backend status first
      await checkBackendStatus();
      
      // Fetch dynamic data
      await fetchEmployerData(token);
      
    } catch (err) {
      console.error('Dashboard initialization error:', err);
      setError('Failed to initialize dashboard. Please refresh the page.');
      setLoading(false);
    }
  };

  const checkBackendStatus = async () => {
    try {
      console.log('Checking backend status...');
      const response = await axios.get(`${API_BASE_URL}/health`, { timeout: 5000 });
      
      if (response.status === 200) {
        setBackendStatus('online');
        console.log('✅ Backend is online');
        return true;
      }
    } catch (err) {
      console.error('❌ Backend health check failed:', err.message);
      setBackendStatus('offline');
      setError('Backend server is not responding. Some features may not work properly.');
      return false;
    }
  };

// Fixed fetchApplicationsData function for EmployerDashboard.jsx
const fetchApplicationsData = async (config) => {
  try {
    console.log('🔄 Fetching applications for employer...');
    
    // NEW: Use the employer-specific endpoint first
    try {
      console.log('Trying employer applications endpoint...');
      const employerAppsResponse = await axios.get(`${API_BASE_URL}/api/applications/employer/me`, config);
      
      if (employerAppsResponse.data && employerAppsResponse.data.success) {
        const applications = employerAppsResponse.data.data || [];
        setApplications(applications);
        console.log(`✅ Employer applications fetched successfully: ${applications.length} applications`);
        
        // Log application details for debugging
        applications.forEach((app, index) => {
          console.log(`Application ${index + 1}:`, {
            id: app._id,
            jobTitle: app.job?.title,
            applicantName: app.applicant?.name,
            status: app.status,
            appliedAt: app.appliedAt
          });
        });
        
        return; // Exit early on success
      }
    } catch (employerErr) {
      console.error('❌ Employer applications endpoint failed:', employerErr.response?.status, employerErr.message);
      
      if (employerErr.response?.status === 404) {
        console.log('⚠️ Endpoint not found, falling back to job-by-job fetching...');
      } else {
        throw employerErr; // Re-throw other errors
      }
    }

    // FALLBACK: If employer endpoint fails, fetch by individual jobs
    console.log('🔄 Falling back to job-by-job application fetching...');
    
    const currentJobs = postedJobs.length > 0 ? postedJobs : [];
    if (currentJobs.length === 0) {
      console.log('ℹ️ No jobs found for fetching applications');
      setApplications([]);
      return;
    }

    let allApplications = [];
    
    // Fetch applications for each job
    for (const job of currentJobs) {
      try {
        console.log(`Fetching applications for job: ${job.title} (${job._id})`);
        
        const appEndpoints = [
          `${API_BASE_URL}/api/applications/job/${job._id}`,
          `${API_BASE_URL}/api/applications?jobId=${job._id}`
        ];

        let jobApplications = [];
        
        for (const endpoint of appEndpoints) {
          try {
            const appResponse = await axios.get(endpoint, config);
            
            if (appResponse.data && appResponse.data.success && appResponse.data.data) {
              jobApplications = appResponse.data.data;
              console.log(`✅ Applications fetched for job ${job.title}: ${jobApplications.length}`);
              break;
            }
          } catch (endpointErr) {
            console.warn(`Failed to fetch applications from ${endpoint}:`, endpointErr.response?.status);
            continue;
          }
        }
        
        if (jobApplications.length > 0) {
          // Add job information to each application if missing
          const enhancedApplications = jobApplications.map(app => ({
            ...app,
            job: app.job || {
              _id: job._id,
              title: job.title,
              company: job.company,
              location: job.location,
              jobType: job.jobType
            }
          }));
          
          allApplications = [...allApplications, ...enhancedApplications];
        }
        
      } catch (appErr) {
        console.warn(`Applications fetch failed for job ${job._id} (${job.title}):`, appErr.message);
      }
    }
    
    setApplications(allApplications);
    console.log(`✅ Total applications fetched via fallback: ${allApplications.length}`);
    
  } catch (err) {
    console.error('❌ Error fetching applications:', err);
    setApplications([]);
    
    // Provide more specific error feedback
    if (err.response?.status === 401) {
      setError('Authentication failed. Please log in again.');
    } else if (err.response?.status === 403) {
      setError('You are not authorized to view applications.');
    } else {
      setError('Unable to load applications. Please try refreshing the page.');
    }
  }
};

// Enhanced fetchEmployerData function with better error handling
const fetchEmployerData = async (token) => {
  setLoading(true);
  setError('');
  
  try {
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000 // Increased timeout to 15 seconds
    };
    
    console.log('🔄 Starting comprehensive employer data fetch...');
    
    // 1. Fetch user profile
    let profileFetched = false;
    try {
      console.log('📊 Fetching user profile...');
      const profileResponse = await axios.get(`${API_BASE_URL}/api/users/profile`, config);
      
      if (profileResponse.data && profileResponse.data.success) {
        setUser(profileResponse.data.data);
        profileFetched = true;
        console.log('✅ Profile data fetched successfully');
      }
    } catch (profileErr) {
      console.error('❌ Profile fetch failed:', profileErr.response?.status, profileErr.message);
      
      if (profileErr.response?.status === 401) {
        console.log('🔑 Token expired, redirecting to login...');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }
      
      setError('Unable to load profile data. Using cached information.');
    }

    // 2. Fetch posted jobs with multiple endpoint attempts
    let jobsFetched = false;
    try {
      console.log('📊 Fetching posted jobs...');
      
      const currentUserId = user?._id || JSON.parse(localStorage.getItem('user'))._id;
      
      const jobEndpoints = [
        `${API_BASE_URL}/api/jobs/employer/me`,
        `${API_BASE_URL}/api/jobs?employer=${currentUserId}`,
        `${API_BASE_URL}/api/jobs`
      ];

      for (const endpoint of jobEndpoints) {
        try {
          console.log(`Trying job endpoint: ${endpoint}`);
          const jobsResponse = await axios.get(endpoint, config);
          
          if (jobsResponse.data && jobsResponse.data.success) {
            let jobs = jobsResponse.data.data || [];
            
            // Filter by employer if using generic endpoint
            if (endpoint.includes('/api/jobs') && !endpoint.includes('employer')) {
              jobs = jobs.filter(job => 
                job.employer === currentUserId || 
                job.employer._id === currentUserId ||
                (typeof job.employer === 'object' && job.employer._id === currentUserId)
              );
            }
            
            setPostedJobs(jobs);
            jobsFetched = true;
            console.log(`✅ Jobs fetched successfully: ${jobs.length} jobs`);
            break;
          }
        } catch (endpointErr) {
          console.warn(`Job endpoint ${endpoint} failed:`, endpointErr.response?.status);
          continue;
        }
      }

      if (!jobsFetched) {
        console.warn('⚠️ All job endpoints failed');
        setPostedJobs([]);
      }

    } catch (jobsErr) {
      console.error('❌ Jobs fetch completely failed:', jobsErr.message);
      setPostedJobs([]);
    }

    // 3. Fetch applications (this will use the new function above)
    await fetchApplicationsData(config);

    console.log('✅ Employer data fetch completed');

  } catch (err) {
    console.error('❌ General error in fetchEmployerData:', err);
    
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
      return;
    }
    
    setError(`Failed to load dashboard data: ${err.message}`);
  } finally {
    setLoading(false);
  }
};

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const refreshData = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      setError('');
      await fetchEmployerData(token);
    }
  };

  const handleUpdateApplicationStatus = async (applicationId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      const response = await axios.put(
        `${API_BASE_URL}/api/applications/${applicationId}`,
        { status: newStatus },
        config
      );

      if (response.data.success) {
        // Update local state
        setApplications(prevApps => 
          prevApps.map(app => 
            app._id === applicationId 
              ? { ...app, status: newStatus }
              : app
          )
        );
        setSuccessMessage(`Application status updated to ${newStatus}`);
      }
    } catch (err) {
      console.error('Error updating application status:', err);
      setError('Failed to update application status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 mb-2">Loading your dashboard...</p>
          <p className="text-sm text-gray-500">Backend Status: {backendStatus}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Employer Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">
              Welcome back, {user?.companyName || user?.name || 'Employer'}
            </p>
            {backendStatus !== 'online' && (
              <p className="text-xs text-yellow-600 mt-1">
                ⚠️ Some services may be limited
              </p>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={refreshData}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              disabled={loading}
            >
              <svg className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            
            <Link
              to="/post-job"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Post Job
            </Link>
            
            <Link
              to="/company-profile"
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.5a8.25 8.25 0 0116.5 0" />
              </svg>
              Profile
            </Link>
            
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z' },
              { id: 'posted-jobs', name: 'Posted Jobs', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745V6.5A1.5 1.5 0 014.5 5h15A1.5 1.5 0 0121 6.5v6.755z' },
              { id: 'applications', name: 'Applications', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon} />
                </svg>
                {tab.name}
                {tab.id === 'applications' && applications.length > 0 && (
                  <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {applications.filter(app => app.status === 'pending').length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white shadow-sm rounded-lg">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="p-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="bg-blue-500 rounded-full p-3">
                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745V6.5A1.5 1.5 0 014.5 5h15A1.5 1.5 0 0121 6.5v6.755z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-blue-600 truncate">Total Jobs Posted</dt>
                        <dd className="text-3xl font-bold text-blue-900">{postedJobs.length}</dd>
                      </dl>
                    </div>
                  </div>
                  <div className="mt-4">
                    <button 
                      onClick={() => setActiveTab('posted-jobs')} 
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View all jobs →
                    </button>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="bg-green-500 rounded-full p-3">
                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-green-600 truncate">Total Applications</dt>
                        <dd className="text-3xl font-bold text-green-900">{applications.length}</dd>
                      </dl>
                    </div>
                  </div>
                  <div className="mt-4">
                    <button 
                      onClick={() => setActiveTab('applications')} 
                      className="text-sm text-green-600 hover:text-green-800 font-medium"
                    >
                      Review applications →
                    </button>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="bg-yellow-500 rounded-full p-3">
                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-yellow-600 truncate">Pending Review</dt>
                        <dd className="text-3xl font-bold text-yellow-900">
                          {applications.filter(app => app.status === 'pending' || app.status === 'reviewing').length}
                        </dd>
                      </dl>
                    </div>
                  </div>
                  <div className="mt-4">
                    <button 
                      onClick={() => setActiveTab('applications')} 
                      className="text-sm text-yellow-600 hover:text-yellow-800 font-medium"
                    >
                      Review now →
                    </button>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="bg-purple-500 rounded-full p-3">
                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-purple-600 truncate">Profile Complete</dt>
                        <dd className="text-3xl font-bold text-purple-900">{user?.profileCompleteness || 75}%</dd>
                      </dl>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Link to="/company-profile" className="text-sm text-purple-600 hover:text-purple-800 font-medium">
                      Complete profile →
                    </Link>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Link
                    to="/post-job"
                    className="block bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg p-4 transition-colors"
                  >
                    <div className="flex items-center">
                      <div className="bg-blue-500 rounded-full p-2 mr-4">
                        <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Post New Job</p>
                        <p className="text-sm text-gray-600">Create a new job listing</p>
                      </div>
                    </div>
                  </Link>

                  <Link
                    to="/company-profile"
                    className="block bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg p-4 transition-colors"
                  >
                    <div className="flex items-center">
                      <div className="bg-gray-500 rounded-full p-2 mr-4">
                        <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Update Profile</p>
                        <p className="text-sm text-gray-600">Edit company information</p>
                      </div>
                    </div>
                  </Link>

                  <button
                    onClick={() => setActiveTab('applications')}
                    className="block w-full bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg p-4 transition-colors text-left"
                  >
                    <div className="flex items-center">
                      <div className="bg-green-500 rounded-full p-2 mr-4">
                        <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Review Applications</p>
                        <p className="text-sm text-gray-600">{applications.length} applications to review</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                {applications.length > 0 ? (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-3">
                      {applications.slice(0, 5).map((application, index) => (
                        <div key={index} className="flex items-center justify-between bg-white p-3 rounded-md shadow-sm">
                          <div className="flex items-center">
                            <div className="bg-blue-100 rounded-full p-2 mr-3">
                              <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                New application for {application.job?.title || 'Unknown Position'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {application.applicant?.name || 'Unknown Applicant'} • {' '}
                                {new Date(application.appliedAt || application.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            application.status === 'reviewing' ? 'bg-blue-100 text-blue-800' :
                            application.status === 'accepted' ? 'bg-green-100 text-green-800' :
                            application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {application.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activity</h3>
                    <p className="mt-1 text-sm text-gray-500">Applications will appear here once candidates apply to your jobs.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Posted Jobs Tab */}
          {activeTab === 'posted-jobs' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">Your Posted Jobs</h3>
                <Link
                  to="/post-job"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Post New Job
                </Link>
              </div>

              {postedJobs.length > 0 ? (
                <div className="space-y-4">
                  {postedJobs.map((job) => (
                    <div key={job._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-lg font-medium text-gray-900">{job.title}</h4>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              job.status === 'active' ? 'bg-green-100 text-green-800' :
                              job.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                              job.status === 'closed' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {job.status || 'active'}
                            </span>
                          </div>
                          
                          <div className="flex items-center text-sm text-gray-600 mb-2">
                            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {job.location}
                            <span className="mx-2">•</span>
                            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {job.jobType}
                            <span className="mx-2">•</span>
                            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3a4 4 0 118 0v4m-4 8a4 4 0 11-8 0v-1z" />
                            </svg>
                            {job.experience}
                          </div>

                          {job.salary && (
                            <div className="flex items-center text-sm text-gray-600 mb-2">
                              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                              </svg>
                              ${job.salary.min?.toLocaleString()}
                              {job.salary.max && ` - $${job.salary.max.toLocaleString()}`}
                              {job.salary.period && ` ${job.salary.period}`}
                            </div>
                          )}

                          <p className="text-sm text-gray-500 mb-3">
                            Posted on {new Date(job.createdAt).toLocaleDateString()}
                          </p>

                          {job.description && (
                            <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                              {job.description.length > 150 
                                ? job.description.substring(0, 150) + '...' 
                                : job.description}
                            </p>
                          )}

                          {/* Job Stats */}
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              {job.viewCount || 0} views
                            </div>
                            <div className="flex items-center">
                              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              {applications.filter(app => app.job?._id === job._id).length} applications
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="ml-4 flex flex-col space-y-2">
                          <Link
                            to={`/jobs/${job._id}`}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                          >
                            <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            View
                          </Link>
                          <Link
                            to={`/jobs/edit/${job._id}`}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                          >
                            <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </Link>
                          <button
                            onClick={() => setActiveTab('applications')}
                            className="inline-flex items-center px-3 py-1.5 border border-blue-300 text-xs font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100"
                          >
                            <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Applicants
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <div className="flex justify-center mb-4">
                    <div className="bg-gray-200 rounded-full p-4">
                      <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745V6.5A1.5 1.5 0 014.5 5h15A1.5 1.5 0 0121 6.5v6.755z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Jobs Posted Yet</h3>
                  <p className="text-gray-500 mb-6">Start posting jobs to find the perfect candidates for your company.</p>
                  <Link
                    to="/post-job"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Post Your First Job
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Applications Tab */}
          {activeTab === 'applications' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">Applications Received</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    {applications.filter(app => app.status === 'pending').length} pending review
                  </span>
                </div>
              </div>

              {applications.length > 0 ? (
                <div className="space-y-4">
                  {applications.map((application) => (
                    <div key={application._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center mb-3">
                            <div className="bg-gray-100 rounded-full h-12 w-12 flex items-center justify-center mr-4">
                              <svg className="h-6 w-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <h4 className="text-lg font-medium text-gray-900">
                                {application.applicant?.name || 'Unknown Applicant'}
                              </h4>
                              <p className="text-sm text-gray-600">
                                Applied for: <span className="font-medium">{application.job?.title || 'Unknown Position'}</span>
                              </p>
                              <p className="text-xs text-gray-500">
                                {application.applicant?.email || 'No email available'}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                                application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                application.status === 'reviewing' ? 'bg-blue-100 text-blue-800' :
                                application.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                application.status === 'shortlisted' ? 'bg-purple-100 text-purple-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                              </span>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(application.appliedAt || application.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          {application.coverLetter && (
                            <div className="mb-4">
                              <h5 className="text-sm font-medium text-gray-700 mb-2">Cover Letter:</h5>
                              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                                {application.coverLetter.length > 200 
                                  ? application.coverLetter.substring(0, 200) + '...' 
                                  : application.coverLetter}
                              </p>
                            </div>
                          )}

                          {application.expectedSalary && (
                            <div className="mb-4">
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Expected Salary:</span> ${application.expectedSalary.toLocaleString()}
                              </p>
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <Link
                                to={`/applications/${application._id}`}
                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                              >
                                <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                View Details
                              </Link>

                              {application.resume && (
                                <a
                                  href={`${API_BASE_URL}${application.resume}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                >
                                  <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  Download Resume
                                </a>
                              )}
                            </div>

                            <div className="flex items-center space-x-2">
                              {application.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleUpdateApplicationStatus(application._id, 'reviewing')}
                                    className="inline-flex items-center px-3 py-1.5 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100"
                                  >
                                    <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                    Review
                                  </button>
                                  <button
                                    onClick={() => handleUpdateApplicationStatus(application._id, 'shortlisted')}
                                    className="inline-flex items-center px-3 py-1.5 border border-purple-300 text-sm font-medium rounded-md text-purple-700 bg-purple-50 hover:bg-purple-100"
                                  >
                                    <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                    Shortlist
                                  </button>
                                </>
                              )}

                              {(application.status === 'reviewing' || application.status === 'shortlisted') && (
                                <>
                                  <button
                                    onClick={() => handleUpdateApplicationStatus(application._id, 'accepted')}
                                    className="inline-flex items-center px-3 py-1.5 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100"
                                  >
                                    <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => handleUpdateApplicationStatus(application._id, 'rejected')}
                                    className="inline-flex items-center px-3 py-1.5 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100"
                                  >
                                    <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Reject
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <div className="flex justify-center mb-4">
                    <div className="bg-gray-200 rounded-full p-4">
                      <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Yet</h3>
                  <p className="text-gray-500 mb-6">You'll see applications from job seekers here once they apply to your job listings.</p>
                  <Link
                    to="/post-job"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Post a Job to Get Started
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default EmployerDashboard;