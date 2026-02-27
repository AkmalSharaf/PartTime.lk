// src/pages/JobApplyPage.jsx - Fixed file upload version
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const JobApplyPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    coverLetter: '',
    resume: null,
    coverLetterFile: null,
    additionalInfo: '',
    expectedSalary: '',
    availableStartDate: '',
    portfolioLinks: [{ name: '', url: '' }]
  });
  const [filePreviews, setFilePreviews] = useState({});

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!storedUser || !token) {
      navigate(`/login?redirect=/jobs/${id}/apply`);
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    
    if (parsedUser.role !== 'jobseeker') {
      setError('Only job seekers can apply for jobs');
      setLoading(false);
      return;
    }

    fetchJobDetails(token);
  }, [id, navigate]);

  const fetchJobDetails = async (token) => {
    try {
      const jobResponse = await axios.get(`http://localhost:5000/api/jobs/${id}`);
      
      if (jobResponse.data.success) {
        setJob(jobResponse.data.data);
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      const applicationsResponse = await axios.get('http://localhost:5000/api/applications/me', config);
      
      if (applicationsResponse.data.success) {
        const hasApplied = applicationsResponse.data.data.some(
          application => application.job?._id === id
        );

        if (hasApplied) {
          setError('You have already applied for this job');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching job details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleFileChange = (e) => {
    const { name } = e.target;
    const file = e.target.files[0];
    
    console.log('File selected:', { name, file: file ? file.name : 'none' });
    
    if (file) {
      // Validate file type
      if (name === 'resume') {
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(file.type)) {
          setError('Please select a PDF, DOC, or DOCX file for resume');
          e.target.value = ''; // Reset input
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          setError('Resume file size must be less than 5MB');
          e.target.value = ''; // Reset input
          return;
        }
      } else if (name === 'coverLetterFile') {
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
        if (!allowedTypes.includes(file.type)) {
          setError('Please select a PDF, DOC, DOCX, or TXT file for cover letter');
          e.target.value = ''; // Reset input
          return;
        }
        if (file.size > 2 * 1024 * 1024) {
          setError('Cover letter file size must be less than 2MB');
          e.target.value = ''; // Reset input
          return;
        }
      }
      
      setError('');
      setFormData({
        ...formData,
        [name]: file
      });
      
      // Create file preview
      setFilePreviews({
        ...filePreviews,
        [name]: {
          name: file.name,
          size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
          type: file.type
        }
      });
    }
  };

  const handlePortfolioChange = (index, field, value) => {
    const newPortfolioLinks = [...formData.portfolioLinks];
    newPortfolioLinks[index] = { ...newPortfolioLinks[index], [field]: value };
    setFormData({ ...formData, portfolioLinks: newPortfolioLinks });
  };

  const addPortfolioLink = () => {
    setFormData({
      ...formData,
      portfolioLinks: [...formData.portfolioLinks, { name: '', url: '' }]
    });
  };

  const removePortfolioLink = (index) => {
    const newPortfolioLinks = formData.portfolioLinks.filter((_, i) => i !== index);
    setFormData({ ...formData, portfolioLinks: newPortfolioLinks });
  };

  const validateForm = () => {
    // Check if cover letter (text or file) is provided
    if (!formData.coverLetter.trim() && !formData.coverLetterFile) {
      setError('Please provide a cover letter (either text or file)');
      return false;
    }

    // Check if resume is provided
    if (!formData.resume) {
      setError('Please upload your resume');
      return false;
    }

    // Validate available start date
    if (formData.availableStartDate) {
      const startDate = new Date(formData.availableStartDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (startDate < today) {
        setError('Available start date cannot be in the past');
        return false;
      }
    }

    // Validate expected salary
    if (formData.expectedSalary && (isNaN(Number(formData.expectedSalary)) || Number(formData.expectedSalary) < 0)) {
      setError('Expected salary must be a valid positive number');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setError('');
    setUploadProgress(0);

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('You must be logged in to apply for a job');
        setSubmitting(false);
        return;
      }

      // Create FormData for file upload
      const applicationFormData = new FormData();
      
      console.log('Creating FormData with:', {
        coverLetter: formData.coverLetter,
        additionalInfo: formData.additionalInfo,
        expectedSalary: formData.expectedSalary,
        availableStartDate: formData.availableStartDate,
        resumeFile: formData.resume ? formData.resume.name : 'none',
        coverLetterFile: formData.coverLetterFile ? formData.coverLetterFile.name : 'none'
      });
      
      // Add text fields
      applicationFormData.append('coverLetter', formData.coverLetter);
      applicationFormData.append('additionalInfo', formData.additionalInfo);
      
      if (formData.expectedSalary) {
        applicationFormData.append('expectedSalary', formData.expectedSalary);
      }
      
      if (formData.availableStartDate) {
        applicationFormData.append('availableStartDate', formData.availableStartDate);
      }

      // Add portfolio links (filter out empty ones)
      const validPortfolioLinks = formData.portfolioLinks.filter(
        link => link.name.trim() && link.url.trim()
      );
      if (validPortfolioLinks.length > 0) {
        applicationFormData.append('portfolioLinks', JSON.stringify(validPortfolioLinks));
      }

      // Add files with proper field names
      if (formData.resume) {
        console.log('Adding resume file:', formData.resume.name, formData.resume.type, formData.resume.size);
        applicationFormData.append('resume', formData.resume, formData.resume.name);
      }
      
      if (formData.coverLetterFile) {
        console.log('Adding cover letter file:', formData.coverLetterFile.name, formData.coverLetterFile.type, formData.coverLetterFile.size);
        applicationFormData.append('coverLetterFile', formData.coverLetterFile, formData.coverLetterFile.name);
      }

      // Log FormData contents for debugging
      console.log('FormData entries:');
      for (let [key, value] of applicationFormData.entries()) {
        console.log(key, value instanceof File ? `File: ${value.name}` : value);
      }

      // Use axios with proper config for file upload
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          setUploadProgress(progress);
        }
      };

      const response = await axios.post(
        `http://localhost:5000/api/applications/${id}`,
        applicationFormData,
        config
      );

      if (response.data.success) {
        navigate('/dashboard/seeker?tab=applications&status=applied', {
          state: { message: 'Application submitted successfully!' }
        });
      } else {
        setError(response.data.message || 'Error submitting application. Please try again.');
      }

    } catch (err) {
      console.error('Application submission error:', err);
      setError(err.response?.data?.message || 'Error submitting application. Please try again.');
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  const removeFile = (fieldName) => {
    setFormData({
      ...formData,
      [fieldName]: null
    });
    
    setFilePreviews({
      ...filePreviews,
      [fieldName]: null
    });
    
    // Reset the file input
    const fileInput = document.querySelector(`input[name="${fieldName}"]`);
    if (fileInput) {
      fileInput.value = '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading job details...</p>
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
            <h1 className="text-2xl font-bold">Apply for Position</h1>
            {job && (
              <div className="mt-2">
                <p className="text-xl">{job.title}</p>
                <p className="text-blue-100">{job.company}</p>
                <div className="flex items-center mt-1 text-sm text-blue-100">
                  <i className="fas fa-map-marker-alt mr-1"></i>
                  <span>{job.location}</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Content */}
          <div className="p-6">
            {error && !submitting ? (
              <div className="text-center">
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
                
                {error === 'You have already applied for this job' && (
                  <div className="mt-6">
                    <button
                      onClick={() => navigate(`/jobs/${id}`)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Back to Job Details
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6" encType="multipart/form-data">
                {/* Error display for form errors */}
                {error && submitting && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {/* Cover Letter Text */}
                <div>
                  <label htmlFor="coverLetter" className="block text-sm font-medium text-gray-700">
                    Cover Letter
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="coverLetter"
                      name="coverLetter"
                      rows={8}
                      value={formData.coverLetter}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Introduce yourself and explain why you're a good fit for this position..."
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.coverLetter.length}/2000 characters
                  </p>
                </div>

                {/* Cover Letter File Upload */}
                {/* <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Cover Letter File (Optional)
                  </label>
                  <div className="mt-1">
                    {!formData.coverLetterFile ? (
                      <div className="flex items-center justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-blue-400 transition-colors">
                        <div className="space-y-1 text-center">
                          <i className="fas fa-file-text text-gray-400 text-3xl"></i>
                          <div className="flex text-sm text-gray-600">
                            <label
                              htmlFor="coverLetterFile"
                              className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500"
                            >
                              <span>Upload cover letter file</span>
                              <input 
                                id="coverLetterFile" 
                                name="coverLetterFile" 
                                type="file" 
                                className="sr-only" 
                                onChange={handleFileChange}
                                accept=".pdf,.doc,.docx,.txt"
                              />
                            </label>
                          </div>
                          <p className="text-xs text-gray-500">PDF, DOC, DOCX, TXT up to 2MB</p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-md p-4 flex items-center justify-between">
                        <div className="flex items-center">
                          <i className="fas fa-file-text text-blue-500 mr-3"></i>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{filePreviews.coverLetterFile?.name}</p>
                            <p className="text-xs text-gray-500">{filePreviews.coverLetterFile?.size}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile('coverLetterFile')}
                          className="text-red-600 hover:text-red-800"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    )}
                  </div>
                </div> */}

                {/* Resume Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Resume* <span className="text-red-500">Required</span>
                  </label>
                  <div className="mt-1">
                    {!formData.resume ? (
                      <div className="flex items-center justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-blue-400 transition-colors">
                        <div className="space-y-1 text-center">
                          <i className="fas fa-file-upload text-gray-400 text-3xl"></i>
                          <div className="flex text-sm text-gray-600">
                            <label
                              htmlFor="resume"
                              className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500"
                            >
                              <span>Upload resume</span>
                              <input 
                                id="resume" 
                                name="resume" 
                                type="file" 
                                className="sr-only" 
                                onChange={handleFileChange}
                                accept=".pdf,.doc,.docx"
                                required
                              />
                            </label>
                          </div>
                          <p className="text-xs text-gray-500">PDF, DOC, DOCX up to 5MB</p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-md p-4 flex items-center justify-between">
                        <div className="flex items-center">
                          <i className="fas fa-file-pdf text-red-500 mr-3"></i>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{filePreviews.resume?.name}</p>
                            <p className="text-xs text-gray-500">{filePreviews.resume?.size}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile('resume')}
                          className="text-red-600 hover:text-red-800"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Your profile information will also be sent to the employer.
                  </p>
                </div>

                {/* Additional Information */}
                <div>
                  <label htmlFor="additionalInfo" className="block text-sm font-medium text-gray-700">
                    Additional Information
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="additionalInfo"
                      name="additionalInfo"
                      rows={4}
                      value={formData.additionalInfo}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Any additional information you'd like to share..."
                    />
                  </div>
                </div>

                {/* Expected Salary and Start Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="expectedSalary" className="block text-sm font-medium text-gray-700">
                      Expected Salary (Rs)
                    </label>
                    <div className="mt-1">
                      <input
                        type="number"
                        id="expectedSalary"
                        name="expectedSalary"
                        min="0"
                        step="1000"
                        value={formData.expectedSalary}
                        onChange={handleChange}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="60000"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="availableStartDate" className="block text-sm font-medium text-gray-700">
                      Available Start Date
                    </label>
                    <div className="mt-1">
                      <input
                        type="date"
                        id="availableStartDate"
                        name="availableStartDate"
                        value={formData.availableStartDate}
                        onChange={handleChange}
                        min={new Date().toISOString().split('T')[0]}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>

                {/* Portfolio Links */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Portfolio Links
                  </label>
                  {formData.portfolioLinks.map((link, index) => (
                    <div key={index} className="flex gap-3 mb-3">
                      <input
                        type="text"
                        placeholder="Link name (e.g., GitHub, Portfolio)"
                        value={link.name}
                        onChange={(e) => handlePortfolioChange(index, 'name', e.target.value)}
                        className="flex-1 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                      <input
                        type="url"
                        placeholder="https://..."
                        value={link.url}
                        onChange={(e) => handlePortfolioChange(index, 'url', e.target.value)}
                        className="flex-2 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                      {formData.portfolioLinks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePortfolioLink(index)}
                          className="text-red-600 hover:text-red-800 px-2"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addPortfolioLink}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    <i className="fas fa-plus mr-1"></i> Add Portfolio Link
                  </button>
                </div>

                {/* Progress Bar */}
                {submitting && uploadProgress > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-900">Submitting Application</span>
                      <span className="text-sm text-blue-600">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-blue-700 mt-1">
                      Please don't close this window while uploading...
                    </p>
                  </div>
                )}

                {/* Submit Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => navigate(`/jobs/${id}`)}
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !formData.resume}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Submitting Application...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane mr-2"></i>
                        Submit Application
                      </>
                    )}
                  </button>
                </div>

                {/* Form Requirements Notice */}
                <div className="bg-gray-50 rounded-md p-4 text-sm text-gray-600">
                  <h4 className="font-medium text-gray-900 mb-2">Before submitting:</h4>
                  <ul className="space-y-1">
                    <li className="flex items-center">
                      <i className={`fas fa-check-circle mr-2 ${formData.resume ? 'text-green-500' : 'text-gray-400'}`}></i>
                      Resume uploaded (required)
                    </li>
                    <li className="flex items-center">
                      <i className={`fas fa-check-circle mr-2 ${formData.coverLetter.trim() || formData.coverLetterFile ? 'text-green-500' : 'text-gray-400'}`}></i>
                      Cover letter provided (text or file)
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-info-circle mr-2 text-blue-500"></i>
                      Your profile information will be shared with the employer
                    </li>
                  </ul>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobApplyPage;