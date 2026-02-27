// src/components/ResourceDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import parse from 'html-react-parser';

const ResourceDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [resource, setResource] = useState(null);
  const [relatedResources, setRelatedResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper function to convert any object values to strings
  const safeStringify = (obj) => {
    const processValue = (value) => {
      if (value === null || value === undefined) {
        return '';
      }
      if (typeof value === 'object') {
        return JSON.stringify(value);
      }
      return value;
    };

    if (typeof obj === 'object' && obj !== null) {
      const processed = {};
      for (const key in obj) {
        processed[key] = processValue(obj[key]);
      }
      return processed;
    }
    
    return obj;
  };

  useEffect(() => {
    const fetchResource = async () => {
      try {
        setLoading(true);
        
        // In a real application, you would fetch resource by slug from your backend
        // For now, we'll attempt to fetch but handle the case where the endpoint might not exist yet
        const response = await axios.get(`http://localhost:5000/api/resources?link=/resources/${slug}`);
        
        // Check if resource exists
        if (response.data.count === 0) {
          throw new Error('Resource not found');
        }
        
        // Ensure we convert any object values to strings to avoid React rendering issues
        setResource(safeStringify(response.data.data[0]));
        
        // Fetch related resources
        const relatedRes = await axios.get(`http://localhost:5000/api/resources?category=${response.data.data[0].category}&limit=3`);
        
        // Filter out the current resource and convert object values to strings
        const filtered = relatedRes.data.data
          .filter(item => item._id !== response.data.data[0]._id)
          .map(item => safeStringify(item));
          
        setRelatedResources(filtered);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching resource:', err);
        
        // Fallback to sample data if API not implemented yet
        const sampleResources = [
          {
            _id: '1',
            title: 'Resume Writing Guide',
            category: 'resume',
            description: 'Learn how to craft a professional resume that stands out to employers.',
            content: `
              <h2>Resume Writing Guide</h2>
              <p>A well-crafted resume is your ticket to landing an interview for your dream job. This comprehensive guide will walk you through the essential steps to create a resume that stands out to employers and effectively showcases your skills and experience.</p>
              
              <h3>1. Choose the Right Format</h3>
              <p>There are three main resume formats to consider:</p>
              <ul>
                <li><strong>Chronological:</strong> Lists your work history in reverse chronological order. Best for candidates with a clear career progression.</li>
                <li><strong>Functional:</strong> Emphasizes skills over work history. Ideal for career changers or those with employment gaps.</li>
                <li><strong>Combination:</strong> Blends elements of both. Good for experienced professionals highlighting both skills and accomplishments.</li>
              </ul>
              
              <h3>2. Include Essential Sections</h3>
              <p>Every effective resume should include:</p>
              <ul>
                <li><strong>Contact Information:</strong> Name, phone, email, LinkedIn profile, and optionally your location.</li>
                <li><strong>Professional Summary:</strong> A brief overview of your professional background and key qualifications.</li>
                <li><strong>Work Experience:</strong> Your job history with company names, dates, positions, and accomplishments.</li>
                <li><strong>Education:</strong> Academic credentials, certifications, and relevant training.</li>
                <li><strong>Skills:</strong> Technical, soft, and industry-specific skills relevant to the job.</li>
              </ul>
              
              <h3>3. Highlight Achievements, Not Just Duties</h3>
              <p>Instead of simply listing job responsibilities, focus on your accomplishments. Use the formula: Action Verb + Task + Result.</p>
              <p>Example: "Implemented a new CRM system that increased sales team productivity by 25% and customer satisfaction by 15%."</p>
              
              <h3>4. Tailor Your Resume for Each Application</h3>
              <p>Customize your resume for each job application by:</p>
              <ul>
                <li>Analyzing the job description for keywords</li>
                <li>Highlighting relevant skills and experiences</li>
                <li>Adjusting your professional summary to align with the role</li>
                <li>Rearranging sections to emphasize qualifications that match the job requirements</li>
              </ul>
              
              <h3>5. Keep It Concise and Well-Formatted</h3>
              <p>A few formatting tips to make your resume more effective:</p>
              <ul>
                <li>Limit your resume to 1-2 pages</li>
                <li>Use clean, professional fonts (e.g., Arial, Calibri, or Helvetica)</li>
                <li>Include plenty of white space</li>
                <li>Use bullet points for easy scanning</li>
                <li>Be consistent with formatting (headings, spacing, and punctuation)</li>
              </ul>
              
              <h3>6. Proofread Thoroughly</h3>
              <p>Errors can immediately disqualify your application. Proofread multiple times, use spell check, and consider asking someone else to review your resume.</p>
              
              <h3>Final Tips</h3>
              <ul>
                <li>Avoid generic phrases like "team player" or "hard worker"</li>
                <li>Use action verbs to begin bullet points</li>
                <li>Include keywords from the job description to pass through ATS systems</li>
                <li>Quantify achievements when possible (numbers, percentages, dollar amounts)</li>
                <li>Save your file as a PDF to preserve formatting</li>
              </ul>
              
              <p>Remember, your resume is your personal marketing document. It should present your skills and experience in the best possible light while remaining truthful and accurate.</p>
            `,
            imageUrl: '/images/resume-guide.jpg',
            link: '/resources/resume-guide',
            createdAt: new Date().toISOString()
          }
        ];
        
        // Find resource with matching slug
        const resourceSlug = slug.toLowerCase();
        const matchedResource = sampleResources.find(
          r => r.link.split('/').pop() === resourceSlug
        );
        
        if (!matchedResource) {
          setError('Resource not found');
          setLoading(false);
          return;
        }
        
        // Convert any object values to strings to avoid React rendering issues
        setResource(safeStringify(matchedResource));
        
        // Set related resources (excluding current one) and convert object values
        const related = sampleResources
          .filter(r => r.category === matchedResource.category && r._id !== matchedResource._id)
          .map(item => safeStringify(item));
          
        setRelatedResources(related);
        
        setLoading(false);
        setError('Using sample data - API endpoint not implemented yet');
      }
    };

    fetchResource();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        <p className="ml-2 text-gray-600">Loading resource...</p>
      </div>
    );
  }

  if (error && !resource) {
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
        <Link to="/resources" className="text-blue-600 hover:text-blue-800">
          ← Back to Resources
        </Link>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <p className="text-gray-600">Resource not found.</p>
        <Link to="/resources" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
          ← Back to Resources
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Resource Header */}
      <div className="bg-blue-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">{resource.title}</h1>
            <p className="text-lg text-blue-100 max-w-2xl mx-auto">
              {resource.description}
            </p>
            <div className="mt-4 flex justify-center items-center">
              <span className="bg-blue-800 text-white px-3 py-1 rounded-full text-sm">
                {resource.category === 'resume' && 'Resume Writing'}
                {resource.category === 'interview' && 'Interview Preparation'}
                {resource.category === 'job-search' && 'Job Search'}
                {resource.category === 'career' && 'Career Development'}
                {resource.category === 'employer' && 'For Employers'}
                {resource.category === 'other' && 'General Resource'}
              </span>
              <span className="ml-4 text-sm text-blue-100">
                Published:{' '}
                {new Date(resource.createdAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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

        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-8">
              {/* Featured Image */}
              {resource.imageUrl && (
                <div className="mb-8">
                  <img
                    src={resource.imageUrl}
                    alt={resource.title}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
              )}

              {/* Content */}
              <div className="prose prose-blue max-w-none">
                {resource.content && parse(resource.content)}
              </div>

              {/* Social Sharing */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Share this resource</h3>
                <div className="flex space-x-4">
                  <button className="text-blue-600 hover:text-blue-800">
                    <i className="fab fa-facebook-square text-2xl"></i>
                  </button>
                  <button className="text-blue-400 hover:text-blue-600">
                    <i className="fab fa-twitter-square text-2xl"></i>
                  </button>
                  <button className="text-blue-700 hover:text-blue-900">
                    <i className="fab fa-linkedin text-2xl"></i>
                  </button>
                  <button className="text-red-600 hover:text-red-800">
                    <i className="fas fa-envelope-square text-2xl"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div>
            {/* Related Resources */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-xl font-medium text-gray-900 mb-4">Related Resources</h3>
              {relatedResources.length > 0 ? (
                <div className="space-y-4">
                  {relatedResources.map((related) => (
                    <Link
                      key={related._id}
                      to={related.link}
                      className="block bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition"
                    >
                      <h4 className="font-medium text-gray-900">{related.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{related.description}</p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No related resources available.</p>
              )}
              
              <div className="mt-4">
                <Link
                  to="/resources"
                  className="text-blue-600 hover:text-blue-800 inline-flex items-center"
                >
                  <span>View all resources</span>
                  <i className="fas fa-arrow-right ml-2"></i>
                </Link>
              </div>
            </div>

            {/* Resource Categories */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-medium text-gray-900 mb-4">Categories</h3>
              <div className="space-y-2">
                <Link
                  to="/resources?category=resume"
                  className="block px-4 py-2 rounded-lg hover:bg-gray-50 transition"
                >
                  Resume Writing
                </Link>
                <Link
                  to="/resources?category=interview"
                  className="block px-4 py-2 rounded-lg hover:bg-gray-50 transition"
                >
                  Interview Preparation
                </Link>
                <Link
                  to="/resources?category=job-search"
                  className="block px-4 py-2 rounded-lg hover:bg-gray-50 transition"
                >
                  Job Search
                </Link>
                <Link
                  to="/resources?category=career"
                  className="block px-4 py-2 rounded-lg hover:bg-gray-50 transition"
                >
                  Career Development
                </Link>
                <Link
                  to="/resources?category=employer"
                  className="block px-4 py-2 rounded-lg hover:bg-gray-50 transition"
                >
                  For Employers
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Back to Resources Link */}
        <div className="mt-8">
          <Link
            to="/resources"
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            <span>Back to all resources</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResourceDetailPage;