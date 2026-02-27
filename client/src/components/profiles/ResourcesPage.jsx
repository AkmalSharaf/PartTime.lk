// src/components/ResourcesPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const ResourcesPage = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState('all');

  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoading(true);
        // In a real application, you would fetch resources from your backend
        // For now, we'll attempt to fetch but handle the case where the endpoint might not exist yet
        const response = await axios.get('http://localhost:5000/api/resources');
        setResources(response.data.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching resources:', err);
        
        // Fallback to sample data if API not implemented yet
        const sampleResources = [
          {
            _id: '1',
            title: 'Resume Writing Guide',
            category: 'resume',
            description: 'Learn how to craft a professional resume that stands out to employers.',
            imageUrl: '/images/resume-guide.jpg',
            link: '/resources/resume-guide',
            createdAt: new Date().toISOString()
          },
          {
            _id: '2',
            title: 'Interview Preparation Tips',
            category: 'interview',
            description: 'Essential tips to help you ace your next job interview.',
            imageUrl: '/images/interview-tips.jpg',
            link: '/resources/interview-tips',
            createdAt: new Date().toISOString()
          },
          {
            _id: '3',
            title: 'Salary Negotiation Strategies',
            category: 'career',
            description: 'How to negotiate the best compensation package for your skills and experience.',
            imageUrl: '/images/salary-negotiation.jpg',
            link: '/resources/salary-negotiation',
            createdAt: new Date().toISOString()
          },
          {
            _id: '4',
            title: 'Effective Job Search Techniques',
            category: 'job-search',
            description: 'Strategic approaches to finding and landing your dream job faster.',
            imageUrl: '/images/job-search.jpg',
            link: '/resources/job-search-techniques',
            createdAt: new Date().toISOString()
          },
          {
            _id: '5',
            title: 'Employer Branding Guide',
            category: 'employer',
            description: 'How to build a strong employer brand that attracts top talent.',
            imageUrl: '/images/employer-branding.jpg',
            link: '/resources/employer-branding',
            createdAt: new Date().toISOString()
          },
          {
            _id: '6',
            title: 'Remote Work Best Practices',
            category: 'career',
            description: 'Tips for maintaining productivity and work-life balance in remote positions.',
            imageUrl: '/images/remote-work.jpg',
            link: '/resources/remote-work',
            createdAt: new Date().toISOString()
          }
        ];
        
        setResources(sampleResources);
        setLoading(false);
        setError('Using sample data - API endpoint not implemented yet');
      }
    };

    fetchResources();
  }, []);

  const filteredResources = category === 'all' 
    ? resources 
    : resources.filter(resource => resource.category === category);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <div className="bg-blue-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Career Resources</h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Helpful guides, tips, and tools to advance your career and hiring process
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              className={`px-4 py-2 rounded-full ${
                category === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setCategory('all')}
            >
              All Resources
            </button>
            <button
              className={`px-4 py-2 rounded-full ${
                category === 'resume'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setCategory('resume')}
            >
              Resume Writing
            </button>
            <button
              className={`px-4 py-2 rounded-full ${
                category === 'interview'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setCategory('interview')}
            >
              Interview Prep
            </button>
            <button
              className={`px-4 py-2 rounded-full ${
                category === 'job-search'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setCategory('job-search')}
            >
              Job Search
            </button>
            <button
              className={`px-4 py-2 rounded-full ${
                category === 'career'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setCategory('career')}
            >
              Career Development
            </button>
            <button
              className={`px-4 py-2 rounded-full ${
                category === 'employer'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setCategory('employer')}
            >
              For Employers
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Resources Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading resources...</p>
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No resources found for this category.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource) => (
              <Link
                to={resource.link}
                key={resource._id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden"
              >
                <div className="h-48 bg-gray-200 relative">
                  {resource.imageUrl ? (
                    <img
                      src={resource.imageUrl}
                      alt={resource.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <i className="fas fa-file-alt text-4xl"></i>
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
                    {resource.category === 'resume' && 'Resume'}
                    {resource.category === 'interview' && 'Interview'}
                    {resource.category === 'job-search' && 'Job Search'}
                    {resource.category === 'career' && 'Career'}
                    {resource.category === 'employer' && 'For Employers'}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-medium text-lg text-gray-900 mb-2">{resource.title}</h3>
                  <p className="text-gray-600 mb-4">{resource.description}</p>
                  <div className="flex items-center text-gray-500 text-sm">
                    <i className="far fa-calendar mr-2"></i>
                    <span>
                      {new Date(resource.createdAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Newsletter Signup */}
        <div className="bg-blue-600 rounded-lg shadow-md p-8 mt-12">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-white mb-4">
              Get Career Resources Delivered to Your Inbox
            </h2>
            <p className="text-blue-100 mb-6">
              Sign up for our newsletter to receive the latest career tips, job search strategies, and
              industry insights.
            </p>
            <form className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                placeholder="Your email address"
                className="flex-1 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
              <button
                type="submit"
                className="bg-white text-blue-600 hover:bg-blue-50 transition px-6 py-3 rounded-lg font-medium"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourcesPage;