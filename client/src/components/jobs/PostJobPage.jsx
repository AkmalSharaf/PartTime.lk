import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const PostJobPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    company: '',
    location: '',
    jobType: 'Full-time',
    experience: 'Entry-level',
    industry: 'Software',
    skills: [],
    salary: {
      min: '',
      max: '',
      currency: 'USD'
    },
    requirements: [],
    responsibilities: [],
    benefits: [],
    applicationDeadline: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [requirementInput, setRequirementInput] = useState('');
  const [responsibilityInput, setResponsibilityInput] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'salaryMin') {
      setFormData({
        ...formData,
        salary: {
          ...formData.salary,
          min: value !== '' ? Number(value) : ''
        }
      });
    } else if (name === 'salaryMax') {
      setFormData({
        ...formData,
        salary: {
          ...formData.salary,
          max: value !== '' ? Number(value) : ''
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const addSkill = () => {
    if (skillInput.trim() !== '' && !formData.skills.includes(skillInput.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, skillInput.trim()]
      });
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(skill => skill !== skillToRemove)
    });
  };

  const addRequirement = () => {
    if (requirementInput.trim() !== '' && !formData.requirements.includes(requirementInput.trim())) {
      setFormData({
        ...formData,
        requirements: [...formData.requirements, requirementInput.trim()]
      });
      setRequirementInput('');
    }
  };

  const removeRequirement = (item) => {
    setFormData({
      ...formData,
      requirements: formData.requirements.filter(req => req !== item)
    });
  };

  const addResponsibility = () => {
    if (responsibilityInput.trim() !== '' && !formData.responsibilities.includes(responsibilityInput.trim())) {
      setFormData({
        ...formData,
        responsibilities: [...formData.responsibilities, responsibilityInput.trim()]
      });
      setResponsibilityInput('');
    }
  };

  const removeResponsibility = (item) => {
    setFormData({
      ...formData,
      responsibilities: formData.responsibilities.filter(resp => resp !== item)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('You must be logged in to post a job');
        setLoading(false);
        return;
      }

      // Validate required fields
      if (!formData.title || !formData.description || !formData.company || !formData.location) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      if (formData.skills.length === 0) {
        setError('Please add at least one skill requirement');
        setLoading(false);
        return;
      }

      // Prepare the job data exactly as the backend expects
      const jobData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        company: formData.company.trim(),
        location: formData.location.trim(),
        jobType: formData.jobType,
        experience: formData.experience,
        industry: formData.industry,
        skills: formData.skills, // Array of strings
        requirements: formData.requirements, // Array of strings
        responsibilities: formData.responsibilities, // Array of strings
        benefits: formData.benefits // Array of strings
      };

      // Only add salary if minimum is provided
      if (formData.salary.min && formData.salary.min > 0) {
        jobData.salary = {
          min: Number(formData.salary.min),
          currency: formData.salary.currency
        };
        
        // Add max salary if provided
        if (formData.salary.max && formData.salary.max > 0) {
          jobData.salary.max = Number(formData.salary.max);
        }
      }

      // Add application deadline if provided
      if (formData.applicationDeadline) {
        jobData.applicationDeadline = formData.applicationDeadline;
      }

      console.log('Sending job data:', jobData);

      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      };

      const response = await axios.post('http://localhost:5000/api/jobs', jobData, config);
      
      if (response.data.success) {
        alert('Job posted successfully!');
        navigate('/dashboard/employer');
      }
    } catch (err) {
      console.error('Full error:', err);
      console.error('Response data:', err.response?.data);
      
      let errorMessage = 'Error posting job. Please try again.';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.errors) {
        errorMessage = Array.isArray(err.response.data.errors) 
          ? err.response.data.errors.join(', ')
          : err.response.data.errors;
      } else if (err.response?.status === 400) {
        errorMessage = 'Invalid job data. Please check all fields and try again.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-md rounded-lg p-6 md:p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Post a New Job</h1>
          
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
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
                  Job Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  id="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  placeholder="e.g. Senior Software Engineer"
                />
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                  Company <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="company"
                  id="company"
                  required
                  value={formData.company}
                  onChange={handleChange}
                  className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  placeholder="Company name"
                />
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="location"
                  id="location"
                  required
                  value={formData.location}
                  onChange={handleChange}
                  className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  placeholder="e.g. New York, NY or Remote"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="jobType" className="block text-sm font-medium text-gray-700">
                  Job Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="jobType"
                  name="jobType"
                  value={formData.jobType}
                  onChange={handleChange}
                  className="mt-1 block w-full focus:ring-blue-500 focus:border-blue-500 shadow-sm sm:text-sm border-gray-300 rounded-md"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                  <option value="Remote">Remote</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="experience" className="block text-sm font-medium text-gray-700">
                  Experience Level <span className="text-red-500">*</span>
                </label>
                <select
                  id="experience"
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  className="mt-1 block w-full focus:ring-blue-500 focus:border-blue-500 shadow-sm sm:text-sm border-gray-300 rounded-md"
                >
                  <option value="Entry-level">Entry-level</option>
                  <option value="Mid-level">Mid-level</option>
                  <option value="Senior">Senior</option>
                  <option value="Executive">Executive</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="industry" className="block text-sm font-medium text-gray-700">
                  Industry <span className="text-red-500">*</span>
                </label>
                <select
                  id="industry"
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  className="mt-1 block w-full focus:ring-blue-500 focus:border-blue-500 shadow-sm sm:text-sm border-gray-300 rounded-md"
                >
                  <option value="Software">Software</option>
                  <option value="Hardware">Hardware</option>
                  <option value="Fintech">Fintech</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="E-commerce">E-commerce</option>
                  <option value="Education">Education</option>
                  <option value="Media">Media</option>
                  <option value="Gaming">Gaming</option>
                  <option value="AI/ML">AI/ML</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Sales">Sales</option>
                  <option value="Finance">Finance</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Job Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={6}
                  required
                  value={formData.description}
                  onChange={handleChange}
                  className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  placeholder="Describe the role, company culture, what you're looking for in a candidate..."
                />
              </div>

              {/* Skills Section */}
              <div className="sm:col-span-6">
                <label className="block text-sm font-medium text-gray-700">
                  Required Skills <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    className="flex-1 focus:ring-blue-500 focus:border-blue-500 block w-full min-w-0 rounded-none rounded-l-md sm:text-sm border-gray-300"
                    placeholder="e.g. JavaScript, React, Node.js"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  />
                  <button
                    type="button"
                    onClick={addSkill}
                    className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 text-sm hover:bg-gray-100"
                  >
                    Add
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.skills.map((skill, index) => (
                    <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="flex-shrink-0 ml-1.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-blue-400 hover:bg-blue-200 hover:text-blue-500 focus:outline-none focus:bg-blue-500 focus:text-white"
                      >
                        <span className="sr-only">Remove skill</span>
                        <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                          <path strokeLinecap="round" strokeWidth="1.5" d="m1 1 6 6m0-6-6 6" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
                {formData.skills.length === 0 && (
                  <p className="mt-1 text-sm text-red-600">Please add at least one skill</p>
                )}
              </div>

              {/* Requirements Section */}
              <div className="sm:col-span-6">
                <label className="block text-sm font-medium text-gray-700">
                  Requirements
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="text"
                    value={requirementInput}
                    onChange={(e) => setRequirementInput(e.target.value)}
                    className="flex-1 focus:ring-blue-500 focus:border-blue-500 block w-full min-w-0 rounded-none rounded-l-md sm:text-sm border-gray-300"
                    placeholder="e.g. Bachelor's degree in Computer Science"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                  />
                  <button
                    type="button"
                    onClick={addRequirement}
                    className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 text-sm hover:bg-gray-100"
                  >
                    Add
                  </button>
                </div>
                <div className="mt-2 space-y-1">
                  {formData.requirements.map((req, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md">
                      <span className="text-sm text-gray-700">{req}</span>
                      <button
                        type="button"
                        onClick={() => removeRequirement(req)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Responsibilities Section */}
              <div className="sm:col-span-6">
                <label className="block text-sm font-medium text-gray-700">
                  Responsibilities
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="text"
                    value={responsibilityInput}
                    onChange={(e) => setResponsibilityInput(e.target.value)}
                    className="flex-1 focus:ring-blue-500 focus:border-blue-500 block w-full min-w-0 rounded-none rounded-l-md sm:text-sm border-gray-300"
                    placeholder="e.g. Develop and maintain web applications"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addResponsibility())}
                  />
                  <button
                    type="button"
                    onClick={addResponsibility}
                    className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 text-sm hover:bg-gray-100"
                  >
                    Add
                  </button>
                </div>
                <div className="mt-2 space-y-1">
                  {formData.responsibilities.map((resp, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md">
                      <span className="text-sm text-gray-700">{resp}</span>
                      <button
                        type="button"
                        onClick={() => removeResponsibility(resp)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Salary Range */}
              <div className="sm:col-span-3">
                <label htmlFor="salaryMin" className="block text-sm font-medium text-gray-700">
                  Minimum Salary (USD)
                </label>
                <input
                  type="number"
                  name="salaryMin"
                  id="salaryMin"
                  min="0"
                  step="1000"
                  value={formData.salary.min}
                  onChange={handleChange}
                  className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  placeholder="50000"
                />
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="salaryMax" className="block text-sm font-medium text-gray-700">
                  Maximum Salary (USD)
                </label>
                <input
                  type="number"
                  name="salaryMax"
                  id="salaryMax"
                  min="0"
                  step="1000"
                  value={formData.salary.max}
                  onChange={handleChange}
                  className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  placeholder="80000"
                />
              </div>

              {/* Application Deadline */}
              <div className="sm:col-span-3">
                <label htmlFor="applicationDeadline" className="block text-sm font-medium text-gray-700">
                  Application Deadline
                </label>
                <input
                  type="date"
                  name="applicationDeadline"
                  id="applicationDeadline"
                  value={formData.applicationDeadline}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || formData.skills.length === 0}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Posting...
                  </>
                ) : (
                  'Post Job'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PostJobPage;