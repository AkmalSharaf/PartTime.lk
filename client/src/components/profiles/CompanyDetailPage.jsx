// src/components/CompanyDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';

const CompanyDetailPage = () => {
  const { id } = useParams();
  const [company, setCompany] = useState(null);
  const [companyJobs, setCompanyJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper function to safely format salary or object values
  const formatValue = (value) => {
    if (value === null || value === undefined) {
      return '';
    }
    
    // If it's an object (like salary with min, max, currency)
    if (typeof value === 'object' && value !== null) {
      // Handle salary object specifically
      if ('min' in value && 'max' in value) {
        if (value.min === value.max) {
          return `${value.currency || '$'}${value.min}`;
        }
        return `${value.currency || '$'}${value.min} - ${value.currency || '$'}${value.max}`;
      }
      // For other objects, convert to string
      return JSON.stringify(value);
    }
    
    return value;
  };

  useEffect(() => {
    const fetchCompanyAndJobs = async () => {
      try {
        setLoading(true);
        
        // Fetch company details
        const companyRes = await axios.get(`http://localhost:5000/api/users/${id}`);
        
        // Only proceed if the user is an employer
        if (companyRes.data.data.role !== 'employer') {
          throw new Error('Not a valid company');
        }
        
        setCompany(companyRes.data.data);
        
        // Fetch jobs from this company
        const jobsRes = await axios.get(`http://localhost:5000/api/jobs?employer=${id}`);
        
        // Process job data to handle any complex objects like salary
        const processedJobs = jobsRes.data.data.map(job => ({
          ...job,
          // If salary is an object, format it as a string
          salary: formatValue(job.salary)
        }));
        
        setCompanyJobs(processedJobs);
        
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch company details');
        setLoading(false);
      }
    };

    fetchCompanyAndJobs();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        <p className="ml-2 text-gray-600">Loading company details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 my-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
        <Link to="/companies" className="text-blue-600 hover:text-blue-800">
          ← Back to Companies
        </Link>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <p className="text-gray-600">Company not found.</p>
        <Link to="/companies" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
          ← Back to Companies
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Company Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center">
            <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-6">
              <div className="w-24 h-24 bg-gray-200 rounded-md flex items-center justify-center">
                {company.companyLogo ? (
                  <img
                    src={company.companyLogo}
                    alt={company.companyName}
                    className="w-20 h-20 object-contain"
                  />
                ) : (
                  <span className="text-4xl font-bold text-blue-600">
                    {company.companyName?.charAt(0) || 'C'}
                  </span>
                )}
              </div>
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{company.companyName}</h1>
              <div className="mt-2 flex flex-wrap items-center text-gray-600 gap-4">
                {company.industry && (
                  <div className="flex items-center">
                    <i className="fas fa-industry mr-2"></i>
                    <span>{company.industry}</span>
                  </div>
                )}
                {company.location && (
                  <div className="flex items-center">
                    <i className="fas fa-map-marker-alt mr-2"></i>
                    <span>{company.location}</span>
                  </div>
                )}
                {company.website && (
                  <div className="flex items-center">
                    <i className="fas fa-globe mr-2"></i>
                    <a 
                      href={company.website.startsWith('http') ? company.website : `https://${company.website}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Website
                    </a>
                  </div>
                )}
                <div className="flex items-center">
                  <i className="fas fa-briefcase mr-2"></i>
                  <span>{companyJobs.length} open positions</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Company Details */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">About {company.companyName}</h2>
            <div className="prose prose-blue max-w-none">
              {company.companyDescription ? (
                <p>{company.companyDescription}</p>
              ) : (
                <p className="text-gray-500 italic">No company description available.</p>
              )}
            </div>
          </div>

          {/* Open Positions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Open Positions</h2>
            {companyJobs.length === 0 ? (
              <p className="text-gray-500">No job postings available at the moment.</p>
            ) : (
              <div className="space-y-4">
                {companyJobs.map((job) => (
                  <Link
                    key={job._id}
                    to={`/job/${job._id}`}
                    className="block bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                  >
                    <h3 className="font-medium text-lg text-gray-900">{job.title}</h3>
                    <div className="flex flex-wrap gap-2 my-2">
                      {job.jobType && (
                        <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                          {job.jobType}
                        </span>
                      )}
                      {job.remote && (
                        <span className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full">
                          Remote
                        </span>
                      )}
                      {job.salary && (
                        <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                          {job.salary}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 line-clamp-2 mb-2">{job.description}</p>
                    <div className="flex items-center text-gray-600">
                      <i className="fas fa-map-marker-alt text-blue-600 mr-2"></i>
                      <span>{job.location}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          {/* Company Stats */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Company Overview</h2>
            <ul className="space-y-4">
              <li className="flex justify-between">
                <span className="text-gray-600">Founded</span>
                <span className="text-gray-900 font-medium">{company.foundedYear || 'N/A'}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-600">Company Size</span>
                <span className="text-gray-900 font-medium">{company.companySize || 'N/A'}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-600">Industry</span>
                <span className="text-gray-900 font-medium">{company.industry || 'N/A'}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-600">Headquarters</span>
                <span className="text-gray-900 font-medium">{company.location || 'N/A'}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-600">Open Jobs</span>
                <span className="text-gray-900 font-medium">{companyJobs.length}</span>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
            <ul className="space-y-3">
              {company.email && (
                <li className="flex items-center text-gray-600">
                  <i className="fas fa-envelope text-blue-600 mr-3 w-5"></i>
                  <a href={`mailto:${company.email}`} className="text-blue-600 hover:text-blue-800">
                    {company.email}
                  </a>
                </li>
              )}
              {company.phone && (
                <li className="flex items-center text-gray-600">
                  <i className="fas fa-phone text-blue-600 mr-3 w-5"></i>
                  <a href={`tel:${company.phone}`} className="text-blue-600 hover:text-blue-800">
                    {company.phone}
                  </a>
                </li>
              )}
              {company.website && (
                <li className="flex items-center text-gray-600">
                  <i className="fas fa-globe text-blue-600 mr-3 w-5"></i>
                  <a
                    href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {company.website}
                  </a>
                </li>
              )}
              {company.location && (
                <li className="flex items-center text-gray-600">
                  <i className="fas fa-map-marker-alt text-blue-600 mr-3 w-5"></i>
                  <span>{company.location}</span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDetailPage;