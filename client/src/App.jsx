// src/App.jsx - Updated with Job Preferences
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './redux/store';

// Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Auth Pages
import Register from './components/auth/RegisterPage';
import Login from './components/auth/LoginPage';

// Public Pages
import HomePage from './components/HomePage';
import EnhancedJobSearch from './components/jobs/JobSearch'; // NEW - Enhanced NLP Job Search
import JobDetailPage from './components/jobs/JobDetailPage';
import CompaniesPage from './components/profiles/CompaniesPage';
import CompanyDetailPage from './components/profiles/CompanyDetailPage';
import ResourcesPage from './components/profiles/ResourcesPage';
import ResourceDetailPage from './components/profiles/ResourceDetailPage';
import AboutPage from './components/profiles/AboutPage';

// Legacy component (optional - can be removed)
import JobListingPage from './components/jobs/JobListingPage';

// Job Seeker Pages
import SeekerDashboard from './components/dashboard/SeekerDashboard';
import JobApplyPage from './components/jobs/JobApplyPage';
import ApplicationDetailPage from './components/jobs/ApplicationDetailPage';
import SeProfilePage from './components/dashboard/SeProfilePage';

// NEW - Job Preferences Page
import JobPreferencesPage from './components/preferences/JobPreferencesPage';

// Employer Pages
import EmployerDashboard from './components/dashboard/EmployerDashboard';
import CompanyProfilePage from './components/dashboard/CompanyProfilePage';
import PostJobPage from './components/jobs/PostJobPage';
import EditJobPage from './components/jobs/EditJobPage';
import JobApplicantsPage from './components/jobs/JobApplicantsPage';

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const isAuthenticated = localStorage.getItem('token');
  const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
  
  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" />;
  }
  
  if (requiredRole && user && user.role !== requiredRole) {
    // Redirect to appropriate dashboard if wrong role
    return <Navigate to={user.role === 'employer' ? '/dashboard/employer' : '/dashboard/seeker'} />;
  }
  
  return children;
};

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              
              {/* Enhanced Job Search Routes - NEW NLP POWERED */}
              <Route path="/jobs" element={<EnhancedJobSearch />} />
              <Route path="/search" element={<EnhancedJobSearch />} />
              <Route path="/browse" element={<EnhancedJobSearch />} />
              <Route path="/find-jobs" element={<EnhancedJobSearch />} />
              
              {/* Legacy job listing (optional - can be removed) */}
              <Route path="/jobs/legacy" element={<JobListingPage />} />
              
              {/* Job Details */}
              <Route path="/job/:id" element={<JobDetailPage />} />
              <Route path="/jobs/:id" element={<JobDetailPage />} />
              
              {/* Other Public Routes */}
              <Route path="/companies" element={<CompaniesPage />} />
              <Route path="/companies/:id" element={<CompanyDetailPage />} />
              <Route path="/resources" element={<ResourcesPage />} />
              <Route path="/resources/:slug" element={<ResourceDetailPage />} />
              <Route path="/about" element={<AboutPage />} />
              
              {/* Auth Routes */}
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              
              {/* Job Seeker Routes */}
              <Route 
                path="/dashboard/seeker" 
                element={
                  <ProtectedRoute requiredRole="jobseeker">
                    <SeekerDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <SeProfilePage />
                  </ProtectedRoute>
                } 
              />
              
              {/* NEW - Job Preferences Route */}
              <Route 
                path="/preferences" 
                element={
                  <ProtectedRoute requiredRole="jobseeker">
                    <JobPreferencesPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/job-preferences" 
                element={
                  <ProtectedRoute requiredRole="jobseeker">
                    <JobPreferencesPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/jobs/:id/apply" 
                element={
                  <ProtectedRoute requiredRole="jobseeker">
                    <JobApplyPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/applications/:id" 
                element={
                  <ProtectedRoute>
                    <ApplicationDetailPage />
                  </ProtectedRoute>
                } 
              />
              
              {/* Employer Routes */}
              <Route 
                path="/dashboard/employer" 
                element={
                  <ProtectedRoute requiredRole="employer">
                    <EmployerDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/company-profile" 
                element={
                  <ProtectedRoute requiredRole="employer">
                    <CompanyProfilePage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/post-job" 
                element={
                  <ProtectedRoute requiredRole="employer">
                    <PostJobPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/jobs/edit/:id" 
                element={
                  <ProtectedRoute requiredRole="employer">
                    <EditJobPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/jobs/:id/applicants" 
                element={
                  <ProtectedRoute requiredRole="employer">
                    <JobApplicantsPage />
                  </ProtectedRoute>
                } 
              />
              
              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </Provider>
  );
}

export default App;