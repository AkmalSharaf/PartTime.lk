import React from 'react';
// import Navbar from './components/Navbar';
// import Footer from './components/Footer';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* <Navbar />
       */}
      {/* Hero Section */}
      <div className="relative bg-gray-900 text-white">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/70 to-blue-800/70"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Find Your Dream Job Today
            </h1>
            <p className="text-lg md:text-xl max-w-2xl mx-auto mb-8 text-gray-200">
              Connect with top employers and discover opportunities that match your skills and ambitions
            </p>
            
            {/* Search Bar */}
            {/* <div className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-2">
              <div className="flex-1 bg-white rounded-lg overflow-hidden flex items-center px-4 py-2">
                <i className="fas fa-search text-gray-400 mr-2"></i>
                <input
                  type="text"
                  placeholder="Job title, keywords, or company"
                  className="w-full py-2 px-1 focus:outline-none text-gray-800"
                />
              </div>
              <div className="bg-white rounded-lg overflow-hidden flex items-center px-4 py-2">
                <i className="fas fa-map-marker-alt text-gray-400 mr-2"></i>
                <input
                  type="text"
                  placeholder="Location"
                  className="w-full py-2 px-1 focus:outline-none text-gray-800"
                />
              </div>
              <button className="bg-blue-600 hover:bg-blue-700 transition text-white font-medium py-3 px-6 rounded-lg">
                Search Jobs
              </button>
            </div> */}
            
            {/* Job Seeker / Employer Options */}
            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
              <Link 
                to="/register?type=seeker" 
                className="bg-white text-blue-600 hover:bg-gray-100 transition font-medium py-3 px-8 rounded-lg shadow-md"
              >
                I'm looking for a job
              </Link>
              <Link 
                to="/register?type=employer" 
                className="bg-blue-800 text-white hover:bg-blue-900 transition font-medium py-3 px-8 rounded-lg shadow-md"
              >
                I'm hiring
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">10k+</div>
              <div className="text-gray-600">Jobs Available</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">5k+</div>
              <div className="text-gray-600">Companies</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">25k+</div>
              <div className="text-gray-600">Job Seekers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">1k+</div>
              <div className="text-gray-600">Jobs Filled</div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Jobs Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Jobs</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover opportunities from top employers across industries
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Job Card 1 */}
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center mr-4">
                  <span className="text-blue-600 font-bold">GD</span>
                </div>
                <div>
                  <h3 className="font-medium text-lg text-gray-900">Senior Frontend Developer</h3>
                  <p className="text-gray-600">GlobalTech</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 my-4">
                <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">Full-time</span>
                <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">Remote</span>
                <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">$80k-$120k</span>
              </div>
              
              <ul className="space-y-2 mb-4">
                <li className="flex items-center text-gray-600">
                  <i className="fas fa-map-marker-alt text-blue-600 mr-2 w-5"></i>
                  <span>New York, NY (Remote)</span>
                </li>
                <li className="flex items-center text-gray-600">
                  <i className="fas fa-briefcase text-blue-600 mr-2 w-5"></i>
                  <span>5+ years experience</span>
                </li>
                <li className="flex items-center text-gray-600">
                  <i className="fas fa-clock text-blue-600 mr-2 w-5"></i>
                  <span>Posted 2 days ago</span>
                </li>
              </ul>
              
              <Link to="/job/1" className="block text-center bg-blue-600 hover:bg-blue-700 transition text-white font-medium py-2 px-4 rounded-lg mt-4">
                View Details
              </Link>
            </div>
            
            {/* Job Card 2 */}
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center mr-4">
                  <span className="text-blue-600 font-bold">AC</span>
                </div>
                <div>
                  <h3 className="font-medium text-lg text-gray-900">Product Manager</h3>
                  <p className="text-gray-600">AppCore Solutions</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 my-4">
                <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">Full-time</span>
                <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">Hybrid</span>
                <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">$90k-$130k</span>
              </div>
              
              <ul className="space-y-2 mb-4">
                <li className="flex items-center text-gray-600">
                  <i className="fas fa-map-marker-alt text-blue-600 mr-2 w-5"></i>
                  <span>San Francisco, CA</span>
                </li>
                <li className="flex items-center text-gray-600">
                  <i className="fas fa-briefcase text-blue-600 mr-2 w-5"></i>
                  <span>3+ years experience</span>
                </li>
                <li className="flex items-center text-gray-600">
                  <i className="fas fa-clock text-blue-600 mr-2 w-5"></i>
                  <span>Posted 1 week ago</span>
                </li>
              </ul>
              
              <Link to="/job/2" className="block text-center bg-blue-600 hover:bg-blue-700 transition text-white font-medium py-2 px-4 rounded-lg mt-4">
                View Details
              </Link>
            </div>
            
            {/* Job Card 3 */}
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center mr-4">
                  <span className="text-blue-600 font-bold">TF</span>
                </div>
                <div>
                  <h3 className="font-medium text-lg text-gray-900">Data Scientist</h3>
                  <p className="text-gray-600">TechFusion</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 my-4">
                <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">Full-time</span>
                <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">On-site</span>
                <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">$110k-$150k</span>
              </div>
              
              <ul className="space-y-2 mb-4">
                <li className="flex items-center text-gray-600">
                  <i className="fas fa-map-marker-alt text-blue-600 mr-2 w-5"></i>
                  <span>Boston, MA</span>
                </li>
                <li className="flex items-center text-gray-600">
                  <i className="fas fa-briefcase text-blue-600 mr-2 w-5"></i>
                  <span>4+ years experience</span>
                </li>
                <li className="flex items-center text-gray-600">
                  <i className="fas fa-clock text-blue-600 mr-2 w-5"></i>
                  <span>Posted 3 days ago</span>
                </li>
              </ul>
              
              <Link to="/job/3" className="block text-center bg-blue-600 hover:bg-blue-700 transition text-white font-medium py-2 px-4 rounded-lg mt-4">
                View Details
              </Link>
            </div>
          </div>
          
          <div className="text-center mt-10">
            <Link to="/jobs" className="inline-block bg-white border border-blue-600 text-blue-600 hover:bg-blue-50 transition font-medium py-3 px-8 rounded-lg">
              Browse All Jobs
            </Link>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Simple steps to find your dream job or hire the perfect candidate
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-user-plus text-2xl text-blue-600"></i>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Create Account</h3>
              <p className="text-gray-600">
                Register as a job seeker or employer and complete your profile
              </p>
            </div>
            
            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-search text-2xl text-blue-600"></i>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                {`${true ? 'Explore Jobs' : 'Post Jobs'}`}
              </h3>
              <p className="text-gray-600">
                {`${true ? 'Search and filter jobs that match your skills and preferences' : 'Create job listings with detailed requirements and benefits'}`}
              </p>
            </div>
            
            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-check-circle text-2xl text-blue-600"></i>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                {`${true ? 'Apply & Get Hired' : 'Review & Hire'}`}
              </h3>
              <p className="text-gray-600">
                {`${true ? 'Submit applications and connect with employers' : 'Evaluate applicants and find the perfect match for your team'}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Categories Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Job Categories</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Explore opportunities across popular industries
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {/* Category 1 */}
            <Link to="/jobs" className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-laptop-code text-blue-600"></i>
              </div>
              <h3 className="font-medium text-gray-900">Technology</h3>
              <p className="text-blue-600 mt-1">1,204 jobs</p>
            </Link>
            
            {/* Category 2 */}
            <Link to="/jobs" className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-bullhorn text-blue-600"></i>
              </div>
              <h3 className="font-medium text-gray-900">Marketing</h3>
              <p className="text-blue-600 mt-1">567 jobs</p>
            </Link>
            
            {/* Category 3 */}
            <Link to="/jobs" className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-chart-line text-blue-600"></i>
              </div>
              <h3 className="font-medium text-gray-900">Finance</h3>
              <p className="text-blue-600 mt-1">432 jobs</p>
            </Link>
            
            {/* Category 4 */}
            <Link to="/jobs" className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-heartbeat text-blue-600"></i>
              </div>
              <h3 className="font-medium text-gray-900">Healthcare</h3>
              <p className="text-blue-600 mt-1">867 jobs</p>
            </Link>
            
            {/* Category 5 */}
            <Link to="/jobs" className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-palette text-blue-600"></i>
              </div>
              <h3 className="font-medium text-gray-900">Design</h3>
              <p className="text-blue-600 mt-1">349 jobs</p>
            </Link>
            
            {/* Category 6 */}
            <Link to="/jobs" className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-graduation-cap text-blue-600"></i>
              </div>
              <h3 className="font-medium text-gray-900">Education</h3>
              <p className="text-blue-600 mt-1">517 jobs</p>
            </Link>
            
            {/* Category 7 */}
            <Link to="/jobs" className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-cogs text-blue-600"></i>
              </div>
              <h3 className="font-medium text-gray-900">Engineering</h3>
              <p className="text-blue-600 mt-1">893 jobs</p>
            </Link>
            
            {/* Category 8 */}
            <Link to="/jobs" className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-ellipsis-h text-blue-600"></i>
              </div>
              <h3 className="font-medium text-gray-900">More Categories</h3>
              <p className="text-blue-600 mt-1">2,500+ jobs</p>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Testimonials Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Success Stories</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Hear from users who found their dream jobs or ideal candidates
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Testimonial 1 */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div>
                  <h3 className="font-medium text-gray-900">Sarah Johnson</h3>
                  <p className="text-blue-600">UX Designer at TechCorp</p>
                </div>
              </div>
              <p className="text-gray-600">
                "I found my dream job within just two weeks of using this platform. The process was smooth and the employer profiles were very detailed."
              </p>
              <div className="flex text-yellow-400 mt-3">
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
              </div>
            </div>
            
            {/* Testimonial 2 */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div>
                  <h3 className="font-medium text-gray-900">John Smith</h3>
                  <p className="text-blue-600">HR Manager at InnoTech</p>
                </div>
              </div>
              <p className="text-gray-600">
                "As an employer, this platform has revolutionized our hiring process. We've found excellent candidates who perfectly match our requirements."
              </p>
              <div className="flex text-yellow-400 mt-3">
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star-half-alt"></i>
              </div>
            </div>
            
            {/* Testimonial 3 */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div>
                  <h3 className="font-medium text-gray-900">Lisa Chen</h3>
                  <p className="text-blue-600">Software Engineer at DataFlow</p>
                </div>
              </div>
              <p className="text-gray-600">
                "The job matching algorithm is incredibly accurate. I received notifications for positions that aligned perfectly with my skills and preferences."
              </p>
              <div className="flex text-yellow-400 mt-3">
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="py-16 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Ready to Start Your Journey?</h2>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-8">
            Join thousands of job seekers and employers who have found success on our platform
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
      
      {/* <Footer /> */}
    </div>
  );
};

export default HomePage;