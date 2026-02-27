// src/components/profile/CompanyProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const CompanyProfilePage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [companyLogo, setCompanyLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    companyName: '',
    companyDescription: '',
    companyWebsite: '',
    industry: '',
    companySize: '',
    location: ''
  });
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
    
    // If user is not an employer, redirect to appropriate dashboard
    if (parsedUser.role !== 'employer') {
      navigate('/dashboard/seeker');
      return;
    }

    // Fetch company profile data
    fetchCompanyProfileData(token);
  }, [navigate]);

  const fetchCompanyProfileData = async (token) => {
    setLoading(true);
    try {
      // Configure axios headers with token
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      // Fetch employer profile
      const profileResponse = await axios.get('http://localhost:5000/api/users/profile', config);
      const userData = profileResponse.data.data;
      setUser(userData);
      
      // Update form data with fetched user data
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        companyName: userData.companyName || '',
        companyDescription: userData.companyDescription || '',
        companyWebsite: userData.companyWebsite || '',
        industry: userData.industry || '',
        companySize: userData.companySize || '',
        location: userData.location || ''
      });
      
      // Set logo preview if company has a logo
      if (userData.companyLogo) {
        setLogoPreview(`http://localhost:5000/${userData.companyLogo}`);
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Validate required fields
    if (!formData.name || !formData.email || !formData.companyName) {
      setError('Please fill in all required fields (Name, Email, Company Name).');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address.');
      return;
    }

    // Validate website URL if provided
    if (formData.companyWebsite && !formData.companyWebsite.startsWith('http')) {
      setError('Website URL must start with http:// or https://');
      return;
    }
  
    try {
      setLoading(true);
      setError('');
      
      // Create FormData object for file upload
      const submitData = new FormData();
      
      // Add all form fields to FormData
      Object.keys(formData).forEach(key => {
        if (formData[key] && formData[key].trim() !== '') {
          submitData.append(key, formData[key].trim());
        }
      });
      
      // Append company logo if uploaded
      if (companyLogo) {
        submitData.append('companyLogo', companyLogo);
      }
      
      // Configure headers - Don't set Content-Type for FormData, let browser set it
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      console.log('Updating profile with data:', Object.fromEntries(submitData.entries()));
      
      // Send update request
      const response = await axios.put('http://localhost:5000/api/users/profile', submitData, config);
      
      // Update local user data
      const updatedUser = response.data.data;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      setSuccessMessage('Company profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('Error updating profile:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to update profile. Please try again.';
      setError(errorMsg);
   } finally {
      setLoading(false);
    }
  };

  const handleCompanyLogoChange = (e) => {
    const file = e.target.files[0];
    console.log("Selected file:", file);
    
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        setError('Invalid file type. Only JPG, PNG, GIF, and SVG files are allowed.');
        return;
      }
      
      // Validate file size (2MB limit)
      const maxSize = 2 * 1024 * 1024; // 2MB
      if (file.size > maxSize) {
        setError('File too large. Maximum size is 2MB.');
        return;
      }
      
      setError(''); // Clear any previous errors
      setCompanyLogo(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleRemoveLogo = () => {
    setCompanyLogo(null);
    setLogoPreview(user?.companyLogo ? `http://localhost:5000/${user.companyLogo}` : null);
    // Reset file input
    const fileInput = document.getElementById('companyLogo');
    if (fileInput) fileInput.value = '';
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
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
          <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
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

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="md:grid md:grid-cols-3 md:gap-6">
              <div className="md:col-span-1">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Company Profile</h3>
                <p className="mt-1 text-sm text-gray-500">
                  This information will be displayed publicly to job seekers browsing your company.
                </p>
              </div>
              <div className="mt-5 md:mt-0 md:col-span-2">
                <form onSubmit={handleUpdateProfile}>
                  <div className="space-y-6">
              
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                      <div className="sm:col-span-3">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                          Your Name *
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            name="name"
                            id="name"
                            required
                            value={formData.name}
                            onChange={handleInputChange}
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-3">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                          Email Address *
                        </label>
                        <div className="mt-1">
                          <input
                            type="email"
                            name="email"
                            id="email"
                            required
                            value={formData.email}
                            onChange={handleInputChange}
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
                            type="tel"
                            name="phone"
                            id="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="+1 (555) 123-4567"
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-3">
                        <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                          Company Name *
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            name="companyName"
                            id="companyName"
                            required
                            value={formData.companyName}
                            onChange={handleInputChange}
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-3">
                        <label htmlFor="industry" className="block text-sm font-medium text-gray-700">
                          Industry
                        </label>
                        <div className="mt-1">
                          <select
                            id="industry"
                            name="industry"
                            value={formData.industry}
                            onChange={handleInputChange}
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          >
                            <option value="">Select an industry</option>
                            <option value="Technology">Technology</option>
                            <option value="Healthcare">Healthcare</option>
                            <option value="Finance">Finance</option>
                            <option value="Education">Education</option>
                            <option value="Manufacturing">Manufacturing</option>
                            <option value="Retail">Retail</option>
                            <option value="Construction">Construction</option>
                            <option value="Transportation">Transportation</option>
                            <option value="Hospitality">Hospitality</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>

                      <div className="sm:col-span-3">
                        <label htmlFor="companySize" className="block text-sm font-medium text-gray-700">
                          Company Size
                        </label>
                        <div className="mt-1">
                          <select
                            id="companySize"
                            name="companySize"
                            value={formData.companySize}
                            onChange={handleInputChange}
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          >
                            <option value="">Select company size</option>
                            <option value="1-10">1-10 employees</option>
                            <option value="11-50">11-50 employees</option>
                            <option value="51-200">51-200 employees</option>
                            <option value="201-500">201-500 employees</option>
                            <option value="501-1000">501-1000 employees</option>
                            <option value="1000+">1000+ employees</option>
                          </select>
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
                            value={formData.location}
                            onChange={handleInputChange}
                            placeholder="City, State, Country"
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-3">
                        <label htmlFor="companyWebsite" className="block text-sm font-medium text-gray-700">
                          Company Website
                        </label>
                        <div className="mt-1">
                          <input
                            type="url"
                            name="companyWebsite"
                            id="companyWebsite"
                            value={formData.companyWebsite}
                            onChange={handleInputChange}
                            placeholder="https://www.yourcompany.com"
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-6">
                        <label htmlFor="companyDescription" className="block text-sm font-medium text-gray-700">
                          Company Description
                        </label>
                        <div className="mt-1">
                          <textarea
                            id="companyDescription"
                            name="companyDescription"
                            rows={6}
                            value={formData.companyDescription}
                            onChange={handleInputChange}
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            placeholder="Describe your company, mission, culture, and what makes it a great place to work..."
                          />
                        </div>
                        <p className="mt-2 text-sm text-gray-500">
                          This description will be visible to job seekers browsing your company profile and job postings.
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                      <button
                        type="button"
                        className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        onClick={() => navigate('/dashboard/employer')}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {loading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving...
                          </>
                        ) : (
                          'Save Changes'
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Completion Tips */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Complete Your Profile
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>A complete profile helps attract better candidates:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Upload a professional company logo</li>
                  <li>Write a compelling company description</li>
                  <li>Add your website and contact information</li>
                  <li>Specify your industry and company size</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};

export default CompanyProfilePage;