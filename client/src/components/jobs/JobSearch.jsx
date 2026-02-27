import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

const EnhancedJobSearch = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState({});
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isNLPSearch, setIsNLPSearch] = useState(true);
  const [searchHistory, setSearchHistory] = useState([]);
  const [parsedQuery, setParsedQuery] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0
  });
  
  const searchInputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const auth = useSelector(state => state.auth);

  // API base URL - make sure this matches your backend
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Enhanced NLP search examples
  const nlpExamples = [
    "Find me remote software engineer jobs",
    "Entry level marketing positions in New York", 
    "Senior React developer roles with good salary",
    "Part-time design jobs under 80k",
    "Contract data scientist positions",
    "Full-time jobs at tech startups",
    "Frontend developer positions in San Francisco",
    "Backend engineer roles with Python",
    "UI UX designer jobs at healthcare companies",
    "Machine learning engineer positions"
  ];

  useEffect(() => {
    // Load search history from localStorage
    const history = JSON.parse(localStorage.getItem('jobSearchHistory') || '[]');
    setSearchHistory(history);
    
    // Initial job load
    fetchJobs();
  }, []);

  useEffect(() => {
    // Get suggestions when user types
    if (searchQuery.length >= 2) {
      const timeoutId = setTimeout(() => {
        fetchSuggestions();
      }, 300);
      
      return () => clearTimeout(timeoutId);
    } else {
      setSuggestions({});
      setShowSuggestions(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    // Close suggestions when clicking outside
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchJobs = async (query = '', page = 1) => {
    setLoading(true);
    setError('');

    try {
      let url;
      let endpoint;
      
      if (query && isNLPSearch) {
        // Use NLP search endpoint
        endpoint = `/api/jobs/search/nlp`;
        url = `${API_BASE_URL}${endpoint}?query=${encodeURIComponent(query)}&page=${page}&limit=12`;
      } else if (query) {
        // Use regular search
        endpoint = `/api/jobs`;
        url = `${API_BASE_URL}${endpoint}?search=${encodeURIComponent(query)}&page=${page}&limit=12`;
      } else {
        // Get all jobs
        endpoint = `/api/jobs`;
        url = `${API_BASE_URL}${endpoint}?page=${page}&limit=12&sortBy=createdAt&sortOrder=desc`;
      }

      console.log('🔍 Fetching jobs from:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(auth?.token && { 'Authorization': `Bearer ${auth.token}` })
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📊 API Response:', data);

      if (data.success) {
        setJobs(data.data || []);
        setPagination({
          currentPage: data.pagination?.currentPage || 1,
          totalPages: data.pagination?.totalPages || 1,
          total: data.total || 0
        });
        
        // Set parsed query info for NLP search
        if (data.parsedQuery) {
          setParsedQuery(data.parsedQuery);
          console.log('🧠 Parsed Query:', data.parsedQuery);
        } else {
          setParsedQuery(null);
        }

        // Clear error if successful
        setError('');
      } else {
        setError(data.message || 'Failed to fetch jobs');
        setJobs([]);
      }
    } catch (err) {
      console.error('❌ Fetch error:', err);
      setError(`Error: ${err.message}. Please check your connection and try again.`);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestions = async () => {
    try {
      const url = `${API_BASE_URL}/api/jobs/search/suggestions?q=${encodeURIComponent(searchQuery)}`;
      console.log('💡 Fetching suggestions from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log('💡 Suggestions response:', data);
      
      if (data.success) {
        setSuggestions(data);
        setShowSuggestions(true);
      }
    } catch (err) {
      console.error('❌ Suggestions error:', err);
      // Don't show error for suggestions, just hide them
      setSuggestions({});
      setShowSuggestions(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchJobs();
      return;
    }

    console.log('🔍 Performing search:', { query: searchQuery, isNLP: isNLPSearch });

    // Add to search history
    const newHistory = [searchQuery, ...searchHistory.filter(h => h !== searchQuery)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('jobSearchHistory', JSON.stringify(newHistory));

    // Perform search
    fetchJobs(searchQuery, 1);
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    setTimeout(() => {
      fetchJobs(suggestion, 1);
    }, 100);
  };

  const handleExampleClick = (example) => {
    setSearchQuery(example);
    setIsNLPSearch(true);
    setTimeout(() => {
      fetchJobs(example, 1);
    }, 100);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchJobs(searchQuery, newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    } catch (err) {
      return 'Recently';
    }
  };

  const formatSalary = (salary) => {
    if (!salary) return 'Salary not disclosed';
    
    try {
      if (salary.min) {
        const min = typeof salary.min === 'number' ? salary.min : parseInt(salary.min);
        const max = salary.max ? (typeof salary.max === 'number' ? salary.max : parseInt(salary.max)) : null;
        
        let formatted = `$${min.toLocaleString()}`;
        if (max && max > min) {
          formatted += ` - $${max.toLocaleString()}`;
        } else {
          formatted += '+';
        }
        
        const period = salary.period || 'yearly';
        if (period === 'hourly') formatted += '/hr';
        else if (period === 'monthly') formatted += '/mo';
        else formatted += '/year';
        
        return formatted;
      }
    } catch (err) {
      console.error('Error formatting salary:', err);
    }
    
    return 'Salary not disclosed';
  };

  // FIXED: Safe parsing with proper undefined checks
  const renderParsedQuery = () => {
    if (!parsedQuery || !isNLPSearch) return null;

    // Safely check for filters with proper undefined handling
    const hasFilters = parsedQuery.jobType || 
                      parsedQuery.experience || 
                      parsedQuery.location || 
                      parsedQuery.industry ||
                      (parsedQuery.skills && Array.isArray(parsedQuery.skills) && parsedQuery.skills.length > 0) || 
                      parsedQuery.salary;

    if (!hasFilters) return null;

    return (
      <div className="max-w-4xl mx-auto mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2">
          🧠 AI Search Understanding:
        </h3>
        <div className="flex flex-wrap gap-2 text-sm">
          {parsedQuery.jobType && (
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
              Type: {parsedQuery.jobType}
            </span>
          )}
          {parsedQuery.experience && (
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
              Level: {parsedQuery.experience}
            </span>
          )}
          {parsedQuery.location && (
            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
              Location: {parsedQuery.location}
            </span>
          )}
          {parsedQuery.industry && (
            <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
              Industry: {parsedQuery.industry}
            </span>
          )}
          {parsedQuery.skills && Array.isArray(parsedQuery.skills) && parsedQuery.skills.length > 0 && (
            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">
              Skills: {parsedQuery.skills.slice(0, 3).join(', ')}
              {parsedQuery.skills.length > 3 && ` +${parsedQuery.skills.length - 3} more`}
            </span>
          )}
          {parsedQuery.salary && (
            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
              Salary: {parsedQuery.salary.min ? `$${parsedQuery.salary.min.toLocaleString()}` : ''}
              {parsedQuery.salary.max ? ` - $${parsedQuery.salary.max.toLocaleString()}` : '+'}
            </span>
          )}
        </div>
        {parsedQuery.confidence && (
          <div className="mt-2 text-xs text-blue-600">
            Confidence: {Math.round(parsedQuery.confidence)}%
          </div>
        )}
      </div>
    );
  };

  const renderJobCard = (job) => (
    <div key={job._id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 p-6 border border-gray-100">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
            <Link to={`/jobs/${job._id}`} className="hover:text-blue-600 transition-colors">
              {job.title}
            </Link>
          </h3>
          <p className="text-gray-600 font-medium">
            {job.company || job.employer?.companyName || job.employer?.name || 'Company Name Not Available'}
          </p>
        </div>
        
        {/* Match Score */}
        {job.relevanceScore > 0 && (
          <div className="ml-4 flex-shrink-0">
            <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
              {job.relevanceScore}% match
            </span>
          </div>
        )}
      </div>

      {/* Location and Date */}
      <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
        <div className="flex items-center">
          <i className="fas fa-map-marker-alt mr-1"></i>
          <span>{job.location || 'Location not specified'}</span>
          {job.isRemote && (
            <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
              Remote
            </span>
          )}
        </div>
        <span>{formatDate(job.createdAt)}</span>
      </div>

      {/* Job Type and Experience Badges */}
      <div className="flex flex-wrap gap-2 mb-4">
        {job.jobType && (
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
            {job.jobType}
          </span>
        )}
        {job.experience && (
          <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded">
            {job.experience}
          </span>
        )}
        {job.industry && (
          <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-1 rounded">
            {job.industry}
          </span>
        )}
        {job.urgent && (
          <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded">
            🔥 Urgent
          </span>
        )}
        {job.featured && (
          <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded">
            ⭐ Featured
          </span>
        )}
      </div>

      {/* Skills */}
      {job.skills && Array.isArray(job.skills) && job.skills.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Required Skills:</p>
          <div className="flex flex-wrap gap-1">
            {job.skills.slice(0, 4).map((skill, index) => (
              <span 
                key={index} 
                className={`text-xs px-2 py-1 rounded ${
                  job.matchingSkills && Array.isArray(job.matchingSkills) && 
                  job.matchingSkills.some(ms => ms.toLowerCase() === skill.toLowerCase())
                    ? 'bg-green-100 text-green-800 font-medium' 
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {skill}
              </span>
            ))}
            {job.skills.length > 4 && (
              <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                +{job.skills.length - 4} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Description Preview */}
      {job.description && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {job.description.substring(0, 150)}...
        </p>
      )}

      {/* Footer */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-100">
        {/* Salary */}
        <div>
          <span className="text-sm font-semibold text-gray-900">
            {formatSalary(job.salary)}
          </span>
        </div>

        {/* View Button */}
        <Link
          to={`/jobs/${job._id}`}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          View Details
        </Link>
      </div>

      {/* Job Stats */}
      {(job.viewCount > 0 || job.applicationCount > 0) && (
        <div className="flex items-center justify-between text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
          <div className="flex space-x-4">
            {job.viewCount > 0 && (
              <span>👁️ {job.viewCount} views</span>
            )}
            {job.applicationCount > 0 && (
              <span>📝 {job.applicationCount} applications</span>
            )}
          </div>
          {job.trendingScore && (
            <span className="text-orange-600 font-medium">
              🔥 Trending
            </span>
          )}
        </div>
      )}
    </div>
  );

  const renderSuggestions = () => {
    const hasAnySuggestions = 
      (suggestions.nlpSuggestions && suggestions.nlpSuggestions.length > 0) ||
      (suggestions.suggestions && (
        (suggestions.suggestions.titles && suggestions.suggestions.titles.length > 0) ||
        (suggestions.suggestions.companies && suggestions.suggestions.companies.length > 0) ||
        (suggestions.suggestions.skills && suggestions.suggestions.skills.length > 0) ||
        (suggestions.suggestions.locations && suggestions.suggestions.locations.length > 0)
      )) ||
      searchHistory.length > 0;

    if (!hasAnySuggestions) return null;

    return (
      <div
        ref={suggestionsRef}
        className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto"
      >
        {/* NLP Suggestions */}
        {suggestions.nlpSuggestions && Array.isArray(suggestions.nlpSuggestions) && suggestions.nlpSuggestions.length > 0 && (
          <div className="p-3 border-b border-gray-100">
            <h4 className="text-sm font-medium text-gray-700 mb-2">🤖 AI Suggestions:</h4>
            {suggestions.nlpSuggestions.slice(0, 5).map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="block w-full text-left px-2 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
              >
                💡 {suggestion}
              </button>
            ))}
          </div>
        )}

        {/* Regular Suggestions */}
        {suggestions.suggestions && (
          <>
            {suggestions.suggestions.titles && Array.isArray(suggestions.suggestions.titles) && suggestions.suggestions.titles.length > 0 && (
              <div className="p-3 border-b border-gray-100">
                <h4 className="text-xs font-medium text-gray-500 mb-1">Job Titles:</h4>
                {suggestions.suggestions.titles.slice(0, 3).map((title, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(title)}
                    className="block w-full text-left px-2 py-1 text-sm hover:bg-gray-50 rounded transition-colors"
                  >
                    💼 {title}
                  </button>
                ))}
              </div>
            )}
            
            {suggestions.suggestions.companies && Array.isArray(suggestions.suggestions.companies) && suggestions.suggestions.companies.length > 0 && (
              <div className="p-3 border-b border-gray-100">
                <h4 className="text-xs font-medium text-gray-500 mb-1">Companies:</h4>
                {suggestions.suggestions.companies.slice(0, 3).map((company, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(company)}
                    className="block w-full text-left px-2 py-1 text-sm hover:bg-gray-50 rounded transition-colors"
                  >
                    🏢 {company}
                  </button>
                ))}
              </div>
            )}

            {suggestions.suggestions.skills && Array.isArray(suggestions.suggestions.skills) && suggestions.suggestions.skills.length > 0 && (
              <div className="p-3 border-b border-gray-100">
                <h4 className="text-xs font-medium text-gray-500 mb-1">Skills:</h4>
                {suggestions.suggestions.skills.slice(0, 3).map((skill, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(skill)}
                    className="block w-full text-left px-2 py-1 text-sm hover:bg-gray-50 rounded transition-colors"
                  >
                    🛠️ {skill}
                  </button>
                ))}
              </div>
            )}

            {suggestions.suggestions.locations && Array.isArray(suggestions.suggestions.locations) && suggestions.suggestions.locations.length > 0 && (
              <div className="p-3 border-b border-gray-100">
                <h4 className="text-xs font-medium text-gray-500 mb-1">Locations:</h4>
                {suggestions.suggestions.locations.slice(0, 3).map((location, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(location)}
                    className="block w-full text-left px-2 py-1 text-sm hover:bg-gray-50 rounded transition-colors"
                  >
                    📍 {location}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* Search History */}
        {searchHistory.length > 0 && (
          <div className="p-3">
            <h4 className="text-xs font-medium text-gray-500 mb-2">Recent Searches:</h4>
            {searchHistory.slice(0, 5).map((query, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(query)}
                className="block w-full text-left px-2 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded transition-colors"
              >
                🕐 {query}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Find Your Dream Job
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            {isNLPSearch 
              ? "🤖 Use natural language - describe what you're looking for!" 
              : "🔍 Search for jobs using keywords and filters"
            }
          </p>
        </div>

        {/* Search Section */}
        <div className="max-w-4xl mx-auto mb-8">
          <form onSubmit={handleSearch} className="relative">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                placeholder={
                  isNLPSearch 
                    ? "Try: 'Find me remote React developer jobs with 80k+ salary'" 
                    : "Search by job title, company, skills, or location..."
                }
                className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none pr-40"
              />
              
              {/* Search Controls */}
              <div className="absolute right-2 top-2 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsNLPSearch(!isNLPSearch)}
                  className={`px-3 py-2 text-xs font-medium rounded transition-colors ${
                    isNLPSearch 
                      ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                      : 'bg-gray-100 text-gray-600 border border-gray-200'
                  }`}
                  title={isNLPSearch ? "AI Natural Language Search" : "Basic Keyword Search"}
                >
                  {isNLPSearch ? '🤖 AI' : '🔍 Basic'}
                </button>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '⏳' : 'Search'}
                </button>
              </div>
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && renderSuggestions()}
          </form>

          {/* Connection Status */}
          <div className="mt-2 text-xs text-gray-500 text-center">
            API: {API_BASE_URL} {auth?.token ? '(Authenticated)' : '(Public)'}
          </div>

          {/* NLP Examples */}
          {!searchQuery && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">💡 Try these AI search examples:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {nlpExamples.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => handleExampleClick(example)}
                    className="text-left px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors"
                  >
                    "{example}"
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Parsed Query Display */}
        {renderParsedQuery()}

        {/* Results Section */}
        <div className="max-w-6xl mx-auto">
          {/* Results Header */}
          {!loading && (
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  {searchQuery ? 'Search Results' : 'Latest Jobs'}
                </h2>
                <p className="text-gray-600">
                  {pagination.total > 0 
                    ? `${pagination.total} jobs found` 
                    : 'No jobs found'
                  }
                  {isNLPSearch && searchQuery && (
                    <span className="ml-2 text-blue-600">• AI Search Active</span>
                  )}
                </p>
              </div>
              
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setParsedQuery(null);
                    fetchJobs();
                  }}
                  className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Clear Search
                </button>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <i className="fas fa-exclamation-circle text-red-500"></i>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                  <p className="text-xs text-red-600 mt-1">
                    Make sure your backend server is running on {API_BASE_URL}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">
                {isNLPSearch ? 'AI is analyzing your request...' : 'Searching jobs...'}
              </span>
            </div>
          )}

          {/* Jobs Grid */}
          {!loading && jobs.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
              {jobs.map(renderJobCard)}
            </div>
          )}

          {/* No Results */}
          {!loading && jobs.length === 0 && !error && (
            <div className="text-center py-12">
              <i className="fas fa-search text-gray-400 text-4xl mb-4"></i>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
              <p className="text-gray-600 mb-6">
                {searchQuery 
                  ? isNLPSearch 
                    ? "Try rephrasing your search in different words or be more general"
                    : "Try adjusting your search terms or use different keywords"
                  : "No jobs are currently available. Check back later for new opportunities"
                }
              </p>
              {searchQuery && (
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setParsedQuery(null);
                      fetchJobs();
                    }}
                    className="block mx-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Browse All Jobs
                  </button>
                  
                  {!isNLPSearch && (
                    <button
                      onClick={() => {
                        setIsNLPSearch(true);
                        fetchJobs(searchQuery, 1);
                      }}
                      className="block mx-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Try AI Search Instead
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && !loading && (
            <div className="flex justify-center items-center space-x-2 mt-8">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className={`px-3 py-2 rounded-lg transition-colors ${
                  pagination.currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                <i className="fas fa-chevron-left"></i>
              </button>

              {/* Page Numbers */}
              {(() => {
                const currentPage = pagination.currentPage;
                const totalPages = pagination.totalPages;
                const maxVisible = 5;
                
                let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                let endPage = Math.min(totalPages, startPage + maxVisible - 1);
                
                if (endPage - startPage + 1 < maxVisible) {
                  startPage = Math.max(1, endPage - maxVisible + 1);
                }
                
                const pageNumbers = [];
                for (let i = startPage; i <= endPage; i++) {
                  pageNumbers.push(i);
                }
                
                return pageNumbers.map(pageNum => {
                  const isActive = pageNum === currentPage;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-2 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                });
              })()}

              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className={`px-3 py-2 rounded-lg transition-colors ${
                  pagination.currentPage === pagination.totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          )}
        </div>

        {/* Debug Information (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="max-w-4xl mx-auto mt-8 p-4 bg-gray-100 rounded-lg text-xs text-gray-600">
            <details>
              <summary className="cursor-pointer font-medium mb-2">Debug Information</summary>
              <div className="space-y-2">
                <div><strong>API Base URL:</strong> {API_BASE_URL}</div>
                <div><strong>Auth Token:</strong> {auth?.token ? 'Present' : 'Not present'}</div>
                <div><strong>Current Search:</strong> {searchQuery || 'None'}</div>
                <div><strong>NLP Mode:</strong> {isNLPSearch ? 'Enabled' : 'Disabled'}</div>
                <div><strong>Jobs Count:</strong> {jobs.length}</div>
                <div><strong>Total Jobs:</strong> {pagination.total}</div>
                <div><strong>Current Page:</strong> {pagination.currentPage} of {pagination.totalPages}</div>
                <div><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</div>
                <div><strong>Error:</strong> {error || 'None'}</div>
                {parsedQuery && (
                  <div><strong>Parsed Query:</strong> {JSON.stringify(parsedQuery, null, 2)}</div>
                )}
              </div>
            </details>
          </div>
        )}

        {/* Floating Action Buttons */}
        <div className="fixed bottom-6 right-6 space-y-2">
          {/* Refresh Button */}
          <button
            onClick={() => fetchJobs(searchQuery, pagination.currentPage)}
            disabled={loading}
            className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            title="Refresh Jobs"
          >
            <i className={`fas fa-sync-alt ${loading ? 'animate-spin' : ''}`}></i>
          </button>

          {/* Scroll to Top Button */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="bg-gray-600 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition-colors"
            title="Scroll to Top"
          >
            <i className="fas fa-arrow-up"></i>
          </button>
        </div>

        {/* Footer Info */}
        <div className="max-w-4xl mx-auto mt-12 text-center text-sm text-gray-500">
          <p>
            💡 Tip: Use natural language with AI search for better results. 
            Try phrases like "remote software jobs with good salary" or "entry level marketing in NYC"
          </p>
          <div className="mt-2 flex justify-center space-x-4 text-xs">
            <span>🤖 AI Search: {isNLPSearch ? 'Active' : 'Inactive'}</span>
            <span>•</span>
            <span>📊 Total Jobs: {pagination.total}</span>
            <span>•</span>
            <span>🔄 Last Updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedJobSearch;