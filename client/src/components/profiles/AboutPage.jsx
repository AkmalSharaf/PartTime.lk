// src/components/AboutPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const AboutPage = () => {
  const [stats, setStats] = useState({
    jobsCount: 0,
    employersCount: 0,
    jobSeekersCount: 0,
    applicationsCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        // In a real application, you would fetch statistics from your backend
        const response = await axios.get('http://localhost:5000/api/stats');
        setStats(response.data.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching stats:', err);
        
        // Fallback to sample data if API not implemented yet
        setStats({
          jobsCount: 1042,
          employersCount: 328,
          jobSeekersCount: 5724,
          applicationsCount: 8546
        });
        setLoading(false);
        setError('Using sample data - API endpoint not implemented yet');
      }
    };

    fetchStats();
  }, []);

  // Team members data
  const teamMembers = [
    {
      name: 'Akmal Sharaf',
      title: 'CEO & Co-Founder',
      bio: 'Former HR executive with 15+ years of experience in talent acquisition.',
      image: '/images/team/1.jpg'
      
    },
    {
      name: 'Michael Chen',
      title: 'CTO & Co-Founder',
      bio: 'Tech entrepreneur with a passion for creating innovative HR solutions.',
      image: '/images/team/michael.jpg'
    },
    {
      name: 'Jessica Williams',
      title: 'Head of Customer Success',
      bio: 'Dedicated to ensuring both job seekers and employers achieve their goals.',
      image: '/images/team/jessica.jpg'
    },
    {
      name: 'David Rodriguez',
      title: 'Lead Developer',
      bio: 'Full-stack engineer focused on creating seamless user experiences.',
      image: '/images/team/david.jpg'
    }
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <div className="bg-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">About Us</h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Connecting talent with opportunity and helping companies find their perfect match
            </p>
          </div>
        </div>
      </div>

      {/* Our Mission */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Our Mission</h2>
          <div className="max-w-3xl mx-auto">
            <p className="text-lg text-gray-600 mb-6">
              At PartTime.lk, we believe that the right job can change a person's life, and the right 
              talent can transform a business. Our mission is to create meaningful connections 
              between job seekers and employers, making the hiring process more efficient, 
              transparent, and successful for everyone involved.
            </p>
            <p className="text-lg text-gray-600">
              We're committed to developing innovative tools and resources that empower job seekers 
              to showcase their skills and find opportunities that match their ambitions, while 
              helping employers discover exceptional talent that drives their business forward.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Our Impact</h2>
          
          {error && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8 max-w-3xl mx-auto">
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
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {loading ? (
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                ) : (
                  new Intl.NumberFormat().format(stats.jobsCount)
                )}
              </div>
              <div className="text-gray-600 font-medium">Jobs Posted</div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {loading ? (
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                ) : (
                  new Intl.NumberFormat().format(stats.employersCount)
                )}
              </div>
              <div className="text-gray-600 font-medium">Companies</div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {loading ? (
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                ) : (
                  new Intl.NumberFormat().format(stats.jobSeekersCount)
                )}
              </div>
              <div className="text-gray-600 font-medium">Job Seekers</div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {loading ? (
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                ) : (
                  new Intl.NumberFormat().format(stats.applicationsCount)
                )}
              </div>
              <div className="text-gray-600 font-medium">Applications</div>
            </div>
          </div>
        </div>
      </div>

      {/* Our Story */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Our Story</h2>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <img src="/images/about-story.jpg" alt="Our journey" className="rounded-lg shadow-md w-full" />
          </div>
          <div>
            <p className="text-lg text-gray-600 mb-6">
              PartTime.lk was founded in 2021 by Sarah Johnson and Michael Chen, who recognized the 
              need for a more efficient and effective job matching platform in the wake of rapidly 
              changing work environments.
            </p>
            <p className="text-lg text-gray-600 mb-6">
              Having experienced the challenges of hiring and job searching firsthand, they set out to 
              create a solution that would address the pain points on both sides of the employment 
              equation.
            </p>
            <p className="text-lg text-gray-600">
              What started as a small project has grown into a thriving platform used by thousands of 
              companies and job seekers worldwide. We continue to evolve our platform based on user 
              feedback and industry trends, always with our core mission in mind: connecting the right 
              people with the right opportunities.
            </p>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Meet Our Team</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <div key={index} className="bg-gray-50 rounded-lg overflow-hidden shadow-md transition hover:shadow-lg">
                <div className="h-64 bg-gray-200">
                  {member.image ? (
                    <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-100">
                      <span className="text-5xl font-bold text-blue-600">
                        {member.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-xl text-gray-900">{member.name}</h3>
                  <p className="text-blue-600 mb-3">{member.title}</p>
                  <p className="text-gray-600">{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Our Values</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-handshake text-2xl text-blue-600"></i>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">Integrity</h3>
            <p className="text-gray-600 text-center">
              We believe in honesty, transparency, and ethical practices in everything we do. We're committed to building trust with our users and partners.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-lightbulb text-2xl text-blue-600"></i>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">Innovation</h3>
            <p className="text-gray-600 text-center">
              We continuously strive to improve our platform and services, embracing new technologies and ideas to provide the best possible experience.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-users text-2xl text-blue-600"></i>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">Inclusion</h3>
            <p className="text-gray-600 text-center">
              We're dedicated to creating a platform that's accessible and beneficial to everyone, regardless of background, promoting diversity in the workplace.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Join Our Community Today</h2>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-8">
            Whether you're looking for your next career move or searching for top talent, we're here to help you succeed.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              to="/register?type=seeker" 
              className="bg-white text-blue-600 hover:bg-gray-50 transition font-medium py-3 px-8 rounded-lg shadow-md"
            >
              Create Job Seeker Account
            </Link>
            <Link 
              to="/register?type=employer" 
              className="bg-blue-800 text-white hover:bg-blue-900 transition font-medium py-3 px-8 rounded-lg shadow-md"
            >
              Create Employer Account
            </Link>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Contact Us</h2>
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Get In Touch</h3>
            <p className="text-gray-600 mb-6">
              Have questions or feedback? We'd love to hear from you. Our support team is always here to help.
            </p>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <i className="fas fa-map-marker-alt text-blue-600"></i>
                </div>
                <div className="ml-4">
                  <p className="text-gray-900 font-medium">Address</p>
                  <p className="text-gray-600">123 Tech Street, Suite 456, San Francisco, CA 94107</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <i className="fas fa-envelope text-blue-600"></i>
                </div>
                <div className="ml-4">
                  <p className="text-gray-900 font-medium">Email</p>
                  <p className="text-gray-600">support@PartTime.lk.com</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <i className="fas fa-phone text-blue-600"></i>
                </div>
                <div className="ml-4">
                  <p className="text-gray-900 font-medium">Phone</p>
                  <p className="text-gray-600">+1 (555) 123-4567</p>
                </div>
              </div>
            </div>
          </div>
          <div>
            <form className="bg-white rounded-lg shadow-md p-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Your name"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Your email"
                    required
                  />
                </div>
              </div>
              <div className="mb-4">
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Subject of your message"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  id="message"
                  rows="4"
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Your message"
                  required
                ></textarea>
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;