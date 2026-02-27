import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            <Link to="/" className="flex items-center mb-4">
              <i className="fas fa-briefcase text-blue-400 text-2xl mr-2"></i>
              <span className="font-bold text-xl text-white">PartTime.lk</span>
            </Link>
            <p className="text-gray-400 mb-4">
              Connecting talented professionals with amazing opportunities. Find your dream job or the perfect candidate today.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <i className="fab fa-linkedin-in"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <i className="fab fa-instagram"></i>
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/jobs" className="text-gray-400 hover:text-white">Find Jobs</Link>
              </li>
              <li>
                <Link to="/companies" className="text-gray-400 hover:text-white">Browse Companies</Link>
              </li>
              <li>
                <Link to="/resources" className="text-gray-400 hover:text-white">Career Resources</Link>
              </li>
              <li>
                <Link to="/pricing" className="text-gray-400 hover:text-white">Pricing Plans</Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-400 hover:text-white">About Us</Link>
              </li>
            </ul>
          </div>
          
          {/* For Job Seekers */}
          <div>
            <h3 className="text-lg font-semibold mb-4">For Job Seekers</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/register?type=seeker" className="text-gray-400 hover:text-white">Create Account</Link>
              </li>
              <li>
                <Link to="/profile/seeker" className="text-gray-400 hover:text-white">Profile Builder</Link>
              </li>
              <li>
                <Link to="/jobs/saved" className="text-gray-400 hover:text-white">Saved Jobs</Link>
              </li>
              <li>
                <Link to="/applications" className="text-gray-400 hover:text-white">Applications</Link>
              </li>
              <li>
                <Link to="/resources/resume" className="text-gray-400 hover:text-white">Resume Tips</Link>
              </li>
            </ul>
          </div>
          
          {/* For Employers */}
          <div>
            <h3 className="text-lg font-semibold mb-4">For Employers</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/register?type=employer" className="text-gray-400 hover:text-white">Create Account</Link>
              </li>
              <li>
                <Link to="/post-job" className="text-gray-400 hover:text-white">Post a Job</Link>
              </li>
              <li>
                <Link to="/dashboard/employer" className="text-gray-400 hover:text-white">Employer Dashboard</Link>
              </li>
              <li>
                <Link to="/pricing" className="text-gray-400 hover:text-white">Pricing</Link>
              </li>
              <li>
                <Link to="/resources/hiring" className="text-gray-400 hover:text-white">Hiring Tips</Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">
              © {new Date().getFullYear()} PartTime.lk. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link to="/terms" className="text-gray-400 hover:text-white text-sm">
                Terms of Service
              </Link>
              <Link to="/privacy" className="text-gray-400 hover:text-white text-sm">
                Privacy Policy
              </Link>
              <Link to="/cookies" className="text-gray-400 hover:text-white text-sm">
                Cookie Policy
              </Link>
              <Link to="/contact" className="text-gray-400 hover:text-white text-sm">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;