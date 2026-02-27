// src/pages/EditJobPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const EditJobPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    company: '',
    location: '',
    jobType: 'Full-time',
    experience: 'Entry-level',
    skills: [],
    salary: {
      min: '',
      max: '',
      currency: 'USD'
    },
    applicationDeadline: '',
    contactEmail: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [skillInput, setSkillInput] = useState('');

  // Fetch job details
  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          setError('You must be logged in to edit a job');
          setLoading(false);
          return;
        }

        const config = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        };

        const response = await axios.get(`http://localhost:5000/api/jobs/${id}`, config);
        
        if (response.data.success) {
          const job = response.data.data;
          
          // Format the application deadline if it exists
          let formattedDeadline = '';
          if (job.applicationDeadline) {
            const date = new Date(job.applicationDeadline);
            formattedDeadline = date.toISOString().split('T')[0];
          }
          
          setFormData({
            title: job.title || '',
            description: job.description || '',
            company: job.company || '',
            location: job.location || '',
            jobType: job.jobType || 'Full-time',
            experience: job.experience || 'Entry-level',
            skills: job.skills || [],
            salary: {
              min: job.salary?.min || '',
              max: job.salary?.max || '',
              currency: job.salary?.currency || 'USD'
            },
            applicationDeadline: formattedDeadline,
            contactEmail: job.contactEmail || ''
          });
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Error fetching job details. Please try again.');
        
        // If unauthorized, redirect to dashboard
        if (err.response?.status === 401 || err.response?.status === 403) {
          navigate('http://localhost:5000/dashboard/employer');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [id, navigate]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'salaryMin' || name === 'salaryMax') {
      setFormData({
        ...formData,
        salary: {
          ...formData.salary,
          [name === 'salaryMin' ? 'min' : 'max']: value !== '' ? Number(value) : ''
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // Handle skills input
  const handleSkillInputChange = (e) => {
    setSkillInput(e.target.value);
  };

  // Add a skill
  const addSkill = () => {
    if (skillInput.trim() !== '' && !formData.skills.includes(skillInput.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, skillInput.trim()]
      });
      setSkillInput('');
    }
  };

  // Remove a skill
  const removeSkill = (skillToRemove) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(skill => skill !== skillToRemove)
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('You must be logged in to update a job');
        setSubmitting(false);
        return;
      }

      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      };

      const response = await axios.put(`http://localhost:5000/api/jobs/${id}`, formData, config);
      
      setSubmitting(false);
      
      if (response.data.success) {
        navigate('/dashboard/employer');
      }
    } catch (err) {
      setSubmitting(false);
      setError(err.response?.data?.message || 'Error updating job. Please try again.');
    }
  };

  // Handle job deletion
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('You must be logged in to delete a job');
        return;
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      const response = await axios.delete(`http://localhost:5000/api/jobs/${id}`, config);
      
      if (response.data.success) {
        navigate('/dashboard/employer');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error deleting job. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-md rounded-lg p-6 md:p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Edit Job</h1>
            <button
              onClick={handleDelete}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              <i className="fas fa-trash-alt mr-2"></i> Delete Job
            </button>
          </div>
          
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
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Job Information */}
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-6">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Job Title*
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="title"
                    id="title"
                    required
                    value={formData.title}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                  Company*
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="company"
                    id="company"
                    required
                    value={formData.company}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                  Location*
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="location"
                    id="location"
                    required
                    value={formData.location}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="jobType" className="block text-sm font-medium text-gray-700">
                  Job Type*
                </label>
                <div className="mt-1">
                  <select
                    id="jobType"
                    name="jobType"
                    required
                    value={formData.jobType}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="experience" className="block text-sm font-medium text-gray-700">
                  Experience Level*
                </label>
                <div className="mt-1">
                  <select
                    id="experience"
                    name="experience"
                    required
                    value={formData.experience}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="Entry-level">Entry-level</option>
                    <option value="Mid-level">Mid-level</option>
                    <option value="Senior">Senior</option>
                    <option value="Executive">Executive</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Job Description*
                </label>
                <div className="mt-1">
                  <textarea
                    id="description"
                    name="description"
                    rows={8}
                    required
                    value={formData.description}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Describe the role, responsibilities, requirements, benefits, etc."
                  />
                </div>
              </div>

              {/* Skills */}
              <div className="sm:col-span-6">
                <label htmlFor="skills" className="block text-sm font-medium text-gray-700">
                  Required Skills*
                </label>
                <div className="mt-1 flex">
                  <input
                    type="text"
                    id="skills"
                    value={skillInput}
                    onChange={handleSkillInputChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-l-md"
                    placeholder="e.g. JavaScript, React, etc."
                  />
                  <button
                    type="button"
                    onClick={addSkill}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.skills.map((skill, index) => (
                    <div key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center">
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="ml-1 text-blue-500 hover:text-blue-700"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Salary Range */}
              <div className="sm:col-span-3">
                <label htmlFor="salaryMin" className="block text-sm font-medium text-gray-700">
                  Minimum Salary
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="salaryMin"
                    id="salaryMin"
                    min="0"
                    value={formData.salary.min}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="salaryMax" className="block text-sm font-medium text-gray-700">
                  Maximum Salary
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="salaryMax"
                    id="salaryMax"
                    min="0"
                    value={formData.salary.max}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              {/* Additional Info */}
              <div className="sm:col-span-3">
                <label htmlFor="applicationDeadline" className="block text-sm font-medium text-gray-700">
                  Application Deadline
                </label>
                <div className="mt-1">
                  <input
                    type="date"
                    name="applicationDeadline"
                    id="applicationDeadline"
                    value={formData.applicationDeadline}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700">
                  Contact Email
                </label>
                <div className="mt-1">
                  <input
                    type="email"
                    name="contactEmail"
                    id="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"/>
                    </div>
                  </div>
                </div>
    
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard/employer')}
                    className="mr-3 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || formData.skills.length === 0}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      );
    };
    
    export default EditJobPage;