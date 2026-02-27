// src/components/layout/Navbar.jsx - Updated with Job Preferences
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../redux/actions/authActions';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // Get auth state from Redux store
  const { isAuthenticated, user } = useSelector(state => state.auth);
  
  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  // Helper function to check if route is active
  const isActiveRoute = (path) => {
    if (path === '/jobs') {
      return location.pathname === '/jobs' || 
             location.pathname === '/search' || 
             location.pathname === '/browse' || 
             location.pathname === '/find-jobs';
    }
    if (path === '/preferences') {
      return location.pathname === '/preferences' || location.pathname === '/job-preferences';
    }
    return location.pathname === path;
  };

  // Enhanced search shortcut
  const handleQuickSearch = () => {
    navigate('/jobs');
    setIsMenuOpen(false);
  };

  // Job preferences shortcut
  const handlePreferences = () => {
    navigate('/preferences');
    setIsMenuOpen(false);
    setIsProfileOpen(false);
  };
  
  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center">
                <div className="bg-blue-600 text-white rounded-lg p-2 mr-2">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                    <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                  </svg>
                </div>
                <span className="text-blue-600 font-bold text-xl">PartTime.lk</span>
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link 
                to="/jobs" 
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200 ${
                  isActiveRoute('/jobs') 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:border-blue-300 hover:text-blue-600'
                }`}
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Find Jobs
              </Link>
              
              {/* NEW - Job Preferences Link for Job Seekers */}
              {isAuthenticated && user && user.role === 'jobseeker' && (
                <Link 
                  to="/preferences" 
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200 ${
                    isActiveRoute('/preferences') 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:border-blue-300 hover:text-blue-600'
                  }`}
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  AI Preferences
                </Link>
              )}
              
              <Link 
                to="/companies" 
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200 ${
                  isActiveRoute('/companies') 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:border-blue-300 hover:text-blue-600'
                }`}
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Companies
              </Link>
              <Link 
                to="/about" 
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200 ${
                  isActiveRoute('/about') 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:border-blue-300 hover:text-blue-600'
                }`}
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                About
              </Link>
            </div>
          </div>
          
          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
            {isAuthenticated ? (
              <>
                {/* Quick Search Button */}
                <button 
                  onClick={handleQuickSearch}
                  className="text-gray-500 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors duration-200 flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  AI Search
                </button>

                {/* NEW - Quick Preferences Button for Job Seekers */}
                {user && user.role === 'jobseeker' && (
                  <button 
                    onClick={handlePreferences}
                    className="text-gray-500 hover:text-purple-600 px-3 py-2 text-sm font-medium transition-colors duration-200 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Smart Match
                  </button>
                )}

                {user && user.role === 'employer' && (
                  <Link 
                    to="/post-job" 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Post a Job
                  </Link>
                )}
                
                {/* Profile dropdown */}
                <div className="ml-3 relative">
                  <div>
                    <button
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className="bg-white rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                    >
                      <span className="sr-only">Open user menu</span>
                      <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {user && user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </span>
                      </div>
                      <svg className="ml-1 w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Dropdown menu */}
                  {isProfileOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                      <div className="py-1">
                        <div className="px-4 py-3 text-sm border-b border-gray-100">
                          <p className="text-gray-900 font-medium">{user.name}</p>
                          <p className="text-gray-500 truncate">{user.email}</p>
                          <p className="text-xs text-blue-600 mt-1 capitalize">{user.role}</p>
                        </div>
                        
                        <Link
                          to={user.role === 'employer' ? '/dashboard/employer' : '/dashboard/seeker'}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                          </svg>
                          Dashboard
                        </Link>
                        
                        {/* NEW - Job Preferences Link in Dropdown */}
                        {user.role === 'jobseeker' && (
                          <Link
                            to="/preferences"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors duration-150"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Job Preferences
                            <span className="ml-auto bg-purple-100 text-purple-600 text-xs px-2 py-0.5 rounded-full">AI</span>
                          </Link>
                        )}
                        
                        {user.role === 'employer' ? (
                          <Link
                            to="/company-profile"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            Company Profile
                          </Link>
                        ) : (
                          <Link
                            to="/profile"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            My Profile
                          </Link>
                        )}
                        
                        <div className="border-t border-gray-100">
                          <button
                            onClick={() => {
                              setIsProfileOpen(false);
                              handleLogout();
                            }}
                            className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Sign out
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors duration-200"
                >
                  Sign In
                </Link>
                <Link 
                  to="/register" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Register
                </Link>
              </>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors duration-200"
            >
              <span className="sr-only">Open main menu</span>
              {!isMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="sm:hidden bg-white border-t border-gray-200">
          <div className="pt-2 pb-3 space-y-1">
            {/* Enhanced Search Button */}
            <button
              onClick={handleQuickSearch}
              className="w-full text-left bg-blue-50 text-blue-700 block pl-3 pr-4 py-2 border-l-4 border-blue-500 text-base font-medium"
            >
              <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              AI Job Search
            </button>

            {/* NEW - Job Preferences Button for Mobile (Job Seekers Only) */}
            {isAuthenticated && user && user.role === 'jobseeker' && (
              <button
                onClick={handlePreferences}
                className="w-full text-left bg-purple-50 text-purple-700 block pl-3 pr-4 py-2 border-l-4 border-purple-500 text-base font-medium"
              >
                <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                AI Job Preferences
              </button>
            )}
            
            <Link
              to="/jobs"
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                isActiveRoute('/jobs')
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Find Jobs
            </Link>
            <Link
              to="/companies"
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                isActiveRoute('/companies')
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Companies
            </Link>
            <Link
              to="/about"
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                isActiveRoute('/about')
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
          </div>
          
          {isAuthenticated ? (
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white font-medium">
                      {user && user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </span>
                  </div>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">{user.name}</div>
                  <div className="text-sm font-medium text-gray-500">{user.email}</div>
                  <div className="text-xs text-blue-600 capitalize">{user.role}</div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <Link
                  to={user.role === 'employer' ? '/dashboard/employer' : '/dashboard/seeker'}
                  className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>

                {/* NEW - Job Preferences Mobile Link */}
                {user.role === 'jobseeker' && (
                  <Link
                    to="/preferences"
                    className="block px-4 py-2 text-base font-medium text-purple-600 hover:text-purple-800 hover:bg-purple-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Job Preferences
                    <span className="ml-2 bg-purple-100 text-purple-600 text-xs px-2 py-0.5 rounded-full">AI</span>
                  </Link>
                )}

                {user.role === 'employer' ? (
                  <>
                    <Link
                      to="/company-profile"
                      className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Company Profile
                    </Link>
                    <Link
                      to="/post-job"
                      className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Post a Job
                    </Link>
                  </>
                ) : (
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    My Profile
                  </Link>
                )}
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleLogout();
                  }}
                  className="block w-full text-left px-4 py-2 text-base font-medium text-red-600 hover:text-red-800 hover:bg-red-50"
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="flex items-center justify-around px-4">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-600 px-4 py-2 text-base font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Register
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;