// src/pages/JobApplicantsPage.jsx - Updated with proper file download and better UI
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const JobApplicantsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    sortBy: 'appliedAt',
    sortOrder: 'desc'
  });
  const [downloadingFile, setDownloadingFile] = useState('');
  const [selectedApplications, setSelectedApplications] = useState(new Set());
  const [statusBreakdown, setStatusBreakdown] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          setError('You must be logged in to view applicants');
          setLoading(false);
          return;
        }

        const config = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        };

        // Fetch job details
        const jobResponse = await axios.get(`http://localhost:5000/api/jobs/${id}`, config);
        if (jobResponse.data.success) {
          setJob(jobResponse.data.data);
        }

        // Fetch applications for this job
        const queryParams = new URLSearchParams({
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder
        });

        if (filters.status !== 'all') {
          queryParams.append('status', filters.status);
        }

        const applicationsResponse = await axios.get(
          `http://localhost:5000/api/applications/job/${id}?${queryParams}`, 
          config
        );
        
        if (applicationsResponse.data.success) {
          setApplications(applicationsResponse.data.data || []);
          setStatusBreakdown(applicationsResponse.data.statusBreakdown || {});
        }
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.response?.data?.message || 'Error fetching data. Please try again.');
        
        if (err.response?.status === 401 || err.response?.status === 403) {
          navigate('/dashboard/employer');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate, filters]);

  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('You must be logged in to update application status');
        return;
      }

      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      };

      const response = await axios.put(
        `http://localhost:5000/api/applications/${applicationId}`, 
        { status: newStatus }, 
        config
      );

      if (response.data.success) {
        // Update the application in the state
        setApplications(applications.map(app => 
          app._id === applicationId ? { ...app, status: newStatus } : app
        ));
        
        // Show success message
        setError('');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setError(err.response?.data?.message || 'Error updating application status. Please try again.');
    }
  };

  const downloadFile = async (fileUrl, fileName, applicantName) => {
    try {
      setDownloadingFile(`${applicantName}-${fileName}`);
      const token = localStorage.getItem('token');
      
      console.log('Downloading file:', { fileUrl, fileName, applicantName });
      
      // Construct the full URL
      const fullUrl = fileUrl.startsWith('http') 
        ? fileUrl 
        : `http://localhost:5000${fileUrl}`;

      console.log('Full download URL:', fullUrl);

      // Use fetch instead of axios for better blob handling
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get the blob data
      const blob = await response.blob();
      
      // Create blob URL and download
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      
      // Set filename with proper extension
      const extension = fileUrl.split('.').pop() || 'pdf';
      const downloadFileName = `${applicantName}_${fileName}.${extension}`;
      link.setAttribute('download', downloadFileName);
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up blob URL
      window.URL.revokeObjectURL(blobUrl);
      
    } catch (err) {
      console.error('Download error:', err);
      setError(`Error downloading ${fileName}. The file may not exist or you may not have permission to access it.`);
    } finally {
      setDownloadingFile('');
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters({
      ...filters,
      [filterType]: value
    });
  };

  const handleSelectApplication = (applicationId) => {
    const newSelected = new Set(selectedApplications);
    if (newSelected.has(applicationId)) {
      newSelected.delete(applicationId);
    } else {
      newSelected.add(applicationId);
    }
    setSelectedApplications(newSelected);
  };

  const handleBulkStatusChange = async (newStatus) => {
    if (selectedApplications.size === 0) return;
    
    try {
      const token = localStorage.getItem('token');
      const promises = Array.from(selectedApplications).map(applicationId =>
        axios.put(
          `http://localhost:5000/api/applications/${applicationId}`,
          { status: newStatus },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            }
          }
        )
      );

      await Promise.all(promises);

      // Update applications in state
      setApplications(applications.map(app => 
        selectedApplications.has(app._id) ? { ...app, status: newStatus } : app
      ));

      // Clear selection
      setSelectedApplications(new Set());
      setError('');
    } catch (err) {
      setError('Error updating selected applications. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'reviewing': 'bg-blue-100 text-blue-800',
      'shortlisted': 'bg-purple-100 text-purple-800',
      'interview-scheduled': 'bg-indigo-100 text-indigo-800',
      'interviewed': 'bg-pink-100 text-pink-800',
      'under-consideration': 'bg-orange-100 text-orange-800',
      'accepted': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'withdrawn': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold">Job Applications</h1>
                {job && (
                  <div className="mt-2">
                    <p className="text-xl text-blue-100">{job.title}</p>
                    <p className="text-blue-200">{job.company}</p>
                    <div className="flex items-center mt-1 text-sm text-blue-200">
                      <i className="fas fa-map-marker-alt mr-1"></i>
                      <span>{job.location}</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="text-blue-100">Total Applications</p>
                <p className="text-3xl font-bold">{applications.length}</p>
              </div>
            </div>

            {/* Status Breakdown */}
            {Object.keys(statusBreakdown).length > 0 && (
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(statusBreakdown).map(([status, count]) => (
                  <div key={status} className="bg-blue-500 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-xs text-blue-100 capitalize">
                      {status.replace('-', ' ')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Content */}
          <div className="p-6">
            {/* Error Message */}
            {error && (
              <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <i className="fas fa-exclamation-circle text-red-500"></i>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Filters and Bulk Actions */}
            {applications.length > 0 && (
              <div className="mb-6 space-y-4">
                {/* Bulk Actions */}
                {selectedApplications.size > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-900">
                        {selectedApplications.size} application{selectedApplications.size !== 1 ? 's' : ''} selected
                      </span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleBulkStatusChange('reviewing')}
                          className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                        >
                          Mark as Reviewing
                        </button>
                        <button
                          onClick={() => handleBulkStatusChange('shortlisted')}
                          className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700"
                        >
                          Shortlist
                        </button>
                        <button
                          onClick={() => handleBulkStatusChange('rejected')}
                          className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => setSelectedApplications(new Set())}
                          className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400"
                        >
                          Clear Selection
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Filters */}
                <div className="flex flex-wrap gap-4 items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="block w-40 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="reviewing">Reviewing</option>
                        <option value="shortlisted">Shortlisted</option>
                        <option value="accepted">Accepted</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                      <select
                        value={filters.sortBy}
                        onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                        className="block w-40 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      >
                        <option value="appliedAt">Date Applied</option>
                        <option value="status">Status</option>
                        <option value="applicant.name">Name</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                      <select
                        value={filters.sortOrder}
                        onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                        className="block w-32 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      >
                        <option value="desc">Newest</option>
                        <option value="asc">Oldest</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedApplications(new Set(applications.map(app => app._id)))}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => setSelectedApplications(new Set())}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Applicants List */}
            {applications.length > 0 ? (
              <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedApplications.size === applications.length && applications.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedApplications(new Set(applications.map(app => app._id)));
                            } else {
                              setSelectedApplications(new Set());
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Applicant
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Applied On
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Files
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {applications.map((application) => (
                      <tr key={application._id} className={`hover:bg-gray-50 ${selectedApplications.has(application._id) ? 'bg-blue-50' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedApplications.has(application._id)}
                            onChange={() => handleSelectApplication(application._id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="bg-gray-100 rounded-full h-10 w-10 flex items-center justify-center mr-3">
                              {application.applicant.profilePhoto ? (
                                <img 
                                  src={`http://localhost:5000${application.applicant.profilePhoto}`}
                                  alt={application.applicant.name}
                                  className="h-10 w-10 rounded-full object-cover"
                                />
                              ) : (
                                <i className="fas fa-user text-gray-500"></i>
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {application.applicant.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {application.applicant.email}
                              </div>
                              {application.applicant.location && (
                                <div className="text-xs text-gray-400">
                                  <i className="fas fa-map-marker-alt mr-1"></i>
                                  {application.applicant.location}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>
                            {formatDate(application.appliedAt)}
                          </div>
                          {application.expectedSalary && (
                            <div className="text-xs text-gray-400">
                              Expected: ${application.expectedSalary.toLocaleString()}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(application.status)}`}>
                            {application.status.charAt(0).toUpperCase() + application.status.slice(1).replace('-', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex space-x-2">
                            {application.resume && (
                              <button
                                onClick={() => downloadFile(
                                  application.resume, 
                                  'resume', 
                                  application.applicant.name.replace(/\s+/g, '_')
                                )}
                                disabled={downloadingFile === `${application.applicant.name.replace(/\s+/g, '_')}-resume`}
                                className="text-blue-600 hover:text-blue-900 disabled:text-gray-400 transition-colors"
                                title="Download Resume"
                              >
                                {downloadingFile === `${application.applicant.name.replace(/\s+/g, '_')}-resume` ? (
                                  <i className="fas fa-spinner fa-spin"></i>
                                ) : (
                                  <i className="fas fa-file-pdf text-lg"></i>
                                )}
                              </button>
                            )}
                            {application.coverLetterFile && (
                              <button
                                onClick={() => downloadFile(
                                  application.coverLetterFile, 
                                  'cover_letter', 
                                  application.applicant.name.replace(/\s+/g, '_')
                                )}
                                disabled={downloadingFile === `${application.applicant.name.replace(/\s+/g, '_')}-cover_letter`}
                                className="text-green-600 hover:text-green-900 disabled:text-gray-400 transition-colors"
                                title="Download Cover Letter"
                              >
                                {downloadingFile === `${application.applicant.name.replace(/\s+/g, '_')}-cover_letter` ? (
                                  <i className="fas fa-spinner fa-spin"></i>
                                ) : (
                                  <i className="fas fa-file-text text-lg"></i>
                                )}
                              </button>
                            )}
                            {!application.resume && !application.coverLetterFile && (
                              <span className="text-gray-400 text-xs">No files</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex flex-wrap gap-1">
                            <Link
                              to={`/applications/${application._id}`}
                              className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors"
                            >
                              <i className="fas fa-eye mr-1"></i> View
                            </Link>
                            
                            {application.status === 'pending' && (
                              <button
                                onClick={() => handleStatusChange(application._id, 'reviewing')}
                                className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors"
                              >
                                Review
                              </button>
                            )}
                            
                            {!['accepted', 'rejected'].includes(application.status) && (
                              <>
                                <button
                                  onClick={() => handleStatusChange(application._id, 'shortlisted')}
                                  className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs hover:bg-purple-200 transition-colors"
                                  disabled={application.status === 'shortlisted'}
                                >
                                  Shortlist
                                </button>
                                <button
                                  onClick={() => handleStatusChange(application._id, 'accepted')}
                                  className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 transition-colors"
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() => handleStatusChange(application._id, 'rejected')}
                                  className="inline-flex items-center px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 transition-colors"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
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
                    <i className="fas fa-user-friends text-gray-400 text-3xl"></i>
                  </div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Yet</h3>
                <p className="text-gray-500 mb-6">Your job listing hasn't received any applications yet.</p>
                <div className="space-y-2">
                  <p className="text-sm text-gray-400">Share your job listing to attract more candidates:</p>
                  <Link
                    to={`/jobs/${id}`}
                    className="inline-flex items-center px-4 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100"
                  >
                    <i className="fas fa-external-link-alt mr-2"></i>
                    View Job Listing
                  </Link>
                </div>
              </div>
            )}
            
            <div className="mt-6 flex justify-between items-center">
              <Link
                to="/dashboard/employer"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Back to Dashboard
              </Link>
              
              {applications.length > 0 && (
                <div className="text-sm text-gray-500">
                  Showing {applications.length} application{applications.length !== 1 ? 's' : ''}
                  {filters.status !== 'all' && ` with status: ${filters.status}`}
                  {selectedApplications.size > 0 && ` (${selectedApplications.size} selected)`}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobApplicantsPage;