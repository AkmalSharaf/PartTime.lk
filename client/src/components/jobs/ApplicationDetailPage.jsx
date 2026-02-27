// src/components/jobs/ApplicationDetailPage.jsx - Updated with better file handling
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const ApplicationDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState('');
  const [downloadingFile, setDownloadingFile] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setUserRole(user.role || '');
        
        if (!token) {
          setError('You must be logged in to view this application');
          setLoading(false);
          return;
        }

        const config = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        };

        const response = await axios.get(`http://localhost:5000/api/applications/${id}`, config);
        
        if (response.data.success) {
          setApplication(response.data.data);
        }
        
      } catch (err) {
        console.error('Error fetching application:', err);
        setError(err.response?.data?.message || 'Error fetching application details. Please try again.');
        
        if (err.response?.status === 401) {
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const handleWithdrawApplication = async () => {
    if (!window.confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('You must be logged in to withdraw an application');
        return;
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      const response = await axios.delete(`http://localhost:5000/api/applications/${id}`, config);
      
      if (response.data.success) {
        navigate('/dashboard/seeker?tab=applications', { 
          state: { message: 'Application withdrawn successfully' } 
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error withdrawing application. Please try again.');
    }
  };

  const updateApplicationStatus = async (newStatus, notes = '') => {
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

      const updateData = { status: newStatus };
      if (notes) updateData.employerNotes = notes;

      const response = await axios.put(
        `http://localhost:5000/api/applications/${id}`, 
        updateData, 
        config
      );

      if (response.data.success) {
        setApplication({
          ...application,
          status: newStatus,
          ...(notes && { employerNotes: notes })
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating application status. Please try again.');
    }
  };

  const downloadFile = async (fileUrl, fileName, fileType) => {
    try {
      setDownloadingFile(fileType);
      const token = localStorage.getItem('token');
      
      console.log('Downloading file:', { fileUrl, fileName, fileType });
      
      // Construct the full URL
      const fullUrl = fileUrl.startsWith('http') 
        ? fileUrl 
        : `http://localhost:5000${fileUrl}`;

      console.log('Full download URL:', fullUrl);

      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = fullUrl;
      
      // Set the download attribute with a proper filename
      const extension = fileUrl.split('.').pop() || 'pdf';
      const downloadFileName = fileName.includes('.') 
        ? fileName 
        : `${fileName}.${extension}`;
      
      link.setAttribute('download', downloadFileName);
      link.setAttribute('target', '_blank');
      
      // Add authorization header by creating a fetch request instead
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
      link.href = blobUrl;
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up blob URL
      window.URL.revokeObjectURL(blobUrl);
      
    } catch (err) {
      console.error('Download error:', err);
      setError(`Error downloading ${fileType}. The file may not exist or you may not have permission to access it.`);
    } finally {
      setDownloadingFile('');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading application details...</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow-md rounded-lg p-6 md:p-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Application Not Found</h1>
              {error && <p className="text-red-500 mb-6">{error}</p>}
              <p className="text-gray-500 mb-6">
                The application you're looking for doesn't exist or you don't have permission to view it.
              </p>
              <Link 
                to={userRole === 'employer' ? '/dashboard/employer' : '/dashboard/seeker'} 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 text-white p-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold">Application Details</h1>
                {application.job && (
                  <div className="mt-2">
                    <p className="text-xl">{application.job.title}</p>
                    <p className="text-blue-100">{application.job.company}</p>
                    <div className="flex items-center mt-1 text-sm text-blue-100">
                      <i className="fas fa-map-marker-alt mr-1"></i>
                      <span>{application.job.location}</span>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                  {application.status.charAt(0).toUpperCase() + application.status.slice(1).replace('-', ' ')}
                </span>
              </div>
            </div>
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
            
            {/* Application Details */}
            <div className="space-y-6">
              {/* Application Info */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Application Information</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Applied On</p>
                      <p className="font-medium">{formatDate(application.appliedAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Last Updated</p>
                      <p className="font-medium">{formatDate(application.updatedAt)}</p>
                    </div>
                    {application.expectedSalary && (
                      <div>
                        <p className="text-sm text-gray-500">Expected Salary</p>
                        <p className="font-medium">${application.expectedSalary.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                  {application.availableStartDate && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-500">Available Start Date</p>
                      <p className="font-medium">{formatDate(application.availableStartDate)}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Applicant Info - Visible to employers */}
              {userRole === 'employer' && application.applicant && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Applicant Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center mb-4">
                      <div className="bg-gray-200 rounded-full h-12 w-12 flex items-center justify-center mr-4">
                        {application.applicant.profilePhoto ? (
                          <img 
                            src={`http://localhost:5000${application.applicant.profilePhoto}`}
                            alt={application.applicant.name}
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        ) : (
                          <i className="fas fa-user text-gray-500"></i>
                        )}
                      </div>
                      <div>
                        <h4 className="text-lg font-medium">{application.applicant.name}</h4>
                        <p className="text-gray-600">{application.applicant.email}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {application.applicant.phone && (
                        <div>
                          <p className="text-sm text-gray-500">Phone</p>
                          <p className="font-medium">{application.applicant.phone}</p>
                        </div>
                      )}
                      {application.applicant.location && (
                        <div>
                          <p className="text-sm text-gray-500">Location</p>
                          <p className="font-medium">{application.applicant.location}</p>
                        </div>
                      )}
                    </div>
                    
                    {application.applicant.skills && application.applicant.skills.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-500 mb-2">Skills</p>
                        <div className="flex flex-wrap gap-2">
                          {application.applicant.skills.map((skill, index) => (
                            <span 
                              key={index} 
                              className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {application.applicant.bio && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-500 mb-1">Bio</p>
                        <p>{application.applicant.bio}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Cover Letter */}
              {application.coverLetter && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Cover Letter</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="prose max-w-none">
                      {application.coverLetter.split('\n').map((paragraph, index) => (
                        <p key={index} className="mb-2">{paragraph}</p>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* File Downloads Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Resume */}
                {application.resume && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Resume</h3>
                    <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center">
                        <i className="fas fa-file-pdf text-red-500 text-2xl mr-3"></i>
                        <div>
                          <p className="font-medium">Resume.pdf</p>
                          <p className="text-sm text-gray-500">
                            {application.resume.includes('/applications/') 
                              ? 'Uploaded with application' 
                              : 'From user profile'
                            }
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => downloadFile(application.resume, 'resume', 'resume')}
                        disabled={downloadingFile === 'resume'}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        {downloadingFile === 'cover-letter' ? (
                          <>
                            <i className="fas fa-spinner fa-spin mr-2"></i> Downloading...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-download mr-2"></i> Download
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Information */}
              {application.additionalInfo && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p>{application.additionalInfo}</p>
                  </div>
                </div>
              )}

              {/* Portfolio Links */}
              {application.portfolioLinks && application.portfolioLinks.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Portfolio Links</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-2">
                      {application.portfolioLinks.map((link, index) => (
                        <div key={index} className="flex items-center">
                          <i className="fas fa-external-link-alt text-blue-500 mr-2"></i>
                          <a 
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {link.name}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Employer Notes - Visible to employers */}
              {userRole === 'employer' && application.employerNotes && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Internal Notes</h3>
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <p>{application.employerNotes}</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Actions */}
            <div className="mt-8 flex justify-between items-center">
              <Link
                to={userRole === 'employer' ? '/dashboard/employer?tab=applications' : '/dashboard/seeker?tab=applications'}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Back to Applications
              </Link>
              
              <div className="flex space-x-2">
                {/* Employer Actions */}
                {userRole === 'employer' && (
                  <>
                    {application.status !== 'reviewing' && (
                      <button
                        onClick={() => updateApplicationStatus('reviewing')}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        Mark as Reviewing
                      </button>
                    )}
                    {application.status !== 'shortlisted' && application.status !== 'accepted' && (
                      <button
                        onClick={() => updateApplicationStatus('shortlisted')}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                      >
                        Shortlist
                      </button>
                    )}
                    {application.status !== 'accepted' && (
                      <button
                        onClick={() => updateApplicationStatus('accepted')}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                      >
                        Accept
                      </button>
                    )}
                    {application.status !== 'rejected' && application.status !== 'accepted' && (
                      <button
                        onClick={() => updateApplicationStatus('rejected')}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                      >
                        Reject
                      </button>
                    )}
                  </>
                )}
                
                {/* Job Seeker Actions */}
                {userRole === 'jobseeker' && ['pending', 'reviewing'].includes(application.status) && (
                  <button
                    onClick={handleWithdrawApplication}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                  >
                    <i className="fas fa-times mr-2"></i>
                    Withdraw Application
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetailPage; 