// controllers/enhancedJobController.js - Fixed AI-Enhanced Job Controller
const Job = require('../models/Job');
const User = require('../models/User');
const mongoose = require('mongoose');

// Create a fallback recommendation service if the Python AI model isn't available
const createFallbackRecommendationService = () => {
  return {
    getAIRecommendations: async (user, options) => {
      console.log('🔄 Using fallback rule-based recommendations');
      
      const { limit = 20, excludeApplied = true } = options;
      
      try {
        // Build query for rule-based recommendations
        let query = { status: 'active' };
        
        // Exclude applied jobs if user has applications
        if (excludeApplied && user.role === 'jobseeker') {
          // You can implement this logic based on your application model
          // For now, we'll skip this to avoid dependencies
        }
        
        // Location-based filtering
        if (user.location) {
          query.$or = [
            { location: { $regex: user.location, $options: 'i' } },
            { isRemote: true },
            { workArrangement: 'Remote' }
          ];
        }
        
        // Skills-based filtering (if user has skills)
        if (user.skills && user.skills.length > 0) {
          query.skills = { $in: user.skills.map(skill => new RegExp(skill, 'i')) };
        }
        
        // Industry preferences
        if (user.preferences?.industries?.length > 0) {
          query.industry = { $in: user.preferences.industries };
        }
        
        // Job type preferences
        if (user.preferences?.jobTypes?.length > 0) {
          query.jobType = { $in: user.preferences.jobTypes };
        }
        
        // Experience level matching
        if (user.inferredExperienceLevel) {
          query.experience = user.inferredExperienceLevel;
        }
        
        // Salary preferences
        if (user.preferences?.salaryRange?.min) {
          query['salary.min'] = { $gte: user.preferences.salaryRange.min };
        }
        
        // If no specific criteria, get popular jobs
        if (Object.keys(query).length === 1) {
          // Only has status: 'active', so get trending jobs
          const jobs = await Job.find(query)
            .populate('employer', 'companyName companyLogo')
            .sort({ viewCount: -1, applicationCount: -1, createdAt: -1 })
            .limit(limit);
            
          return jobs.map(job => ({
            ...job.toObject(),
            recommendationScore: 75, // Default score for trending jobs
            isAIGenerated: false,
            matchingReasons: ['Popular job', 'High engagement']
          }));
        }
        
        // Get matched jobs
        const jobs = await Job.find(query)
          .populate('employer', 'companyName companyLogo')
          .sort({ createdAt: -1 })
          .limit(limit);
        
        // Calculate basic recommendation scores
        return jobs.map(job => {
          let score = 50; // Base score
          let reasons = [];
          
          // Location match bonus
          if (user.location && job.location.toLowerCase().includes(user.location.toLowerCase())) {
            score += 15;
            reasons.push('Location match');
          }
          
          // Skills match bonus
          if (user.skills && user.skills.length > 0) {
            const matchingSkills = job.skills.filter(jobSkill => 
              user.skills.some(userSkill => 
                jobSkill.toLowerCase().includes(userSkill.toLowerCase())
              )
            );
            if (matchingSkills.length > 0) {
              score += Math.min(matchingSkills.length * 10, 30);
              reasons.push(`${matchingSkills.length} skill matches`);
            }
          }
          
          // Experience match bonus
          if (job.experience === user.inferredExperienceLevel) {
            score += 10;
            reasons.push('Experience level match');
          }
          
          // Industry preference bonus
          if (user.preferences?.industries?.includes(job.industry)) {
            score += 10;
            reasons.push('Industry preference match');
          }
          
          // Job type preference bonus
          if (user.preferences?.jobTypes?.includes(job.jobType)) {
            score += 5;
            reasons.push('Job type preference match');
          }
          
          return {
            ...job.toObject(),
            recommendationScore: Math.min(score, 100),
            isAIGenerated: false,
            matchingReasons: reasons
          };
        }).sort((a, b) => b.recommendationScore - a.recommendationScore);
        
      } catch (error) {
        console.error('Fallback recommendation error:', error);
        
        // Ultimate fallback - just get recent active jobs
        const jobs = await Job.find({ status: 'active' })
          .populate('employer', 'companyName companyLogo')
          .sort({ createdAt: -1 })
          .limit(limit);
          
        return jobs.map(job => ({
          ...job.toObject(),
          recommendationScore: 60,
          isAIGenerated: false,
          matchingReasons: ['Recent job posting']
        }));
      }
    },

    predictSalary: async (jobDetails) => {
      console.log('🔄 Using fallback salary prediction');
      
      // Simple rule-based salary prediction
      let baseSalary = 50000; // Base salary
      
      // Experience level adjustments
      const experienceMultipliers = {
        'Entry-level': 1.0,
        'Mid-level': 1.4,
        'Senior': 1.8,
        'Executive': 2.5
      };
      
      if (jobDetails.experience && experienceMultipliers[jobDetails.experience]) {
        baseSalary *= experienceMultipliers[jobDetails.experience];
      }
      
      // Industry adjustments
      const industryMultipliers = {
        'Software': 1.3,
        'AI/ML': 1.4,
        'Fintech': 1.3,
        'Healthcare': 1.1,
        'Education': 0.9,
        'Media': 1.0
      };
      
      if (jobDetails.industry && industryMultipliers[jobDetails.industry]) {
        baseSalary *= industryMultipliers[jobDetails.industry];
      }
      
      // Location adjustments
      const locationMultipliers = {
        'San Francisco': 1.4,
        'New York': 1.3,
        'Seattle': 1.2,
        'Austin': 1.1,
        'Boston': 1.2,
        'Chicago': 1.1,
        'Los Angeles': 1.2
      };
      
      if (jobDetails.location) {
        for (const [city, multiplier] of Object.entries(locationMultipliers)) {
          if (jobDetails.location.includes(city)) {
            baseSalary *= multiplier;
            break;
          }
        }
      }
      
      // Skills bonus
      if (jobDetails.skills) {
        const skillCount = jobDetails.skills.split(',').length;
        baseSalary *= (1 + (skillCount * 0.05)); // 5% per skill
      }
      
      return Math.round(baseSalary);
    },

    getMarketInsights: async (filters) => {
      console.log('🔄 Using fallback market insights');
      
      try {
        const matchQuery = { status: 'active' };
        
        if (filters.industry) {
          matchQuery.industry = filters.industry;
        }
        if (filters.location) {
          matchQuery.location = { $regex: filters.location, $options: 'i' };
        }
        if (filters.experience) {
          matchQuery.experience = filters.experience;
        }
        
        const insights = await Job.aggregate([
          { $match: matchQuery },
          {
            $group: {
              _id: null,
              totalJobs: { $sum: 1 },
              avgSalary: { $avg: '$salary.min' },
              minSalary: { $min: '$salary.min' },
              maxSalary: { $max: '$salary.min' },
              industries: { $addToSet: '$industry' },
              locations: { $addToSet: '$location' },
              jobTypes: { $addToSet: '$jobType' },
              experienceLevels: { $addToSet: '$experience' }
            }
          }
        ]);
        
        const result = insights[0] || {};
        
        return {
          totalJobs: result.totalJobs || 0,
          salaryInsights: {
            average: Math.round(result.avgSalary || 0),
            range: {
              min: result.minSalary || 0,
              max: result.maxSalary || 0
            }
          },
          marketTrends: {
            topIndustries: result.industries || [],
            topLocations: result.locations || [],
            popularJobTypes: result.jobTypes || [],
            demandLevels: result.experienceLevels || []
          }
        };
        
      } catch (error) {
        console.error('Market insights error:', error);
        return {
          error: 'Unable to generate market insights',
          fallback: true
        };
      }
    },

    getTrendingJobs: async (timeframe, limit) => {
      console.log('🔄 Using fallback trending jobs');
      
      const jobs = await Job.find({ status: 'active' })
        .populate('employer', 'companyName companyLogo')
        .sort({ viewCount: -1, applicationCount: -1, createdAt: -1 })
        .limit(limit);
      
      return jobs.map(job => ({
        ...job.toObject(),
        trendScore: (job.viewCount || 0) + (job.applicationCount || 0) * 2,
        trend_score: (job.viewCount || 0) + (job.applicationCount || 0) * 2
      }));
    },

    trackInteraction: async (userId, jobId, action, metadata) => {
      console.log(`📊 Tracking interaction: User ${userId} ${action} job ${jobId}`);
      // Simple interaction tracking - you can expand this
      return { success: true, tracked: true };
    }
  };
};

// Initialize recommendation service (fallback if Python model not available)
let recommendationService;
try {
  recommendationService = require('../services/recommendationService');
} catch (error) {
  console.log('⚠️ Python AI model not available, using fallback recommendations');
  recommendationService = createFallbackRecommendationService();
}

// ENHANCED AI-POWERED JOB RECOMMENDATIONS - FIXED
exports.getAIRecommendations = async (req, res) => {
  try {
    console.log('=== AI RECOMMENDATIONS REQUEST ===');
    console.log('User ID:', req.user.id);
    console.log('User Role:', req.user.role);
    
    if (req.user.role !== 'jobseeker') {
      return res.status(403).json({
        success: false,
        message: 'Only job seekers can access AI recommendations'
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const { 
      limit = 20, 
      excludeApplied = true, 
      useAI = true,
      algorithm = 'hybrid'
    } = req.query;

    console.log('User Profile Summary:', {
      skills: user.skills?.length || 0,
      preferences: !!user.preferences,
      location: user.location,
      experienceLevel: user.inferredExperienceLevel,
      profileCompleteness: user.profileCompleteness
    });

    // FIXED: More lenient profile requirements
    const hasMinimumProfile = (
      user.location || 
      (user.skills && user.skills.length > 0) || 
      (user.preferences && (
        user.preferences.industries?.length > 0 ||
        user.preferences.jobTypes?.length > 0 ||
        user.preferences.preferredLocations?.length > 0
      )) ||
      user.inferredExperienceLevel
    );

    if (!hasMinimumProfile) {
      console.log('❌ Insufficient user profile data');
      
      // Instead of rejecting, provide general recommendations with guidance
      try {
        const generalJobs = await Job.find({ status: 'active' })
          .populate('employer', 'companyName companyLogo')
          .sort({ viewCount: -1, createdAt: -1 })
          .limit(parseInt(limit));

        const recommendations = generalJobs.map(job => ({
          ...job.toObject(),
          recommendationScore: 60,
          isAIGenerated: false,
          matchingReasons: ['Popular job', 'General recommendation']
        }));

        return res.status(200).json({
          success: true,
          count: recommendations.length,
          data: recommendations,
          userProfile: {
            skills: user.skills || [],
            location: user.location,
            experienceLevel: user.inferredExperienceLevel,
            preferences: user.preferences,
            profileCompleteness: user.profileCompleteness || 0
          },
          metadata: {
            algorithm_used: 'fallback',
            ai_recommendations: 0,
            db_recommendations: recommendations.length,
            average_score: 60,
            user_profile_completeness: user.profileCompleteness || 0,
            generated_at: new Date(),
            notice: 'Limited recommendations due to incomplete profile'
          },
          suggestions: [
            'Add at least 3 relevant skills to your profile',
            'Set your preferred job types and industries',
            'Complete your work experience section',
            'Set your location preferences'
          ]
        });
      } catch (fallbackError) {
        console.error('Fallback recommendations failed:', fallbackError);
        return res.status(500).json({
          success: false,
          message: 'Unable to generate recommendations',
          error: fallbackError.message
        });
      }
    }

    // Get AI-powered recommendations
    const options = {
      limit: parseInt(limit),
      excludeApplied: excludeApplied === 'true',
      useAI: useAI === 'true' && algorithm !== 'rule-based',
      algorithm
    };

    console.log('Recommendation Options:', options);

    let recommendations = [];
    try {
      recommendations = await recommendationService.getAIRecommendations(user, options);
      console.log(`📊 AI Recommendations Generated: ${recommendations.length} jobs`);
    } catch (aiError) {
      console.error('AI recommendation error:', aiError);
      
      // Use rule-based fallback
      recommendations = await recommendationService.getAIRecommendations(user, {
        ...options,
        useAI: false
      });
      console.log(`📊 Fallback Recommendations Generated: ${recommendations.length} jobs`);
    }

    // Track recommendation generation for analytics
    setImmediate(async () => {
      try {
        await recommendationService.trackInteraction(
          user._id, 
          'system', 
          'recommendation_generated', 
          {
            count: recommendations.length,
            algorithm: algorithm,
            useAI: options.useAI
          }
        );
        
        if (user.updateActivity) {
          user.updateActivity('recommendation_view');
          await user.save({ validateBeforeSave: false });
        }
      } catch (err) {
        console.error('Error tracking recommendation generation:', err);
      }
    });

    // Calculate recommendation metadata
    const metadata = {
      algorithm_used: recommendations.some(r => r.isAIGenerated) ? 'hybrid' : 'rule-based',
      ai_recommendations: recommendations.filter(r => r.isAIGenerated).length,
      db_recommendations: recommendations.filter(r => !r.isAIGenerated).length,
      average_score: recommendations.reduce((sum, job) => sum + (job.recommendationScore || 0), 0) / Math.max(recommendations.length, 1),
      user_profile_completeness: user.profileCompleteness || 0,
      generated_at: new Date()
    };

    res.status(200).json({
      success: true,
      count: recommendations.length,
      data: recommendations,
      userProfile: {
        skills: user.skills || [],
        location: user.location,
        experienceLevel: user.inferredExperienceLevel,
        preferences: user.preferences,
        profileCompleteness: user.profileCompleteness || 0
      },
      metadata
    });

  } catch (error) {
    console.error('❌ AI Recommendation Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating AI recommendations',
      error: error.message
    });
  }
};

// AI-POWERED SALARY PREDICTION - FIXED
exports.predictJobSalary = async (req, res) => {
  try {
    const {
      title,
      experience,
      industry,
      location,
      skills,
      company
    } = req.body;

    // Validate required fields
    if (!title || !experience || !industry || !location) {
      return res.status(400).json({
        success: false,
        message: 'Title, experience, industry, and location are required'
      });
    }

    console.log('🤖 AI Salary Prediction Request:', {
      title, experience, industry, location
    });

    // Prepare job details for AI model
    const jobDetails = {
      title,
      experience,
      industry,
      location,
      skills: Array.isArray(skills) ? skills.join(', ') : skills || '',
      company: company || ''
    };

    let predictedSalary;
    try {
      // Get AI salary prediction
      predictedSalary = await recommendationService.predictSalary(jobDetails);
    } catch (aiError) {
      console.error('AI salary prediction error:', aiError);
      predictedSalary = null;
    }

    // Get market data for comparison
    const marketData = await Job.aggregate([
      {
        $match: {
          status: 'active',
          'salary.min': { $exists: true, $gt: 0 },
          $or: [
            { industry: new RegExp(industry, 'i') },
            { experience: new RegExp(experience, 'i') },
            { title: new RegExp(title, 'i') }
          ]
        }
      },
      {
        $group: {
          _id: null,
          avgSalary: { $avg: '$salary.min' },
          minSalary: { $min: '$salary.min' },
          maxSalary: { $max: '$salary.min' },
          count: { $sum: 1 }
        }
      }
    ]);

    const market = marketData[0] || {};
    
    // If AI prediction failed, use market average
    if (!predictedSalary && market.avgSalary) {
      predictedSalary = Math.round(market.avgSalary);
    }

    res.status(200).json({
      success: true,
      data: {
        predicted_salary: predictedSalary,
        job_details: jobDetails,
        market_comparison: {
          average_salary: Math.round(market.avgSalary || 0),
          salary_range: {
            min: market.minSalary || 0,
            max: market.maxSalary || 0
          },
          sample_size: market.count || 0,
          percentile: predictedSalary && market.avgSalary ? 
            Math.round((predictedSalary / market.avgSalary) * 100) : null
        },
        confidence: predictedSalary ? 'medium' : 'low',
        generated_at: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Salary Prediction Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error predicting salary',
      error: error.message
    });
  }
};

// ENHANCED MARKET INSIGHTS WITH AI - FIXED
exports.getEnhancedMarketInsights = async (req, res) => {
  try {
    if (req.user.role !== 'jobseeker') {
      return res.status(403).json({
        success: false,
        message: 'Only job seekers can access market insights'
      });
    }

    const { 
      industry, 
      experience, 
      location,
      skills,
      timeframe = 30 
    } = req.query;

    console.log('🔍 Market Insights Request:', {
      industry, experience, location, timeframe
    });

    // Prepare filters
    const filters = {};
    if (industry) filters.industry = industry;
    if (experience) filters.experience = experience;
    if (location) filters.location = location;

    let aiInsights = {};
    try {
      // Get AI-powered insights
      aiInsights = await recommendationService.getMarketInsights(filters);
    } catch (aiError) {
      console.error('AI insights error:', aiError);
    }

    // Get database insights
    const user = await User.findById(req.user.id);
    const dbInsights = await getDetailedMarketInsights(filters, user, timeframe);

    // Combine insights
    const combinedInsights = {
      ai_insights: aiInsights,
      database_insights: dbInsights,
      recommendations: generateMarketRecommendations(aiInsights, dbInsights, user),
      user_context: {
        skills: user.skills || [],
        experience_level: user.inferredExperienceLevel,
        location: user.location,
        preferences: user.preferences
      },
      generated_at: new Date()
    };

    res.status(200).json({
      success: true,
      data: combinedInsights
    });

  } catch (error) {
    console.error('❌ Market Insights Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating market insights',
      error: error.message
    });
  }
};

// ENHANCED TRENDING JOBS WITH AI - FIXED
exports.getAITrendingJobs = async (req, res) => {
  try {
    const { 
      limit = 20, 
      timeframe = 7,
      algorithm = 'hybrid'
    } = req.query;

    console.log('🔥 AI Trending Jobs Request:', {
      limit, timeframe, algorithm
    });

    let trendingJobs = [];

    if (algorithm === 'ai' || algorithm === 'hybrid') {
      try {
        const aiTrending = await recommendationService.getTrendingJobs(timeframe, parseInt(limit));
        trendingJobs = aiTrending;
        console.log(`🤖 AI Trending: ${aiTrending.length} jobs`);
      } catch (error) {
        console.error('AI trending failed, falling back to engagement:', error);
      }
    }

    if (trendingJobs.length === 0 || algorithm === 'engagement' || algorithm === 'hybrid') {
      // Fallback to engagement-based trending
      const engagementTrending = await getEngagementTrendingJobs(parseInt(timeframe), parseInt(limit));
      
      if (algorithm === 'hybrid' && trendingJobs.length > 0) {
        // Merge AI and engagement results
        trendingJobs = mergeAndDedupeTrendingJobs(trendingJobs, engagementTrending, parseInt(limit));
      } else {
        trendingJobs = engagementTrending;
      }
      
      console.log(`📊 Engagement Trending: ${engagementTrending.length} jobs`);
    }

    res.status(200).json({
      success: true,
      count: trendingJobs.length,
      timeframe: `${timeframe} days`,
      algorithm_used: algorithm,
      data: trendingJobs
    });

  } catch (error) {
    console.error('❌ AI Trending Jobs Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting trending jobs',
      error: error.message
    });
  }
};

// JOB INTERACTION TRACKING FOR AI LEARNING - FIXED
exports.trackJobInteraction = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { 
      action, 
      metadata = {},
      duration,
      source
    } = req.body;

    if (!action) {
      return res.status(400).json({
        success: false,
        message: 'Action is required'
      });
    }

    const validActions = ['viewed', 'clicked', 'saved', 'applied', 'liked', 'disliked', 'shared'];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action type'
      });
    }

    console.log(`🔄 Tracking interaction: User ${req.user.id} ${action} job ${jobId}`);

    // Track interaction for AI learning
    await recommendationService.trackInteraction(req.user.id, jobId, action, {
      ...metadata,
      duration,
      source,
      timestamp: new Date(),
      user_agent: req.headers['user-agent']
    });

    // Update job engagement metrics
    if (['viewed', 'clicked', 'saved', 'applied'].includes(action)) {
      const updateField = action === 'viewed' ? 'viewCount' : 
                         action === 'clicked' ? 'clickCount' :
                         action === 'saved' ? 'saveCount' : 'applicationCount';
      
      setImmediate(async () => {
        try {
          await Job.findByIdAndUpdate(jobId, { $inc: { [updateField]: 1 } });
        } catch (updateError) {
          console.error('Error updating job metrics:', updateError);
        }
      });
    }

    // Update user engagement metrics
    const user = await User.findById(req.user.id);
    if (user && user.updateActivity) {
      user.updateActivity(`job_${action}`);
      setImmediate(async () => {
        try {
          await user.save({ validateBeforeSave: false });
        } catch (saveError) {
          console.error('Error saving user activity:', saveError);
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Interaction tracked successfully',
      data: {
        user_id: req.user.id,
        job_id: jobId,
        action,
        tracked_at: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Interaction Tracking Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error tracking interaction',
      error: error.message
    });
  }
};

// AI MODEL HEALTH CHECK - FIXED
exports.getAIModelStatus = async (req, res) => {
  try {
    let modelStatus = {
      status: 'unknown',
      version: '1.0.0',
      last_updated: new Date(),
      capabilities: []
    };

    try {
      // Try to get AI model status
      const testRecommendations = await recommendationService.getAIRecommendations(
        { skills: ['test'], location: 'test' }, 
        { limit: 1 }
      );
      
      modelStatus = {
        status: 'healthy',
        version: '1.0.0',
        last_updated: new Date(),
        capabilities: [
          'job_recommendations',
          'salary_prediction', 
          'market_insights',
          'trending_analysis'
        ],
        test_result: 'passed'
      };
    } catch (testError) {
      modelStatus = {
        status: 'degraded',
        version: '1.0.0',
        last_updated: new Date(),
        capabilities: ['fallback_recommendations'],
        test_result: 'failed',
        error: testError.message
      };
    }
    
    res.status(200).json({
      success: true,
      ai_model: modelStatus,
      backend_status: 'healthy',
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('❌ AI Model Status Error:', error);
    res.status(500).json({
      success: false,
      ai_model: { status: 'error', error: error.message },
      backend_status: 'error',
      timestamp: new Date()
    });
  }
};

// HELPER FUNCTIONS

async function getDetailedMarketInsights(filters, user, timeframe) {
  try {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - parseInt(timeframe));
    
    const matchStage = { 
      status: 'active',
      createdAt: { $gte: dateThreshold }
    };
    
    if (filters.industry) {
      matchStage.industry = new RegExp(filters.industry, 'i');
    }
    if (filters.experience) {
      matchStage.experience = new RegExp(filters.experience, 'i');
    }
    if (filters.location) {
      matchStage.location = new RegExp(filters.location, 'i');
    }

    const insights = await Job.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalJobs: { $sum: 1 },
          avgSalary: { $avg: '$salary.min' },
          topCompanies: { $addToSet: '$company' },
          topLocations: { $push: '$location' },
          topIndustries: { $push: '$industry' },
          requiredSkills: { $push: '$skills' },
          jobTypes: { $push: '$jobType' },
          experienceLevels: { $push: '$experience' }
        }
      }
    ]);

    if (insights.length === 0) {
      return { totalJobs: 0, message: 'No recent jobs found matching criteria' };
    }

    const result = insights[0];
    
    // Process skills data
    const allSkills = result.requiredSkills.flat().filter(skill => skill);
    const skillCounts = {};
    allSkills.forEach(skill => {
      const lowerSkill = skill.toLowerCase();
      skillCounts[lowerSkill] = (skillCounts[lowerSkill] || 0) + 1;
    });
    
    const topSkills = Object.entries(skillCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 15)
      .map(([skill, count]) => ({ skill, count, demand: count > 5 ? 'high' : count > 2 ? 'medium' : 'low' }));

    // Calculate user skill compatibility
    const userSkillCompatibility = user.skills ? 
      topSkills.filter(skillData => 
        user.skills.some(userSkill => 
          userSkill.toLowerCase().includes(skillData.skill) || 
          skillData.skill.includes(userSkill.toLowerCase())
        )
      ).length / Math.max(topSkills.length, 1) * 100 : 0;

    return {
      totalJobs: result.totalJobs,
      avgSalary: Math.round(result.avgSalary || 0),
      topSkills,
      userSkillCompatibility: Math.round(userSkillCompatibility),
      topCompanies: result.topCompanies.slice(0, 10),
      distributionData: {
        locations: getFrequencyDistribution(result.topLocations),
        industries: getFrequencyDistribution(result.topIndustries),
        jobTypes: getFrequencyDistribution(result.jobTypes),
        experienceLevels: getFrequencyDistribution(result.experienceLevels)
      },
      timeframe: `${timeframe} days`
    };

  } catch (error) {
    console.error('Error getting detailed market insights:', error);
    return { error: 'Failed to generate market insights' };
  }
}

async function getEngagementTrendingJobs(timeframe, limit) {
  try {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - timeframe);

    const trendingJobs = await Job.find({
      status: 'active',
      createdAt: { $gte: dateThreshold }
    })
    .populate('employer', 'companyName companyLogo companyDescription')
    .sort({ 
      viewCount: -1, 
      applicationCount: -1, 
      saveCount: -1,
      createdAt: -1 
    })
    .limit(limit);

    return trendingJobs.map(job => {
      const daysOld = Math.max(1, (new Date() - job.createdAt) / (1000 * 60 * 60 * 24));
      const trendScore = calculateEngagementTrendScore(job, daysOld);
      
      return {
        ...job.toObject(),
        trendScore,
        trend_score: trendScore,
        engagement_velocity: {
          views_per_day: (job.viewCount || 0) / daysOld,
          applications_per_day: (job.applicationCount || 0) / daysOld,
          saves_per_day: (job.saveCount || 0) / daysOld
        }
      };
    });

  } catch (error) {
    console.error('Error getting engagement trending jobs:', error);
    return [];
  }
}

function calculateEngagementTrendScore(job, daysOld) {
  const viewsPerDay = (job.viewCount || 0) / daysOld;
  const applicationsPerDay = (job.applicationCount || 0) / daysOld;
  const savesPerDay = (job.saveCount || 0) / daysOld;
  
  // Weighted scoring
  return (viewsPerDay * 0.3) + (applicationsPerDay * 0.5) + (savesPerDay * 0.2);
}

function mergeAndDedupeTrendingJobs(aiJobs, engagementJobs, limit) {
  const merged = [];
  const seenTitles = new Set();
  
  // Add AI jobs first (they have higher priority)
  for (const job of aiJobs) {
    const key = `${job.job_title || job.title}-${job.company}`.toLowerCase();
    if (!seenTitles.has(key)) {
      merged.push({ ...job, source: 'ai' });
      seenTitles.add(key);
    }
  }
  
  // Add engagement jobs if not already present
  for (const job of engagementJobs) {
    const key = `${job.title}-${job.company}`.toLowerCase();
    if (!seenTitles.has(key) && merged.length < limit) {
      merged.push({ ...job, source: 'engagement' });
      seenTitles.add(key);
    }
  }
  
  return merged.slice(0, limit);
}

function generateMarketRecommendations(aiInsights, dbInsights, user) {
  const recommendations = [];
  
  try {
    // Skill-based recommendations
    if (dbInsights.topSkills && user.skills) {
      const userSkills = user.skills.map(s => s.toLowerCase());
      const highDemandSkills = dbInsights.topSkills
        .filter(skillData => skillData.demand === 'high')
        .filter(skillData => !userSkills.includes(skillData.skill))
        .slice(0, 3);
      
      if (highDemandSkills.length > 0) {
        recommendations.push({
          type: 'skill_development',
          priority: 'high',
          title: 'Learn In-Demand Skills',
          description: `Consider learning these high-demand skills: ${highDemandSkills.map(s => s.skill).join(', ')}`,
          skills: highDemandSkills,
          impact: 'Could increase job opportunities by 40-60%'
        });
      }
    }
    
    // Salary optimization recommendations
    if (aiInsights.salaryInsights && dbInsights.avgSalary) {
      const userExpectedSalary = user.preferences?.salaryRange?.min || 0;
      const marketAverage = dbInsights.avgSalary;
      
      if (userExpectedSalary > 0 && marketAverage > userExpectedSalary * 1.2) {
        recommendations.push({
          type: 'salary_optimization',
          priority: 'medium',
          title: 'Salary Expectations Review',
          description: `Market average (${marketAverage.toLocaleString()}) is ${Math.round((marketAverage/userExpectedSalary - 1) * 100)}% higher than your expectation`,
          current_expectation: userExpectedSalary,
          market_average: marketAverage,
          suggested_range: {
            min: Math.round(marketAverage * 0.9),
            max: Math.round(marketAverage * 1.2)
          }
        });
      }
    }
    
    // Profile completion recommendations
    if (user.profileCompleteness < 80) {
      recommendations.push({
        type: 'profile_optimization',
        priority: 'high',
        title: 'Complete Your Profile',
        description: `Your profile is ${user.profileCompleteness}% complete. Complete profiles get 3x more recommendations`,
        current_completeness: user.profileCompleteness,
        target_completeness: 80,
        missing_sections: getIncompleteProfileSections(user)
      });
    }
    
  } catch (error) {
    console.error('Error generating market recommendations:', error);
  }
  
  return recommendations.slice(0, 5); // Return top 5 recommendations
}

function getFrequencyDistribution(array) {
  const counts = {};
  array.forEach(item => {
    if (item && typeof item === 'string') {
      counts[item] = (counts[item] || 0) + 1;
    }
  });
  
  return Object.entries(counts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .reduce((obj, [key, value]) => {
      obj[key] = value;
      return obj;
    }, {});
}

function getIncompleteProfileSections(user) {
  const missing = [];
  
  if (!user.profilePhoto) missing.push('Profile Photo');
  if (!user.bio || user.bio.length < 50) missing.push('Professional Bio');
  if (!user.skills || user.skills.length < 3) missing.push('Skills (minimum 3)');
  if (!user.experience || user.experience.length === 0) missing.push('Work Experience');
  if (!user.education || user.education.length === 0) missing.push('Education');
  if (!user.portfolio?.linkedin) missing.push('LinkedIn Profile');
  if (!user.preferences?.jobTypes) missing.push('Job Preferences');
  
  return missing;
}

module.exports = {
  getAIRecommendations: exports.getAIRecommendations,
  predictJobSalary: exports.predictJobSalary,
  getEnhancedMarketInsights: exports.getEnhancedMarketInsights,
  getAITrendingJobs: exports.getAITrendingJobs,
  trackJobInteraction: exports.trackJobInteraction,
  getAIModelStatus: exports.getAIModelStatus
};