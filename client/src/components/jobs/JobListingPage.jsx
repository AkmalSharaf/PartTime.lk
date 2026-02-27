// src/pages/JobListingPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const JobListingPage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    jobType: '',
    experience: '',
    location: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1
  });

  useEffect(() => {
    fetchJobs();
  }, [filters, pagination.currentPage]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      // Build query string from filters
      const queryParams = [];
      
      if (filters.search) {
        queryParams.push(`search=${encodeURIComponent(filters.search)}`);
      }
      
      if (filters.jobType) {
        queryParams.push(`jobType=${encodeURIComponent(filters.jobType)}`);
      }
      
      if (filters.experience) {
        queryParams.push(`experience=${encodeURIComponent(filters.experience)}`);
      }
      
      if (filters.location) {
        queryParams.push(`location=${encodeURIComponent(filters.location)}`);
      }
      
      // Add pagination params
      queryParams.push(`page=${pagination.currentPage}`);
      queryParams.push('limit=10');
      
      const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
      
      const response = await axios.get(`http://localhost:5000/api/jobs${queryString}`);
      
      if (response.data.success) {
        setJobs(response.data.data || []);
        
        // Update pagination info
        const total = response.data.pagination?.total || 0;
        const limit = response.data.pagination?.limit || 10;
        const totalPages = Math.ceil(total / limit);
        
        setPagination({
          ...pagination,
          totalPages: totalPages || 1
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching jobs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
    
    // Reset to first page when filters change
    setPagination({
      ...pagination,
      currentPage: 1
    });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // The useEffect will trigger the API call
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination({
        ...pagination,
        currentPage: newPage
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    
    // Calculate the difference in days
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-gray-900">Find Jobs</h1>
            <p className="mt-1 text-gray-500">Browse through available opportunities</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Filters</h2>
              
              {/* Search */}
              <form onSubmit={handleSearchSubmit} className="mb-6">
                <div className="relative">
                  <input
                    type="text"
                    name="search"
                    value={filters.search}
                    onChange={handleFilterChange}
                    placeholder="Search jobs..."
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md pr-10"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <i className="fas fa-search text-gray-400"></i>
                  </div>
                </div>
              </form>
              
              {/* Job Type Filter */}
              <div className="mb-4">
                <label htmlFor="jobType" className="block text-sm font-medium text-gray-700 mb-1">
                  Job Type
                </label>
                <select
                  id="jobType"
                  name="jobType"
                  value={filters.jobType}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="">All Types</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                  <option value="Remote">Remote</option>
                </select>
              </div>
              
              {/* Experience Filter */}
              <div className="mb-4">
                <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-1">
                  Experience Level
                </label>
                <select
                  id="experience"
                  name="experience"
                  value={filters.experience}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="">All Levels</option>
                  <option value="Entry-level">Entry-level</option>
                  <option value="Mid-level">Mid-level</option>
                  <option value="Senior">Senior</option>
                  <option value="Executive">Executive</option>
                </select>
              </div>
              
              {/* Location Filter */}
              <div className="mb-4">
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={filters.location}
                  onChange={handleFilterChange}
                  placeholder="City, state, or remote"
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              
              {/* Reset Filters */}
              <button
                type="button"
                onClick={() => {
                  setFilters({
                    jobType: '',
                    experience: '',
                    location: '',
                    search: ''
                  });
                }}
                className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
              >
                Reset Filters
              </button>
            </div>
          </div>
          
          {/* Job Listings */}
          <div className="lg:col-span-3">
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
            
            {/* Loading Indicator */}
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="spinner">Loading...</div>
              </div>
            ) : jobs.length === 0 ? (
              <div className="bg-white shadow-md rounded-lg p-8 text-center">
                <i className="fas fa-search text-gray-400 text-4xl mb-4"></i>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
                <p className="text-gray-500">
                  Try adjusting your search or filter criteria to find more opportunities.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {jobs.map(job => (
                  <div key={job._id} className="bg-white shadow-md rounded-lg p-6 transition duration-150 ease-in-out hover:shadow-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <Link to={`/job/${job._id}`} className="text-xl font-medium text-blue-600 hover:text-blue-800">
                          {job.title}
                        </Link>
                        <p className="text-gray-600 mt-1">{job.company}</p>
                        <div className="flex items-center text-sm text-gray-500 mt-2">
                          <i className="fas fa-map-marker-alt mr-1"></i>
                          <span>{job.location}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-sm text-gray-500">
                          {formatDate(job.createdAt)}
                        </span>
                        {job.salary?.min && job.salary?.max && (
                          <span className="mt-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                            ${job.salary.min.toLocaleString()} - ${job.salary.max.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        {job.jobType}
                      </span>
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        {job.experience}
                      </span>
                    </div>

                    {job.skills && job.skills.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-700 mb-2">Required Skills:</p>
                        <div className="flex flex-wrap gap-2">
                          {job.skills.slice(0, 5).map((skill, index) => (
                            <span key={index} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                              {skill}
                            </span>
                          ))}
                          {job.skills.length > 5 && (
                            <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                              +{job.skills.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="mt-6 flex justify-end">
                      <Link
                        to={`/job/${job._id}`}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
                
                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg">
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Showing page <span className="font-medium">{pagination.currentPage}</span> of{' '}
                          <span className="font-medium">{pagination.totalPages}</span> pages
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                          <button
                            onClick={() => handlePageChange(pagination.currentPage - 1)}
                            disabled={pagination.currentPage === 1}
                            className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${
                              pagination.currentPage === 1 ? 'cursor-not-allowed opacity-50' : ''
                            }`}
                          >
                            <i className="fas fa-chevron-left"></i>
                          </button>
                          
                          {/* Show page numbers */}
                          {[...Array(pagination.totalPages)].map((_, i) => {
                            const pageNumber = i + 1;
                            // Only show current page, first, last, and pages around current
                            if (
                              pageNumber === 1 ||
                              pageNumber === pagination.totalPages ||
                              (pageNumber >= pagination.currentPage - 1 && pageNumber <= pagination.currentPage + 1)
                            ) {
                              return (
                                <button
                                  key={pageNumber}
                                  onClick={() => handlePageChange(pageNumber)}
                                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                                    pageNumber === pagination.currentPage
                                      ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                      : 'text-gray-500 hover:bg-gray-50'
                                  }`}
                                >
                                  {pageNumber}
                                </button>
                              );
                            } else if (
                              (pageNumber === 2 && pagination.currentPage > 3) ||
                              (pageNumber === pagination.totalPages - 1 && pagination.currentPage < pagination.totalPages - 2)
                            ) {
                              // Show ellipsis
                              return (
                                <span
                                  key={pageNumber}
                                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                                >
                                  ...
                                </span>
                              );
                            }
                            return null;
                          })}
                          
                          <button
                            onClick={() => handlePageChange(pagination.currentPage + 1)}
                            disabled={pagination.currentPage === pagination.totalPages}
                            className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${
                              pagination.currentPage === pagination.totalPages ? 'cursor-not-allowed opacity-50' : ''
                            }`}
                          >
                            <i className="fas fa-chevron-right"></i>
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobListingPage;