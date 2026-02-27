// src/pages/RegisterPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import axios from 'axios';
// Import the action creator
import { registerSuccess } from '../../redux/actions/authActions';

const RegisterPage = () => {
  const [userType, setUserType] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    // For employers
    companyName: '',
    // Additional fields can be added as needed
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  // Check for user type in URL params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const type = params.get('type');
    if (type === 'employer' || type === 'seeker') {
      setUserType(type === 'seeker' ? 'jobseeker' : 'employer');
    }
  }, [location]);

  // Handler for selecting user type
  const handleUserTypeSelect = (type) => {
    setUserType(type);
  };

  // Handler for form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handler for form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Password matching validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      // Prepare registration data
      const registrationData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: userType
      };

      // Add company name for employers
      if (userType === 'employer' && formData.companyName) {
        registrationData.companyName = formData.companyName;
      }

      // Make API call to register endpoint
      const response = await axios.post('http://localhost:5000/api/auth/register', registrationData);

      const { success, token, user } = response.data;

      if (success && token) {
        // Store token in localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        // Dispatch register success action
        dispatch(registerSuccess(user));

        // Redirect based on user role
        if (user.role === 'jobseeker') {
          navigate('/dashboard/seeker');
        } else {
          navigate('/dashboard/employer');
        }
      }
    } catch (err) {
      console.error('Registration failed:', err);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center items-center">
          <i className="fas fa-briefcase text-blue-600 text-3xl mr-2"></i>
          <span className="font-bold text-2xl text-blue-600">PartTime.lk</span>
        </Link>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {userType ? `Register as ${userType === 'employer' ? 'Employer' : 'Job Seeker'}` : 'Create your account'}
        </h2>
        {!userType && (
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              log in to your existing account
            </Link>
          </p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {!userType ? (
            // User Type Selection
            <div className="space-y-4">
              <button
                onClick={() => handleUserTypeSelect('jobseeker')}
                className="w-full flex justify-center py-4 px-4 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 focus:outline-none"
              >
                <i className="fas fa-user mr-2"></i> Register as Job Seeker
              </button>
              <button
                onClick={() => handleUserTypeSelect('employer')}
                className="w-full flex justify-center py-4 px-4 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 focus:outline-none"
              >
                <i className="fas fa-building mr-2"></i> Register as Employer
              </button>
            </div>
          ) : (
            // Registration Form
            <>
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
              
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <div className="mt-1">
                    <input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                {userType === 'employer' && (
                  <div>
                    <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                      Company Name
                    </label>
                    <div className="mt-1">
                      <input
                        id="companyName"
                        name="companyName"
                        type="text"
                        required
                        value={formData.companyName}
                        onChange={handleChange}
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="mt-1">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <div className="mt-1">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    required
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
                    I agree to the{' '}
                    <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                      Terms and Conditions
                    </a>
                  </label>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {loading ? 'Creating account...' : 'Create account'}
                  </button>
                </div>
                
                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={() => setUserType('')}
                    className="text-sm text-blue-600 hover:text -blue-500"
                  >
                    ← Back to user type selection
                  </button>
                </div>
              </form>
              
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Already have an account?</span>
                  </div>
                </div>

                <div className="mt-6">
                  <Link
                    to="/login"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100"
                  >
                    Log in
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;