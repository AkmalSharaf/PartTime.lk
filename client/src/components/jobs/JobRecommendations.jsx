import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";

const JobRecommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userProfile, setUserProfile] = useState(null);
  const [showPreferences, setShowPreferences] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);
  const [salaryPrediction, setSalaryPrediction] = useState(null);
  const [marketInsights, setMarketInsights] = useState(null);
  const [trendingJobs, setTrendingJobs] = useState([]);
  const [showTrending, setShowTrending] = useState(false);
  const [aiModelStatus, setAiModelStatus] = useState(null);
  const [updatingPreferences, setUpdatingPreferences] = useState(false);
  const [preferences, setPreferences] = useState({
    preferredJobTypes: [],
    preferredLocations: [],
    salaryRange: { min: "", max: "", currency: "USD", negotiable: true },
    remoteWork: false,
    industries: [],
    experienceLevel: "",
    workEnvironment: [],
    companySize: [],
    benefits: [],
    preferredTechnologies: [],
    avoidKeywords: [],
    careerGoals: { shortTerm: "", longTerm: "" },
    workLifeBalance: {
      importance: 3,
      maxHoursPerWeek: 40,
      flexibleSchedule: false,
    },
    travelWillingness: "occasional",
    jobSearchUrgency: "actively_looking",
    preferredContactMethods: [],
    availability: { immediateStart: false, noticePeriod: 2 },
    interviewPreferences: { virtualInterviewOk: true },
  });

  const auth = useSelector((state) => state.auth);

  useEffect(() => {
    if (auth.isAuthenticated && auth.user?.role === "jobseeker") {
      initializeComponent();
    }
  }, [auth]);

  const initializeComponent = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchUserProfile(),
        fetchAIModelStatus(),
        fetchRecommendations(),
      ]);

      // Optional: Fetch trending jobs in background
      setTimeout(() => {
        fetchTrendingJobs();
        fetchMarketInsights();
      }, 2000);
    } catch (error) {
      console.error("❌ Component initialization error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      setError("");
      const token = localStorage.getItem("token");

      console.log("🔍 Fetching AI recommendations...");

      const response = await fetch(
        `${
          process.env.REACT_APP_API_URL || "http://localhost:5000"
        }/api/jobs/ai/recommendations?limit=20&useAI=true&algorithm=hybrid&excludeApplied=true`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("📊 Response status:", response.status);

      if (!response.ok) {
        // If AI endpoint fails, try legacy endpoint
        if (response.status === 404 || response.status === 503) {
          console.log("⚠️ AI endpoint unavailable, trying legacy endpoint...");
          return await fetchLegacyRecommendations();
        }

        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ AI Recommendations response:", data);

      if (data.success) {
        setRecommendations(data.data || []);
        setUserProfile(data.userProfile);
        setAiInsights(data.metadata);

        // Show suggestions if profile incomplete
        if (data.suggestions && data.suggestions.length > 0) {
          setError(
            `Profile incomplete. ${data.suggestions.slice(0, 2).join(". ")}.`
          );
        }
      } else {
        setError(data.message || "Failed to fetch recommendations");
      }
    } catch (err) {
      console.error("❌ Fetch recommendations error:", err);
      setError(
        "Failed to connect to AI recommendation service. Trying fallback..."
      );

      // Try legacy endpoint as fallback
      try {
        await fetchLegacyRecommendations();
      } catch (fallbackError) {
        setError(
          "Recommendation service is temporarily unavailable. Please try again later."
        );
      }
    }
  };

  const fetchLegacyRecommendations = async () => {
    const token = localStorage.getItem("token");
    console.log("🔄 Trying legacy recommendations endpoint...");

    const response = await fetch(
      `${
        process.env.REACT_APP_API_URL || "http://localhost:5000"
      }/api/jobs/recommendations?limit=15`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Legacy endpoint failed: HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ Legacy recommendations loaded:", data);

    if (data.success) {
      setRecommendations(data.data || []);
      setUserProfile(data.userProfile);
      setAiInsights(data.metadata);
      setError(""); // Clear error if fallback works
    } else {
      throw new Error(data.message || "Legacy endpoint failed");
    }
  };

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      console.log("👤 Fetching user profile...");

      // Fetch user profile
      const profileResponse = await fetch(
        `${
          process.env.REACT_APP_API_URL || "http://localhost:5000"
        }/api/users/profile`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        const user = profileData.data;
        console.log("✅ User profile loaded");

        // Update preferences from user profile
        if (user.preferences) {
          setPreferences((prev) => ({
            ...prev,
            ...user.preferences,
            preferredJobTypes: user.preferences.jobTypes || [],
            preferredLocations: user.preferences.preferredLocations || [],
            salaryRange: user.preferences.salaryRange || prev.salaryRange,
          }));
        }

        // Fetch job preferences separately
        const prefResponse = await fetch(
          `${
            process.env.REACT_APP_API_URL || "http://localhost:5000"
          }/api/jobs/preferences`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (prefResponse.ok) {
          const prefData = await prefResponse.json();
          console.log("✅ Job preferences loaded");

          if (prefData.success && prefData.data) {
            setPreferences((prev) => ({
              ...prev,
              ...prefData.data,
              preferredJobTypes:
                prefData.data.jobTypes || prefData.data.preferredJobTypes || [],
              preferredLocations: prefData.data.preferredLocations || [],
            }));
          }
        }

        // Predict salary for user
        if (user.skills && user.skills.length > 0) {
          predictSalaryForUser(user);
        }
      }
    } catch (err) {
      console.error("❌ Failed to fetch user profile:", err);
    }
  };

  const fetchAIModelStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      console.log("🤖 Checking AI model status...");

      const response = await fetch(
        `${
          process.env.REACT_APP_API_URL || "http://localhost:5000"
        }/api/jobs/ai/status`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("✅ AI model status:", data.ai_model?.status);
        setAiModelStatus(data.ai_model);
      }
    } catch (err) {
      console.warn("⚠️ Could not fetch AI model status:", err);
      setAiModelStatus({ status: "unknown" });
    }
  };

  const fetchTrendingJobs = async () => {
    try {
      console.log("🔥 Fetching trending jobs...");

      const response = await fetch(
        `${
          process.env.REACT_APP_API_URL || "http://localhost:5000"
        }/api/jobs/ai/trending?limit=10&timeframe=7&algorithm=hybrid`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Trending jobs loaded:", data.count);
        if (data.success) {
          setTrendingJobs(data.data || []);
        }
      }
    } catch (err) {
      console.warn("⚠️ Failed to fetch trending jobs:", err);
    }
  };

  const fetchMarketInsights = async () => {
    try {
      const token = localStorage.getItem("token");
      console.log("📊 Fetching market insights...");

      const userIndustry =
        preferences.industries?.[0] ||
        userProfile?.preferences?.industries?.[0];
      const userLocation =
        userProfile?.location || preferences.preferredLocations?.[0];

      let url = `${
        process.env.REACT_APP_API_URL || "http://localhost:5000"
      }/api/jobs/ai/market-insights?`;
      if (userIndustry) url += `industry=${encodeURIComponent(userIndustry)}&`;
      if (userLocation) url += `location=${encodeURIComponent(userLocation)}&`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Market insights loaded");
        if (data.success) {
          setMarketInsights(data.data);
        }
      }
    } catch (err) {
      console.warn("⚠️ Failed to fetch market insights:", err);
    }
  };

  const predictSalaryForUser = async (user) => {
    try {
      console.log("💰 Predicting salary for user...");

      const response = await fetch(
        `${
          process.env.REACT_APP_API_URL || "http://localhost:5000"
        }/api/jobs/ai/predict-salary`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: user.currentPosition || "Software Developer",
            experience: user.inferredExperienceLevel || "Mid-level",
            industry: user.preferences?.industries?.[0] || "Software",
            location: user.location || "San Francisco",
            skills: user.skills?.join(", ") || "",
            company: user.currentCompany || "",
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log(
          "✅ Salary prediction loaded:",
          data.data?.predicted_salary
        );
        if (data.success) {
          setSalaryPrediction(data.data);
        }
      }
    } catch (err) {
      console.warn("⚠️ Failed to predict salary:", err);
    }
  };

const updatePreferences = async () => {
  try {
    setUpdatingPreferences(true);
    setError("");
    const token = localStorage.getItem("token");

    console.log("🔄 Updating job preferences...");
    console.log("Raw preferences data:", preferences);

    // FIXED: Properly handle skills and technologies
    const cleanedPreferences = {
      preferredJobTypes: preferences.preferredJobTypes || [],
      preferredLocations: preferences.preferredLocations || [],
      
      // FIXED: Handle skills/technologies properly
      preferredTechnologies: preferences.preferredTechnologies || preferences.skills || [],
      
      salaryRange: {
        min: preferences.salaryRange?.min && !isNaN(parseInt(preferences.salaryRange.min))
          ? parseInt(preferences.salaryRange.min) : undefined,
        max: preferences.salaryRange?.max && !isNaN(parseInt(preferences.salaryRange.max))
          ? parseInt(preferences.salaryRange.max) : undefined,
        currency: preferences.salaryRange?.currency || "USD",
        negotiable: Boolean(preferences.salaryRange?.negotiable),
      },
      remoteWork: Boolean(preferences.remoteWork),
      industries: preferences.industries || [],
      experienceLevel: preferences.experienceLevel && preferences.experienceLevel.trim() !== ""
        ? preferences.experienceLevel.trim() : undefined,
      workEnvironment: preferences.workEnvironment || [],
      companySize: preferences.companySize || [],
      benefits: preferences.benefits || [],
      avoidKeywords: preferences.avoidKeywords || [],
      careerGoals: {
        shortTerm: preferences.careerGoals?.shortTerm || "",
        longTerm: preferences.careerGoals?.longTerm || "",
      },
      workLifeBalance: {
        importance: preferences.workLifeBalance?.importance || 3,
        maxHoursPerWeek: preferences.workLifeBalance?.maxHoursPerWeek || 40,
        flexibleSchedule: Boolean(preferences.workLifeBalance?.flexibleSchedule),
        overtimeAcceptable: Boolean(preferences.workLifeBalance?.overtimeAcceptable),
      },
      travelWillingness: preferences.travelWillingness && preferences.travelWillingness.trim() !== ""
        ? preferences.travelWillingness : "occasional",
      jobSearchUrgency: preferences.jobSearchUrgency && preferences.jobSearchUrgency.trim() !== ""
        ? preferences.jobSearchUrgency : "actively_looking",
      preferredContactMethods: preferences.preferredContactMethods || [],
      availability: {
        immediateStart: Boolean(preferences.availability?.immediateStart),
        noticePeriod: preferences.availability?.noticePeriod || 2,
        preferredStartDate: preferences.availability?.preferredStartDate || undefined,
      },
      interviewPreferences: {
        timeSlots: preferences.interviewPreferences?.timeSlots || [],
        timeZone: preferences.interviewPreferences?.timeZone || "UTC",
        virtualInterviewOk: Boolean(preferences.interviewPreferences?.virtualInterviewOk !== false),
      },
    };

    console.log("🧹 Cleaned preferences data:", cleanedPreferences);

    const response = await fetch(
      `${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/jobs/preferences`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cleanedPreferences),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Preferences update error:", errorData);
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ Preferences update response:", data);

    if (data.success) {
      setShowPreferences(false);
      setError("");

      // Update local state with the returned preferences
      if (data.data && data.data.preferences) {
        setPreferences((prev) => ({
          ...prev,
          ...data.data.preferences,
          preferredJobTypes: data.data.preferences.jobTypes || data.data.preferences.preferredJobTypes || [],
          preferredLocations: data.data.preferences.preferredLocations || [],
          // FIXED: Update preferredTechnologies properly
          preferredTechnologies: data.data.preferences.preferredTechnologies || [],
        }));
      }

      alert("✅ AI preferences updated successfully! Refreshing recommendations...");
      setTimeout(() => fetchRecommendations(), 1000);
    } else {
      setError(data.message || "Failed to update preferences");
    }
  } catch (err) {
    console.error("❌ Update preferences error:", err);
    setError("Failed to update preferences: " + err.message);
  } finally {
    setUpdatingPreferences(false);
  }
};
  const trackJobInteraction = async (jobId, action) => {
    try {
      const token = localStorage.getItem("token");
      console.log(`📊 Tracking interaction: ${action} for job ${jobId}`);

      await fetch(
        `${
          process.env.REACT_APP_API_URL || "http://localhost:5000"
        }/api/jobs/ai/track/${jobId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action,
            source: "ai_recommendations_page",
            metadata: {
              component: "JobRecommendations",
              timestamp: new Date().toISOString(),
              user_agent: navigator.userAgent,
            },
          }),
        }
      );
    } catch (err) {
      console.warn("⚠️ Failed to track interaction:", err);
    }
  };

  const saveJob = async (jobId) => {
    try {
      const token = localStorage.getItem("token");
      console.log(`💾 Saving job: ${jobId}`);

      const response = await fetch(
        `${
          process.env.REACT_APP_API_URL || "http://localhost:5000"
        }/api/jobs/saved/${jobId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        trackJobInteraction(jobId, "saved");
        alert("✅ Job saved successfully!");
      } else {
        const errorData = await response.json();
        alert("❌ " + (errorData.message || "Failed to save job"));
      }
    } catch (err) {
      console.error("❌ Failed to save job:", err);
      alert("❌ Failed to save job. Please try again.");
    }
  };

  const formatSalary = (job) => {
    if (job.salary && typeof job.salary === "number") {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
      }).format(job.salary);
    }

    if (!job.salary || !job.salary.min) return "Salary not specified";

    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: job.salary.currency || "USD",
      minimumFractionDigits: 0,
    });

    const min = formatter.format(job.salary.min);
    const max = job.salary.max ? formatter.format(job.salary.max) : null;

    return max ? `${min} - ${max}` : `${min}+`;
  };

  const getDaysAgo = (date) => {
    const now = new Date();
    const jobDate = new Date(date);
    const diffTime = Math.abs(now - jobDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const getRecommendationBadge = (score) => {
    if (score >= 80)
      return { color: "green", label: "Excellent Match", icon: "fas fa-star" };
    if (score >= 60)
      return { color: "blue", label: "Good Match", icon: "fas fa-thumbs-up" };
    if (score >= 40)
      return {
        color: "yellow",
        label: "Fair Match",
        icon: "fas fa-balance-scale",
      };
    return { color: "gray", label: "Potential Match", icon: "fas fa-search" };
  };

  const getAIStatusBadge = () => {
    if (!aiModelStatus) return null;

    const status = aiModelStatus.status;
    if (status === "healthy") {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <i className="fas fa-check-circle mr-1"></i>AI Online
        </span>
      );
    }
    if (status === "degraded") {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <i className="fas fa-exclamation-triangle mr-1"></i>AI Limited
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <i className="fas fa-times-circle mr-1"></i>AI Offline
      </span>
    );
  };

  // Auth guard
  if (!auth.isAuthenticated || auth.user?.role !== "jobseeker") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="mb-6">
            <i className="fas fa-user-lock text-gray-400 text-6xl"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Access Restricted
          </h2>
          <p className="text-gray-600 mb-6">
            AI job recommendations are available exclusively for job seekers.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => (window.location.href = "/login")}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <i className="fas fa-sign-in-alt mr-2"></i>
              Sign In as Job Seeker
            </button>
            <button
              onClick={() => (window.location.href = "/register")}
              className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              <i className="fas fa-user-plus mr-2"></i>
              Create Job Seeker Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-lg mx-auto">
          <div className="relative mb-8">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <i className="fas fa-robot text-blue-600 text-3xl animate-pulse"></i>
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">
            AI is Analyzing Your Profile
          </h3>
          <p className="text-gray-600 mb-6">
            Our machine learning algorithm is finding the perfect job matches
            for you...
          </p>

          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center space-x-3 text-blue-600 text-sm">
              <div className="flex items-center">
                <i className="fas fa-user-check mr-1"></i>
                <span>Profile Analysis</span>
              </div>
              <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse"></div>
              <div className="flex items-center">
                <i className="fas fa-search mr-1"></i>
                <span>Job Matching</span>
              </div>
              <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse"></div>
              <div className="flex items-center">
                <i className="fas fa-sort-amount-down mr-1"></i>
                <span>Ranking Results</span>
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500">
            This usually takes 3-5 seconds • Powered by Advanced AI •{" "}
            {getAIStatusBadge()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Enhanced Header with AI Status */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8 border border-gray-200">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center mb-3">
                <h1 className="text-3xl font-bold text-gray-900 mr-3">
                  <i className="fas fa-robot text-blue-600 mr-2"></i>
                  AI Job Recommendations
                </h1>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800">
                    <i className="fas fa-brain mr-1"></i>
                    AI-Powered
                  </span>
                  {getAIStatusBadge()}
                  {aiInsights?.algorithm_used && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {aiInsights.algorithm_used
                        .replace("_", " ")
                        .toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                Get personalized job suggestions powered by machine learning,
                tailored to your skills and career goals
              </p>

              {/* Enhanced AI Insights Summary */}
              {aiInsights && (
                <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                  <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                    <i className="fas fa-chart-line mr-2"></i>
                    AI Analysis Dashboard
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                    <div className="bg-white rounded-lg p-3 border border-blue-100 text-center">
                      <div className="text-blue-600 font-medium text-xs mb-1">
                        Algorithm
                      </div>
                      <div className="text-blue-800 font-semibold capitalize">
                        {aiInsights.algorithm_used?.replace("_", " ") ||
                          "Hybrid"}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-blue-100 text-center">
                      <div className="text-blue-600 font-medium text-xs mb-1">
                        Match Score
                      </div>
                      <div className="text-blue-800 font-semibold">
                        {Math.round(aiInsights.average_score || 0)}%
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-blue-100 text-center">
                      <div className="text-blue-600 font-medium text-xs mb-1">
                        Jobs Found
                      </div>
                      <div className="text-blue-800 font-semibold">
                        {recommendations.length}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-blue-100 text-center">
                      <div className="text-blue-600 font-medium text-xs mb-1">
                        Profile Readiness
                      </div>
                      <div className="text-blue-800 font-semibold">
                        {userProfile?.recommendationReadiness ||
                          userProfile?.profileCompleteness ||
                          0}
                        %
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-blue-100 text-center">
                      <div className="text-blue-600 font-medium text-xs mb-1">
                        Expected Salary
                      </div>
                      <div className="text-blue-800 font-semibold">
                        $
                        {salaryPrediction?.predicted_salary?.toLocaleString() ||
                          "N/A"}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Enhanced User Profile Summary */}
              {userProfile && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {userProfile.skills?.slice(0, 6).map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full border border-blue-200"
                    >
                      <i className="fas fa-code mr-1"></i>
                      {skill}
                    </span>
                  ))}
                  {userProfile.location && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full border border-green-200">
                      <i className="fas fa-map-marker-alt mr-1"></i>
                      {userProfile.location}
                    </span>
                  )}
                  {userProfile.experienceLevel && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full border border-purple-200">
                      <i className="fas fa-chart-line mr-1"></i>
                      {userProfile.experienceLevel}
                    </span>
                  )}
                  {preferences.industries?.length > 0 && (
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm rounded-full border border-indigo-200">
                      <i className="fas fa-building mr-1"></i>
                      {preferences.industries[0]}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="ml-6 flex flex-col space-y-2">
              <button
                onClick={() => setShowPreferences(!showPreferences)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
              >
                <i className="fas fa-sliders-h mr-2"></i>
                AI Settings
              </button>
              <button
                onClick={fetchRecommendations}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors flex items-center"
              >
                <i className="fas fa-sync-alt mr-2"></i>
                Refresh
              </button>
              {trendingJobs.length > 0 && (
                <button
                  onClick={() => setShowTrending(!showTrending)}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors flex items-center"
                >
                  <i className="fas fa-fire mr-2"></i>
                  Trending
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Preferences Panel */}
        {showPreferences && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8 border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <i className="fas fa-robot mr-2 text-blue-600"></i>
                Configure Your AI Preferences
              </h3>
              <button
                onClick={() => setShowPreferences(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Job Types */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <i className="fas fa-briefcase mr-1"></i>
                  Preferred Job Types
                </label>
                <div className="space-y-2">
                  {[
                    "Full-time",
                    "Part-time",
                    "Contract",
                    "Internship",
                    "Remote",
                    "Freelance",
                  ].map((type) => (
                    <label
                      key={type}
                      className="flex items-center p-2 rounded-md hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={preferences.preferredJobTypes.includes(type)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPreferences({
                              ...preferences,
                              preferredJobTypes: [
                                ...preferences.preferredJobTypes,
                                type,
                              ],
                            });
                          } else {
                            setPreferences({
                              ...preferences,
                              preferredJobTypes:
                                preferences.preferredJobTypes.filter(
                                  (t) => t !== type
                                ),
                            });
                          }
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-3 text-sm text-gray-700">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Industries */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <i className="fas fa-building mr-1"></i>
                  Preferred Industries
                </label>
                <div className="space-y-2">
                  {[
                    "Software",
                    "AI/ML",
                    "Fintech",
                    "Healthcare",
                    "E-commerce",
                    "Education",
                    "Media",
                    "Gaming",
                    "Design",
                    "Marketing",
                  ].map((industry) => (
                    <label
                      key={industry}
                      className="flex items-center p-2 rounded-md hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={preferences.industries.includes(industry)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPreferences({
                              ...preferences,
                              industries: [...preferences.industries, industry],
                            });
                          } else {
                            setPreferences({
                              ...preferences,
                              industries: preferences.industries.filter(
                                (i) => i !== industry
                              ),
                            });
                          }
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-3 text-sm text-gray-700">
                        {industry}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Experience Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <i className="fas fa-chart-line mr-1"></i>
                  Experience Level
                </label>
                <select
                  value={preferences.experienceLevel || ""}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      experienceLevel: e.target.value,
                    })
                  }
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Any Level (Let AI decide)</option>
                  <option value="Entry-level">Entry Level</option>
                  <option value="Mid-level">Mid Level</option>
                  <option value="Senior">Senior</option>
                  <option value="Executive">Executive</option>
                  <option value="Intern">Intern</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Leave empty to let AI determine your level based on experience
                </p>
              </div>
              {/* Salary Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <i className="fas fa-dollar-sign mr-1"></i>
                  Salary Range ({preferences.salaryRange.currency})
                </label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <input
                    type="number"
                    placeholder="Min salary"
                    value={preferences.salaryRange.min}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        salaryRange: {
                          ...preferences.salaryRange,
                          min: e.target.value,
                        },
                      })
                    }
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Max salary"
                    value={preferences.salaryRange.max}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        salaryRange: {
                          ...preferences.salaryRange,
                          max: e.target.value,
                        },
                      })
                    }
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={preferences.salaryRange.negotiable}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        salaryRange: {
                          ...preferences.salaryRange,
                          negotiable: e.target.checked,
                        },
                      })
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-gray-600">Negotiable</span>
                </label>
              </div>

              {/* Locations */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <i className="fas fa-map-marker-alt mr-1"></i>
                  Preferred Locations
                </label>
                <input
                  type="text"
                  placeholder="e.g., New York, San Francisco, Remote"
                  value={preferences.preferredLocations.join(", ")}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      preferredLocations: e.target.value
                        .split(",")
                        .map((loc) => loc.trim())
                        .filter((loc) => loc),
                    })
                  }
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Separate locations with commas
                </p>
              </div>

              {/* Work Environment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <i className="fas fa-users mr-1"></i>
                  Work Environment
                </label>
                <div className="space-y-2">
                  {[
                    "Startup",
                    "Corporate",
                    "Agency",
                    "Non-profit",
                    "Government",
                    "Freelance",
                  ].map((env) => (
                    <label
                      key={env}
                      className="flex items-center p-2 rounded-md hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={preferences.workEnvironment.includes(env)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPreferences({
                              ...preferences,
                              workEnvironment: [
                                ...preferences.workEnvironment,
                                env,
                              ],
                            });
                          } else {
                            setPreferences({
                              ...preferences,
                              workEnvironment:
                                preferences.workEnvironment.filter(
                                  (w) => w !== env
                                ),
                            });
                          }
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-3 text-sm text-gray-700">{env}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Advanced Preferences */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                <i className="fas fa-cogs mr-2 text-blue-600"></i>
                Advanced AI Settings
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Remote Work */}
                <div>
                  <label className="flex items-center p-3 rounded-md border border-gray-200 hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={preferences.remoteWork}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          remoteWork: e.target.checked,
                        })
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-3 text-sm text-gray-700">
                      <i className="fas fa-home mr-2 text-green-600"></i>
                      Open to remote work opportunities
                    </span>
                  </label>
                </div>

                {/* Job Search Urgency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <i className="fas fa-clock mr-1"></i>
                    Job Search Urgency
                  </label>
                  <select
                    value={preferences.jobSearchUrgency}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        jobSearchUrgency: e.target.value,
                      })
                    }
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="not_looking">Not actively looking</option>
                    <option value="passively_looking">Passively looking</option>
                    <option value="actively_looking">Actively looking</option>
                    <option value="urgently_looking">Urgently looking</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end space-x-4 border-t border-gray-200 pt-6">
              <button
                onClick={() => setShowPreferences(false)}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={updatePreferences}
                disabled={updatingPreferences}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {updatingPreferences ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Updating AI...
                  </>
                ) : (
                  <>
                    <i className="fas fa-robot mr-2"></i>
                    Update AI Preferences
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Trending Jobs Panel */}
        {showTrending && trendingJobs.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8 border border-orange-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <i className="fas fa-fire mr-2 text-orange-600"></i>
                Trending Jobs This Week
              </h3>
              <button
                onClick={() => setShowTrending(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trendingJobs.slice(0, 6).map((job, index) => (
                <div
                  key={job._id || index}
                  className="p-4 border border-orange-100 rounded-lg hover:border-orange-300 transition-colors"
                >
                  <h4 className="font-medium text-gray-900 mb-2">
                    {job.title || job.job_title}
                  </h4>
                  <p className="text-sm text-orange-600 mb-2">{job.company}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{job.location}</span>
                    <span className="flex items-center">
                      <i className="fas fa-fire mr-1 text-orange-500"></i>
                      {Math.round(job.trend_score || job.trendScore || 0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <i className="fas fa-exclamation-triangle text-red-500"></i>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-red-800">Notice</h4>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                {error.includes("profile") && (
                  <div className="mt-3">
                    <button
                      onClick={() => (window.location.href = "/profile/seeker")}
                      className="px-3 py-1 bg-red-100 text-red-800 text-xs rounded-md hover:bg-red-200 transition-colors"
                    >
                      <i className="fas fa-user-edit mr-1"></i>
                      Complete Profile
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Market Insights Panel */}
        {marketInsights && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <i className="fas fa-chart-bar mr-2 text-green-600"></i>
              Market Insights for Your Profile
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {marketInsights.database_insights && (
                <>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {marketInsights.database_insights.totalJobs || 0}
                    </div>
                    <div className="text-sm text-green-800">Available Jobs</div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      $
                      {(
                        marketInsights.database_insights.avgSalary || 0
                      ).toLocaleString()}
                    </div>
                    <div className="text-sm text-blue-800">Average Salary</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="text-2xl font-bold text-purple-600 mb-1">
                      {marketInsights.database_insights
                        .userSkillCompatibility || 0}
                      %
                    </div>
                    <div className="text-sm text-purple-800">Skill Match</div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Recommendations List */}
        {recommendations.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="mb-6">
              <i className="fas fa-robot text-gray-400 text-6xl"></i>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-3">
              No AI Recommendations Available
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Complete your profile with skills, experience, and preferences to
              get personalized AI-powered job recommendations.
            </p>
            <div className="space-x-4">
              <button
                onClick={() => (window.location.href = "/profile/seeker")}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <i className="fas fa-user-edit mr-2"></i>
                Complete Profile
              </button>
              <button
                onClick={() => setShowPreferences(true)}
                className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <i className="fas fa-sliders-h mr-2"></i>
                Set Preferences
              </button>
              <button
                onClick={fetchRecommendations}
                className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <i className="fas fa-sync-alt mr-2"></i>
                Retry
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <i className="fas fa-list-ul mr-2 text-blue-600"></i>
                {recommendations.length} AI-Recommended Jobs
                {aiInsights?.algorithm_used && (
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    • via{" "}
                    {aiInsights.algorithm_used.replace("_", " ").toUpperCase()}{" "}
                    algorithm
                  </span>
                )}
              </h2>
              <div className="flex space-x-3">
                <button
                  onClick={fetchRecommendations}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors flex items-center"
                >
                  <i className="fas fa-sync-alt mr-2"></i>
                  Refresh AI
                </button>
                <button
                  onClick={() => setShowPreferences(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
                >
                  <i className="fas fa-sliders-h mr-2"></i>
                  Tune AI
                </button>
              </div>
            </div>

            {/* Job Cards */}
            {recommendations.map((job, index) => {
              const matchBadge = getRecommendationBadge(
                job.recommendationScore || job.similarity_score * 100 || 0
              );
              return (
                <div
                  key={job._id || `ai-job-${index}`}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:border-blue-200"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3
                              className="text-xl font-semibold text-gray-900 mb-1 hover:text-blue-600 transition-colors cursor-pointer"
                              onClick={() => {
                                if (job._id) {
                                  trackJobInteraction(job._id, "clicked");
                                  window.location.href = `/jobs/${job._id}`;
                                }
                              }}
                            >
                              {job.title || job.job_title}
                            </h3>
                            <div className="flex items-center space-x-3 mb-2">
                              <p className="text-lg text-blue-600 font-medium">
                                {job.employer?.companyName || job.company}
                              </p>
                              {job.employer?.companyLogo && (
                                <img
                                  src={job.employer.companyLogo}
                                  alt={job.employer.companyName}
                                  className="w-8 h-8 rounded object-contain"
                                />
                              )}
                            </div>
                          </div>
                          <div className="ml-4 flex flex-col items-end space-y-2">
                            {(job.recommendationScore ||
                              job.similarity_score) && (
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                  matchBadge.color === "green"
                                    ? "bg-green-100 text-green-800 border border-green-200"
                                    : matchBadge.color === "blue"
                                    ? "bg-blue-100 text-blue-800 border border-blue-200"
                                    : matchBadge.color === "yellow"
                                    ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                                    : "bg-gray-100 text-gray-800 border border-gray-200"
                                }`}
                              >
                                <i className={`${matchBadge.icon} mr-1`}></i>
                                {Math.round(
                                  job.recommendationScore ||
                                    job.similarity_score * 100 ||
                                    0
                                )}
                                % - {matchBadge.label}
                              </span>
                            )}
                            {job.isAIGenerated && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                                <i className="fas fa-robot mr-1"></i>
                                AI Generated
                              </span>
                            )}
                            {job.ai_metadata?.source && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                {job.ai_metadata.source
                                  .replace("_", " ")
                                  .toUpperCase()}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Job Details */}
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-4">
                          <span className="flex items-center bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
                            <i className="fas fa-map-marker-alt mr-1 text-green-600"></i>
                            {job.location}
                          </span>
                          {job.jobType && (
                            <span className="flex items-center bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
                              <i className="fas fa-briefcase mr-1 text-blue-600"></i>
                              {job.jobType}
                            </span>
                          )}
                          <span className="flex items-center bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
                            <i className="fas fa-chart-line mr-1 text-purple-600"></i>
                            {job.experience ||
                              job.experience_level ||
                              "Not specified"}
                          </span>
                          <span className="flex items-center bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
                            <i className="fas fa-dollar-sign mr-1 text-yellow-600"></i>
                            {formatSalary(job)}
                          </span>
                          {job.createdAt && (
                            <span className="flex items-center bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
                              <i className="fas fa-clock mr-1 text-gray-500"></i>
                              {getDaysAgo(job.createdAt)}
                            </span>
                          )}
                          {job.industry && (
                            <span className="flex items-center bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
                              <i className="fas fa-building mr-1 text-indigo-600"></i>
                              {job.industry}
                            </span>
                          )}
                        </div>

                        {/* AI Recommendation Reasons */}
                        {(job.matchingReasons || job.recommendationReasons) &&
                          (job.matchingReasons || job.recommendationReasons)
                            .length > 0 && (
                            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                              <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center">
                                <i className="fas fa-lightbulb mr-1"></i>
                                Why AI recommends this job:
                              </h4>
                              <ul className="text-sm text-blue-800 space-y-1">
                                {(
                                  job.matchingReasons ||
                                  job.recommendationReasons
                                )
                                  .slice(0, 3)
                                  .map((reason, idx) => (
                                    <li key={idx} className="flex items-start">
                                      <i className="fas fa-check-circle mr-2 mt-0.5 text-blue-600"></i>
                                      {reason}
                                    </li>
                                  ))}
                              </ul>
                            </div>
                          )}

                        {/* Job Description */}
                        <p className="text-gray-700 mb-4 leading-relaxed">
                          {job.description ||
                            job.shortDescription ||
                            `Join ${job.company} as a ${
                              job.title || job.job_title
                            }. This ${
                              job.experience || "mid-level"
                            } position offers exciting opportunities for professional growth in a dynamic ${
                              job.industry || "technology"
                            } environment.`}
                        </p>

                        {/* Skills */}
                        {(job.skills || job.required_skills) && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                              <i className="fas fa-tools mr-1"></i>
                              Required Skills:
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {(typeof (job.skills || job.required_skills) ===
                              "string"
                                ? (job.skills || job.required_skills).split(",")
                                : job.skills || job.required_skills || []
                              )
                                .slice(0, 10)
                                .map((skill, skillIndex) => {
                                  const skillName =
                                    typeof skill === "string"
                                      ? skill.trim()
                                      : skill;
                                  const isMatchingSkill =
                                    userProfile?.skills?.some(
                                      (userSkill) =>
                                        userSkill
                                          .toLowerCase()
                                          .includes(skillName.toLowerCase()) ||
                                        skillName
                                          .toLowerCase()
                                          .includes(userSkill.toLowerCase())
                                    );

                                  return (
                                    <span
                                      key={skillIndex}
                                      className={`px-3 py-1 text-xs rounded-full border ${
                                        isMatchingSkill
                                          ? "bg-green-100 text-green-800 border-green-200 font-medium"
                                          : "bg-gray-100 text-gray-800 border-gray-200"
                                      }`}
                                    >
                                      {isMatchingSkill && (
                                        <i className="fas fa-check mr-1"></i>
                                      )}
                                      {skillName}
                                    </span>
                                  );
                                })}
                              {(job.skills?.length ||
                                job.required_skills?.split(",").length ||
                                0) > 10 && (
                                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full border border-gray-200">
                                  +
                                  {(job.skills?.length ||
                                    job.required_skills?.split(",").length ||
                                    0) - 10}{" "}
                                  more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => {
                                if (job._id) {
                                  trackJobInteraction(job._id, "clicked");
                                  window.location.href = `/jobs/${job._id}`;
                                } else {
                                  alert(
                                    "This is an AI-generated job suggestion. Similar opportunities may be available in our job listings."
                                  );
                                  window.location.href = "/jobs";
                                }
                              }}
                              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
                            >
                              <i className="fas fa-eye mr-2"></i>
                              {job._id ? "View Details" : "Find Similar"}
                            </button>
                            {job._id && (
                              <button
                                onClick={() => saveJob(job._id)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors flex items-center"
                              >
                                <i className="fas fa-bookmark mr-1"></i>
                                Save
                              </button>
                            )}
                            <button
                              onClick={() => {
                                if (job._id) {
                                  trackJobInteraction(job._id, "applied");
                                }
                                window.open(
                                  job.applicationUrl ||
                                    `mailto:careers@${(job.company || "company")
                                      .replace(/\s+/g, "")
                                      .toLowerCase()}.com`,
                                  "_blank"
                                );
                              }}
                              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
                            >
                              <i className="fas fa-paper-plane mr-1"></i>
                              Apply Now
                            </button>
                          </div>

                          {/* Job Engagement Info */}
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            {job.viewCount && (
                              <span className="flex items-center">
                                <i className="fas fa-eye mr-1"></i>
                                {job.viewCount} views
                              </span>
                            )}
                            {job.applicationCount && (
                              <span className="flex items-center">
                                <i className="fas fa-users mr-1"></i>
                                {job.applicationCount} applicants
                              </span>
                            )}
                            {job.saveCount && (
                              <span className="flex items-center">
                                <i className="fas fa-bookmark mr-1"></i>
                                {job.saveCount} saves
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Load More Button */}
            {recommendations.length >= 20 && (
              <div className="text-center py-8">
                <button
                  onClick={() => {
                    // Fetch more recommendations with higher limit
                    const token = localStorage.getItem("token");
                    fetch(
                      `${
                        process.env.REACT_APP_API_URL || "http://localhost:5000"
                      }/api/jobs/ai/recommendations?limit=40&useAI=true&algorithm=hybrid`,
                      {
                        headers: {
                          Authorization: `Bearer ${token}`,
                          "Content-Type": "application/json",
                        },
                      }
                    )
                      .then((res) => res.json())
                      .then((data) => {
                        if (data.success) {
                          setRecommendations(data.data || []);
                        }
                      });
                  }}
                  className="px-6 py-3 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors flex items-center mx-auto"
                >
                  <i className="fas fa-plus mr-2"></i>
                  Load More AI Recommendations
                </button>
              </div>
            )}
          </div>
        )}

        {/* AI Tips and Performance Section */}
        <div className="mt-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-8 border border-blue-100">
          <h3 className="text-xl font-semibold text-purple-900 mb-6 flex items-center">
            <i className="fas fa-robot mr-2"></i>
            AI Recommendation Intelligence
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Tips Section */}
            <div>
              <h4 className="font-medium text-purple-800 mb-4 flex items-center">
                <i className="fas fa-lightbulb mr-2"></i>
                Improve Your AI Matches
              </h4>
              <ul className="space-y-3 text-purple-700">
                <li className="flex items-start">
                  <i className="fas fa-check-circle mt-1 mr-3 text-purple-600"></i>
                  <span>
                    Keep your skills updated with trending technologies for
                    better AI matching
                  </span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check-circle mt-1 mr-3 text-purple-600"></i>
                  <span>
                    Add detailed work experience to help AI understand your
                    career trajectory
                  </span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check-circle mt-1 mr-3 text-purple-600"></i>
                  <span>
                    Interact with jobs (view, save, apply) to train the AI
                    algorithm
                  </span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check-circle mt-1 mr-3 text-purple-600"></i>
                  <span>
                    Update preferences regularly for fresh AI recommendations
                  </span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check-circle mt-1 mr-3 text-purple-600"></i>
                  <span>
                    Set realistic salary expectations based on AI market data
                  </span>
                </li>
              </ul>
            </div>

            {/* Performance Metrics */}
            <div>
              <h4 className="font-medium text-purple-800 mb-4 flex items-center">
                <i className="fas fa-chart-line mr-2"></i>
                Your AI Performance Dashboard
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 border border-purple-100">
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    {userProfile?.profileCompleteness || 0}%
                  </div>
                  <div className="text-xs text-purple-700">
                    Profile Completeness
                  </div>
                  <div className="w-full bg-purple-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${userProfile?.profileCompleteness || 0}%`,
                      }}
                    ></div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-purple-100">
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    {userProfile?.recommendationReadiness || 0}%
                  </div>
                  <div className="text-xs text-purple-700">
                    AI Readiness Score
                  </div>
                  <div className="w-full bg-purple-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${userProfile?.recommendationReadiness || 0}%`,
                      }}
                    ></div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-purple-100">
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    {recommendations.length}
                  </div>
                  <div className="text-xs text-purple-700">
                    AI Matches Found
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-purple-100">
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    {Math.round(aiInsights?.average_score || 0)}%
                  </div>
                  <div className="text-xs text-purple-700">
                    Average Match Score
                  </div>
                </div>
              </div>

              {/* AI Model Status */}
              <div className="mt-4 p-3 bg-white rounded-lg border border-purple-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-purple-700">
                    AI Model Status:
                  </span>
                  <div className="flex items-center">
                    {aiModelStatus?.status === "healthy" && (
                      <span className="flex items-center text-green-600 text-sm">
                        <i className="fas fa-check-circle mr-1"></i>
                        Fully Operational
                      </span>
                    )}
                    {aiModelStatus?.status === "degraded" && (
                      <span className="flex items-center text-yellow-600 text-sm">
                        <i className="fas fa-exclamation-triangle mr-1"></i>
                        Limited Mode
                      </span>
                    )}
                    {(!aiModelStatus || aiModelStatus?.status === "error") && (
                      <span className="flex items-center text-red-600 text-sm">
                        <i className="fas fa-times-circle mr-1"></i>
                        Fallback Mode
                      </span>
                    )}
                  </div>
                </div>
                {aiModelStatus?.capabilities && (
                  <div className="mt-2 text-xs text-purple-600">
                    Features: {aiModelStatus.capabilities.join(", ")}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 pt-6 border-t border-purple-200 flex justify-center space-x-4">
            <button
              onClick={() => (window.location.href = "/profile/seeker")}
              className="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center"
            >
              <i className="fas fa-user-edit mr-2"></i>
              Optimize Profile for AI
            </button>
            <button
              onClick={() => setShowPreferences(true)}
              className="px-6 py-3 border border-purple-600 text-purple-600 rounded-md hover:bg-purple-50 transition-colors flex items-center"
            >
              <i className="fas fa-cogs mr-2"></i>
              Fine-tune AI Settings
            </button>
            <button
              onClick={fetchRecommendations}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
            >
              <i className="fas fa-sync-alt mr-2"></i>
              Refresh AI Analysis
            </button>
          </div>
        </div>

        {/* Footer with AI Information */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <div className="flex items-center justify-center space-x-4 mb-2">
            <span className="flex items-center">
              <i className="fas fa-robot mr-1 text-blue-600"></i>
              Powered by Advanced AI
            </span>
            <span className="flex items-center">
              <i className="fas fa-sync-alt mr-1 text-green-600"></i>
              Updated in Real-time
            </span>
            <span className="flex items-center">
              <i className="fas fa-shield-alt mr-1 text-purple-600"></i>
              Privacy Protected
            </span>
          </div>
          <p className="flex items-center justify-center">
            <i className="fas fa-info-circle mr-1"></i>
            AI recommendations improve with your interactions •
            <button
              onClick={() => window.open("/about/ai", "_blank")}
              className="ml-1 text-blue-600 hover:text-blue-800 underline"
            >
              Learn about our AI technology
            </button>
          </p>
          <div className="mt-2 text-xs text-gray-400">
            Last updated: {new Date().toLocaleString()} • Algorithm:{" "}
            {aiInsights?.algorithm_used || "Hybrid"} • Version: 2.0
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobRecommendations;
