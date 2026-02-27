// apiConfig.js - Centralized API configuration for the frontend

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// API endpoints configuration
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    REGISTER: `${API_BASE_URL}/api/auth/register`,
    LOGOUT: `${API_BASE_URL}/api/auth/logout`,
    VERIFY_EMAIL: `${API_BASE_URL}/api/auth/verify-email`,
    FORGOT_PASSWORD: `${API_BASE_URL}/api/auth/forgot-password`,
    RESET_PASSWORD: `${API_BASE_URL}/api/auth/reset-password`,
  },

  // User Profile
  USER: {
    PROFILE: `${API_BASE_URL}/api/users/profile`,
    UPDATE_PROFILE: `${API_BASE_URL}/api/users/profile`,
    PREFERENCES: `${API_BASE_URL}/api/users/preferences`,
    ANALYTICS: `${API_BASE_URL}/api/users/analytics`,
    EXPERIENCE: `${API_BASE_URL}/api/users/experience`,
    EDUCATION: `${API_BASE_URL}/api/users/education`,
  },

  // Jobs - Standard
  JOBS: {
    LIST: `${API_BASE_URL}/api/jobs`,
    DETAILS: (id) => `${API_BASE_URL}/api/jobs/${id}`,
    CREATE: `${API_BASE_URL}/api/jobs`,
    UPDATE: (id) => `${API_BASE_URL}/api/jobs/${id}`,
    DELETE: (id) => `${API_BASE_URL}/api/jobs/${id}`,
    SEARCH: `${API_BASE_URL}/api/jobs/search`,
    SAVED: `${API_BASE_URL}/api/jobs/saved`,
    SAVE_JOB: (id) => `${API_BASE_URL}/api/jobs/saved/${id}`,
    UNSAVE_JOB: (id) => `${API_BASE_URL}/api/jobs/saved/${id}`,
  },

  // AI-Enhanced Jobs
  AI_JOBS: {
    RECOMMENDATIONS: `${API_BASE_URL}/api/jobs/ai/recommendations`,
    PREDICT_SALARY: `${API_BASE_URL}/api/jobs/ai/predict-salary`,
    MARKET_INSIGHTS: `${API_BASE_URL}/api/jobs/ai/market-insights`,
    TRENDING: `${API_BASE_URL}/api/jobs/ai/trending`,
    TRACK_INTERACTION: (jobId) => `${API_BASE_URL}/api/jobs/ai/track/${jobId}`,
    SIMILAR_JOBS: (id) => `${API_BASE_URL}/api/jobs/${id}/similar`,
    MODEL_STATUS: `${API_BASE_URL}/api/jobs/ai/status`,
    JOB_RECOMMENDATIONS: (id) => `${API_BASE_URL}/api/jobs/${id}/recommendations`,
  },

  // Applications
  APPLICATIONS: {
    LIST: `${API_BASE_URL}/api/applications`,
    APPLY: `${API_BASE_URL}/api/applications`,
    DETAILS: (id) => `${API_BASE_URL}/api/applications/${id}`,
    UPDATE_STATUS: (id) => `${API_BASE_URL}/api/applications/${id}/status`,
    WITHDRAW: (id) => `${API_BASE_URL}/api/applications/${id}/withdraw`,
  },

  // File Uploads
  UPLOAD: {
    RESUME: `${API_BASE_URL}/api/upload/resume`,
    PROFILE_PHOTO: `${API_BASE_URL}/api/upload/profile-photo`,
    COMPANY_LOGO: `${API_BASE_URL}/api/upload/company-logo`,
    COVER_LETTER: `${API_BASE_URL}/api/upload/cover-letter`,
  },

  // Statistics & Analytics
  STATS: {
    DASHBOARD: `${API_BASE_URL}/api/stats/dashboard`,
    JOB_ANALYTICS: `${API_BASE_URL}/api/stats/jobs`,
    USER_ANALYTICS: `${API_BASE_URL}/api/stats/users`,
    APPLICATION_ANALYTICS: `${API_BASE_URL}/api/stats/applications`,
  },

  // System
  SYSTEM: {
    HEALTH: `${API_BASE_URL}/health`,
    API_INFO: `${API_BASE_URL}/api`,
  }
};

// Default headers for API requests
export const getDefaultHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// API request helper functions
export const apiRequest = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      headers: getDefaultHeaders(),
      ...options,
      headers: {
        ...getDefaultHeaders(),
        ...options.headers
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

// Specific API functions for AI recommendations
export const aiJobsAPI = {
  // Get AI-powered job recommendations
  getRecommendations: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    
    if (filters.limit) queryParams.append('limit', filters.limit);
    if (filters.excludeApplied !== undefined) queryParams.append('excludeApplied', filters.excludeApplied);
    if (filters.useAI !== undefined) queryParams.append('useAI', filters.useAI);
    if (filters.algorithm) queryParams.append('algorithm', filters.algorithm);

    const url = `${API_ENDPOINTS.AI_JOBS.RECOMMENDATIONS}?${queryParams}`;
    return apiRequest(url);
  },

  // Predict salary for a job
  predictSalary: async (jobDetails) => {
    return apiRequest(API_ENDPOINTS.AI_JOBS.PREDICT_SALARY, {
      method: 'POST',
      body: JSON.stringify(jobDetails)
    });
  },

  // Get market insights
  getMarketInsights: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters);
    const url = `${API_ENDPOINTS.AI_JOBS.MARKET_INSIGHTS}?${queryParams}`;
    return apiRequest(url);
  },

  // Get trending jobs
  getTrendingJobs: async (limit = 10, timeframe = 7) => {
    const url = `${API_ENDPOINTS.AI_JOBS.TRENDING}?limit=${limit}&timeframe=${timeframe}`;
    return apiRequest(url);
  },

  // Track job interaction
  trackInteraction: async (jobId, interaction, metadata = {}) => {
    return apiRequest(API_ENDPOINTS.AI_JOBS.TRACK_INTERACTION(jobId), {
      method: 'POST',
      body: JSON.stringify({
        action: interaction,
        metadata,
        timestamp: new Date().toISOString()
      })
    });
  },

  // Get similar jobs
  getSimilarJobs: async (jobId, limit = 5) => {
    const url = `${API_ENDPOINTS.AI_JOBS.SIMILAR_JOBS(jobId)}?limit=${limit}`;
    return apiRequest(url);
  },

  // Check AI model status
  getModelStatus: async () => {
    return apiRequest(API_ENDPOINTS.AI_JOBS.MODEL_STATUS);
  }
};

// User preferences API
export const userAPI = {
  // Get user profile
  getProfile: async () => {
    return apiRequest(API_ENDPOINTS.USER.PROFILE);
  },

  // Update user profile
  updateProfile: async (profileData) => {
    return apiRequest(API_ENDPOINTS.USER.UPDATE_PROFILE, {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  },

  // Get user preferences
  getPreferences: async () => {
    return apiRequest(API_ENDPOINTS.USER.PREFERENCES);
  },

  // Update user preferences
  updatePreferences: async (preferences) => {
    return apiRequest(API_ENDPOINTS.USER.PREFERENCES, {
      method: 'PUT',
      body: JSON.stringify(preferences)
    });
  },

  // Get user analytics
  getAnalytics: async () => {
    return apiRequest(API_ENDPOINTS.USER.ANALYTICS);
  }
};

// Jobs API
export const jobsAPI = {
  // Get all jobs
  getJobs: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters);
    const url = `${API_ENDPOINTS.JOBS.LIST}?${queryParams}`;
    return apiRequest(url);
  },

  // Get job details
  getJobDetails: async (jobId) => {
    return apiRequest(API_ENDPOINTS.JOBS.DETAILS(jobId));
  },

  // Search jobs
  searchJobs: async (query, filters = {}) => {
    const searchParams = { q: query, ...filters };
    const queryParams = new URLSearchParams(searchParams);
    const url = `${API_ENDPOINTS.JOBS.SEARCH}?${queryParams}`;
    return apiRequest(url);
  },

  // Save job
  saveJob: async (jobId) => {
    return apiRequest(API_ENDPOINTS.JOBS.SAVE_JOB(jobId), {
      method: 'POST'
    });
  },

  // Unsave job
  unsaveJob: async (jobId) => {
    return apiRequest(API_ENDPOINTS.JOBS.UNSAVE_JOB(jobId), {
      method: 'DELETE'
    });
  },

  // Get saved jobs
  getSavedJobs: async () => {
    return apiRequest(API_ENDPOINTS.JOBS.SAVED);
  }
};

// Authentication API
export const authAPI = {
  // Login
  login: async (credentials) => {
    return apiRequest(API_ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  },

  // Register
  register: async (userData) => {
    return apiRequest(API_ENDPOINTS.AUTH.REGISTER, {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  // Logout
  logout: async () => {
    return apiRequest(API_ENDPOINTS.AUTH.LOGOUT, {
      method: 'POST'
    });
  }
};

// System API
export const systemAPI = {
  // Health check
  healthCheck: async () => {
    return apiRequest(API_ENDPOINTS.SYSTEM.HEALTH);
  },

  // Get API info
  getAPIInfo: async () => {
    return apiRequest(API_ENDPOINTS.SYSTEM.API_INFO);
  }
};

export default {
  API_ENDPOINTS,
  apiRequest,
  aiJobsAPI,
  userAPI,
  jobsAPI,
  authAPI,
  systemAPI
};