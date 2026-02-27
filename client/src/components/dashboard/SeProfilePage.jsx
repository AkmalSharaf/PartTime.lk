// src/components/profile/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showExpForm, setShowExpForm] = useState(false);
  const [showEduForm, setShowEduForm] = useState(false);
  const [experience, setExperience] = useState({
    title: '',
    company: '',
    location: '',
    from: '',
    to: '',
    current: false,
    description: ''
  });
  const [education, setEducation] = useState({
    school: '',
    degree: '',
    fieldOfStudy: '',
    from: '',
    to: '',
    current: false,
    description: ''
  });
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!storedUser || !token) {
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

    // Fetch user profile data
    fetchProfileData(token);
  }, [navigate]);

  const fetchProfileData = async (token) => {
    setLoading(true);
    try {
      // Configure axios headers with token
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      // Fetch user profile
      const profileResponse = await axios.get('http://localhost:5000/api/users/profile', config);
      setUser(profileResponse.data.data);
      
      // Set image preview if user has a profile image
      if (profileResponse.data.data.profileImage) {
        setImagePreview(`http://localhost:5000/${profileResponse.data.data.profileImage}`);
      }
    } catch (err) {
      console.error('Error fetching profile data:', err);
      setError('Failed to load profile data. Please try again.');
      
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

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      
      // Create FormData object for file upload
      const formData = new FormData();
      
      // Get form data
      const name = e.target.name.value;
      const email = e.target.email.value;
      const phone = e.target.phone.value;
      const location = e.target.location.value;
      const bio = e.target.bio.value;
      const skills = e.target.skills.value.split(',').map(skill => skill.trim()).filter(skill => skill);
      
      // Append text data to formData
      formData.append('name', name);
      formData.append('email', email);
      formData.append('phone', phone);
      formData.append('location', location);
      formData.append('bio', bio);
      formData.append('skills', JSON.stringify(skills));
      
      // Append profile image if uploaded
      if (profileImage) {
        formData.append('profileImage', profileImage);
      }
      
      // Configure headers
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      };
      
      // Send update request
      const response = await axios.put('http://localhost:5000/api/users/profile', formData, config);
      
      // Update local user data
      const updatedUser = response.data.data;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExperience = async (e) => {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      
      // Configure headers
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      // Send add experience request
      const response = await axios.put(
        'http://localhost:5000/api/users/experience', 
        experience,
        config
      );
      
      // Update user data
      setUser(response.data.data);
      
      // Reset form and hide it
      setExperience({
        title: '',
        company: '',
        location: '',
        from: '',
        to: '',
        current: false,
        description: ''
      });
      setShowExpForm(false);
      
      setSuccessMessage('Experience added successfully!');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('Error adding experience:', err);
      setError('Failed to add experience. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEducation = async (e) => {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      
      // Configure headers
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      // Send add education request
      const response = await axios.put(
        'http://localhost:5000/api/users/education', 
        education,
        config
      );
      
      // Update user data
      setUser(response.data.data);
      
      // Reset form and hide it
      setEducation({
        school: '',
        degree: '',
        fieldOfStudy: '',
        from: '',
        to: '',
        current: false,
        description: ''
      });
      setShowEduForm(false);
      
      setSuccessMessage('Education added successfully!');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('Error adding education:', err);
      setError('Failed to add education. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExperience = async (expId) => {
    if (!window.confirm('Are you sure you want to delete this experience?')) {
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      
      // Configure headers
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      // Send delete experience request
      const response = await axios.delete(
        `http://localhost:5000/api/users/experience/${expId}`,
        config
      );
      
      // Update user data
      setUser(response.data.data);
      
      setSuccessMessage('Experience deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('Error deleting experience:', err);
      setError('Failed to delete experience. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEducation = async (eduId) => {
    if (!window.confirm('Are you sure you want to delete this education?')) {
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      
      // Configure headers
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      // Send delete education request
      const response = await axios.delete(
        `http://localhost:5000/api/users/education/${eduId}`,
        config
      );
      
      // Update user data
      setUser(response.data.data);
      
      setSuccessMessage('Education deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('Error deleting education:', err);
      setError('Failed to delete education. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExperienceChange = (e) => {
    const { name, value } = e.target;
    setExperience(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEducationChange = (e) => {
    const { name, value } = e.target;
    setEducation(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCurrentChange = (e, formType) => {
    const { checked } = e.target;
    if (formType === 'experience') {
      setExperience(prev => ({
        ...prev,
        current: checked,
        to: checked ? '' : prev.to
      }));
    } else {
      setEducation(prev => ({
        ...prev,
        current: checked,
        to: checked ? '' : prev.to
      }));
    }
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      {/* <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Profile</h1>
        </div>
      </header> */}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Messages */}
        {successMessage && (
          <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <i className="fas fa-check-circle text-green-500"></i>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            </div>
          </div>
        )}
        
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

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">

          <div className="p-6">

            <form className="space-y-8" onSubmit={handleUpdateProfile}>
              {/* Profile Image */}
              <h4 className="text-2xl font-bold text-base space-y-8 text-gray-900">Your Profile</h4>

              {/* <div>
                <h4 className="text-base font-medium text-gray-900 mb-4">Profile Image</h4>
                <div className="flex items-center space-x-6">
                  <div className="flex-shrink-0">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Profile"
                        className="h-24 w-24 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center">
                        <i className="fas fa-user text-gray-400 text-3xl"></i>
                      </div>
                    )}
                  </div>
                  <label className="block">
                    <span className="sr-only">Choose profile photo</span>
                    <input 
                      type="file" 
                      accept="image/*"
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100"
                      onChange={handleProfileImageChange}
                    />
                  </label>
                </div>
              </div> */}

              {/* Personal Information */}
              <div>
                <h4 className="text-base font-medium text-gray-900 mb-4">Personal Information</h4>
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-3">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Full Name
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="name"
                        id="name"
                        defaultValue={user?.name || ''}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <div className="mt-1">
                      <input
                        type="email"
                        name="email"
                        id="email"
                        defaultValue={user?.email || ''}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="phone"
                        id="phone"
                        defaultValue={user?.phone || ''}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                      Location
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="location"
                        id="location"
                        defaultValue={user?.location || ''}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-6">
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                      Professional Summary
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="bio"
                        name="bio"
                        rows={4}
                        defaultValue={user?.bio || ''}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Brief description for your profile. This will be visible to employers.
                    </p>
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div>
                <h4 className="text-base font-medium text-gray-900 mb-4">Skills</h4>
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-6">
                    <label htmlFor="skills" className="block text-sm font-medium text-gray-700">
                      Skills (comma separated)
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="skills"
                        id="skills"
                        defaultValue={(user?.skills || []).join(', ')}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Add your technical and soft skills relevant to your job search.
                    </p>
                  </div>
                </div>
              </div>

              {/* Personal Information Submit Button */}
              <div className="flex justify-end">
                <button
                  type="button"
                  className="mr-3 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                  onClick={() => navigate('/dashboard/seeker')}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                >
                  Save
                </button>
              </div>
            </form>

            {/* Experience */}
            {/* <div className="mt-10 pt-10 border-t border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-base font-medium text-gray-900">Work Experience</h4>
                <button
                  type="button"
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
                  onClick={() => setShowExpForm(!showExpForm)}
                >
                  <i className="fas fa-plus mr-2"></i> Add Experience
                </button>
              </div>

              {showExpForm && (
                <form onSubmit={handleAddExperience} className="mb-6 bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                        Job Title
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="title"
                          id="title"
                          value={experience.title}
                          onChange={handleExperienceChange}
                          required
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                        Company
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="company"
                          id="company"
                          value={experience.company}
                          onChange={handleExperienceChange}
                          required
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                        Location
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="location"
                          id="exp-location"
                          value={experience.location}
                          onChange={handleExperienceChange}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="from" className="block text-sm font-medium text-gray-700">
                        From Date
                      </label>
                      <div className="mt-1">
                        <input
                          type="date"
                          name="from"
                          id="from"
                          value={experience.from}
                          onChange={handleExperienceChange}
                          required
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <div className="flex items-center">
                        <input
                          id="current-job"
                          name="current"
                          type="checkbox"
                          checked={experience.current}
                          onChange={(e) => handleCurrentChange(e, 'experience')}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="current-job" className="ml-2 block text-sm text-gray-700">
                          Current Job
                        </label>
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="to" className="block text-sm font-medium text-gray-700">
                        To Date
                      </label>
                      <div className="mt-1">
                        <input
                          type="date"
                          name="to"
                          id="to"
                          value={experience.to}
                          onChange={handleExperienceChange}
                          disabled={experience.current}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-6">
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Job Description
                      </label>
                      <div className="mt-1">
                        <textarea
                          id="description"
                          name="description"
                          rows={3}
                          value={experience.description}
                          onChange={handleExperienceChange}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowExpForm(false)}
                      className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                    >
                      Add Experience
                    </button>
                  </div>
                </form>
              )}

              {user?.experience && user.experience.length > 0 ? (
                <div className="space-y-4">
                  {user.experience.map((exp, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="text-gray-900 font-medium">{exp.title}</h5>
                          <p className="text-gray-600">{exp.company}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(exp.from).toLocaleDateString()} - {exp.current ? 'Present' : new Date(exp.to).toLocaleDateString()}
                            {exp.location && (
                              <>
                                <span className="mx-2">•</span>
                                {exp.location}
                              </>
                            )}
                          </p>
                          {exp.description && <p className="text-sm text-gray-700 mt-2">{exp.description}</p>}
                        </div>
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={() => handleDeleteExperience(exp._id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <i className="fas fa-trash-alt"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No work experience added yet. Add your work history to improve profile completeness.</p>
                </div>
              )}
            </div> */}

            {/* Education */}
            <div className="mt-10 pt-10 border-t border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-base font-medium text-gray-900">Education</h4>
                <button
                  type="button"
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
                  onClick={() => setShowEduForm(!showEduForm)}
                >
                  <i className="fas fa-plus mr-2"></i> Add Education
                </button>
              </div>

              {/* Education Form */}
              {showEduForm && (
                <form onSubmit={handleAddEducation} className="mb-6 bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                      <label htmlFor="school" className="block text-sm font-medium text-gray-700">
                        School/University
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="school"
                          id="school"
                          value={education.school}
                          onChange={handleEducationChange}
                          required
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="degree" className="block text-sm font-medium text-gray-700">
                        Degree
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="degree"
                          id="degree"
                          value={education.degree}
                          onChange={handleEducationChange}
                          required
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-6">
                      <label htmlFor="fieldOfStudy" className="block text-sm font-medium text-gray-700">
                        Field of Study
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="fieldOfStudy"
                          id="fieldOfStudy"
                          value={education.fieldOfStudy}
                          onChange={handleEducationChange}
                          required
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="from" className="block text-sm font-medium text-gray-700">
                        From Date
                      </label>
                      <div className="mt-1">
                        <input
                          type="date"
                          name="from"
                          id="edu-from"
                          value={education.from}
                          onChange={handleEducationChange}
                          required
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <div className="flex items-center">
                        <input
                          id="current-edu"
                          name="current"
                          type="checkbox"
                          checked={education.current}
                          onChange={(e) => handleCurrentChange(e, 'education')}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="current-edu" className="ml-2 block text-sm text-gray-700">
                          Currently Studying
                        </label>
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="to" className="block text-sm font-medium text-gray-700">
                        To Date
                      </label>
                      <div className="mt-1">
                        <input
                          type="date"
                          name="to"
                          id="edu-to"
                          value={education.to}
                          onChange={handleEducationChange}
                          disabled={education.current}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-6">
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <div className="mt-1">
                        <textarea
                          id="edu-description"
                          name="description"
                          rows={3}
                          value={education.description}
                          onChange={handleEducationChange}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowEduForm(false)}
                      className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                    >
                      Add Education
                    </button>
                  </div>
                </form>
              )}

              {/* Education List */}
              {user?.education && user.education.length > 0 ? (
                <div className="space-y-4">
                  {user.education.map((edu, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="text-gray-900 font-medium">{edu.school}</h5>
                          <p className="text-gray-600">{edu.degree} - {edu.fieldOfStudy}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(edu.from).toLocaleDateString()} - {edu.current ? 'Present' : new Date(edu.to).toLocaleDateString()}
                          </p>
                          {edu.description && <p className="text-sm text-gray-700 mt-2">{edu.description}</p>}
                        </div>
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={() => handleDeleteEducation(edu._id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <i className="fas fa-trash-alt"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No education added yet. Add your educational background to improve profile completeness.</p>
                </div>
              )}
            </div>

            {/* Resume Upload */}
            {/* <div className="mt-10 pt-10 border-t border-gray-200">
              <h4 className="text-base font-medium text-gray-900 mb-4">Resume</h4>
              <div className="flex items-center justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <i className="fas fa-file-upload text-gray-400 text-3xl"></i>
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500"
                    >
                      <span>Upload a file</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PDF, DOC, DOCX up to 5MB</p>
                </div>
              </div>
              {user?.resume && (
                <div className="mt-2 flex items-center text-sm text-gray-600">
                  <i className="fas fa-file-pdf text-gray-400 mr-2"></i>
                  <span>Current resume: resume.pdf</span>
                  <button type="button" className="ml-2 text-red-600 hover:text-red-800">
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              )}
            </div> */}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;