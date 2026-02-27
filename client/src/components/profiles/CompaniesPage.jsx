// src/components/CompaniesPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const CompaniesPage = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [industry, setIndustry] = useState('');

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        // Get all users with role 'employer'
        const response = await axios.get('http://localhost:5000/api/users/companies');
        setCompanies(response.data.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch companies');
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  // Filter companies based on search term and industry
  const filteredCompanies = companies.filter(
    (company) =>
      company.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (industry === '' || company.industry === industry)
  );

  // Get unique industries for filter dropdown
  const industries = [...new Set(companies.map((company) => company.industry))].filter(Boolean);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-blue-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Explore Top Companies</h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Discover great places to work and build your career
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search Companies
              </label>
              <input
                type="text"
                id="search"
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter company name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="md:w-1/4">
              <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">
                Industry
              </label>
              <select
                id="industry"
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
              >
                <option value="">All Industries</option>
                {industries.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Companies List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading companies...</p>
          </div>
        ) : error ? (
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
        ) : filteredCompanies.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No companies found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompanies.map((company) => (
              <Link
                to={`/companies/${company._id}`}
                key={company._id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition p-6"
              >
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center mr-4">
                    {company.companyLogo ? (
                      <img
                        src={company.companyLogo}
                        alt={company.companyName}
                        className="w-12 h-12 object-contain"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-blue-600">
                        {company.companyName?.charAt(0) || 'C'}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-lg text-gray-900">{company.companyName}</h3>
                    <p className="text-gray-600">{company.industry}</p>
                  </div>
                </div>

                <p className="text-gray-600 mb-4 line-clamp-3">
                  {company.companyDescription || 'No description available.'}
                </p>

                <div className="flex items-center text-gray-600 mb-2">
                  <i className="fas fa-map-marker-alt text-blue-600 mr-2 w-5"></i>
                  <span>{company.location || 'Location not specified'}</span>
                </div>

                <div className="flex items-center text-gray-600 mb-2">
                  <i className="fas fa-globe text-blue-600 mr-2 w-5"></i>
                  <span>{company.website || 'Website not available'}</span>
                </div>

                <div className="flex items-center text-gray-600">
                  <i className="fas fa-briefcase text-blue-600 mr-2 w-5"></i>
                  <span>{company.jobCount || 0} open positions</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination (if needed) */}
        {!loading && !error && filteredCompanies.length > 0 && (
          <div className="mt-8 flex justify-center">
            <nav className="flex items-center space-x-2">
              <button className="px-3 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50">
                Previous
              </button>
              <button className="px-3 py-1 rounded bg-blue-600 text-white">1</button>
              <button className="px-3 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50">
                2
              </button>
              <button className="px-3 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50">
                3
              </button>
              <button className="px-3 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50">
                Next
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompaniesPage;