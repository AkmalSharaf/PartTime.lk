// services/recommendationService.js - FIXED Recommendation Service with Better Matching
const Job = require('../models/Job');
const User = require('../models/User');
const mongoose = require('mongoose');

class RecommendationService {
  constructor() {
    this.pythonModelAvailable = false;
  }

  async getAIRecommendations(user, options = {}) {
    const { limit = 20, excludeApplied = true } = options;
    
    console.log('🎯 Starting recommendation process for user:', user._id);
    console.log('📊 User profile:', {
      skills: user.skills?.length || 0,
      location: user.location,
      experience: user.inferredExperienceLevel,
      preferences: !!user.preferences
    });
    
    try {
      // Use progressive recommendation strategy
      let recommendations = [];
      
      // Strategy 1: Exact match recommendations
      recommendations = await this.getExactMatchJobs(user, Math.min(limit, 10));
      console.log(`✓ Exact matches found: ${recommendations.length}`);
      
      // Strategy 2: Skill-based recommendations if not enough exact matches
      if (recommendations.length < limit) {
        const skillBased = await this.getSkillBasedJobs(user, limit - recommendations.length);
        recommendations = [...recommendations, ...skillBased];
        console.log(`✓ After skill-based: ${recommendations.length}`);
      }
      
      // Strategy 3: Industry-based recommendations
      if (recommendations.length < limit) {
        const industryBased = await this.getIndustryBasedJobs(user, limit - recommendations.length, recommendations.map(r => r._id));
        recommendations = [...recommendations, ...industryBased];
        console.log(`✓ After industry-based: ${recommendations.length}`);
      }
      
      // Strategy 4: Experience-level based recommendations
      if (recommendations.length < limit) {
        const experienceBased = await this.getExperienceBasedJobs(user, limit - recommendations.length, recommendations.map(r => r._id));
        recommendations = [...recommendations, ...experienceBased];
        console.log(`✓ After experience-based: ${recommendations.length}`);
      }
      
      // Strategy 5: Location-based recommendations (including remote)
      if (recommendations.length < limit) {
        const locationBased = await this.getLocationBasedJobs(user, limit - recommendations.length, recommendations.map(r => r._id));
        recommendations = [...recommendations, ...locationBased];
        console.log(`✓ After location-based: ${recommendations.length}`);
      }
      
      // Strategy 6: Recent popular jobs as fallback
      if (recommendations.length < limit) {
        const popular = await this.getPopularJobs(limit - recommendations.length, recommendations.map(r => r._id));
        recommendations = [...recommendations, ...popular];
        console.log(`✓ After popular jobs: ${recommendations.length}`);
      }
      
      // Calculate recommendation scores and add metadata
      const scoredRecommendations = recommendations.map((job, index) => {
        const score = this.calculateRecommendationScore(job, user, index);
        const reasons = this.generateRecommendationReasons(job, user);
        
        return {
          ...job,
          recommendationScore: score,
          isAIGenerated: false,
          matchingReasons: reasons,
          recommendationRank: index + 1
        };
      });
      
      // Sort by recommendation score
      const finalRecommendations = scoredRecommendations
        .sort((a, b) => b.recommendationScore - a.recommendationScore)
        .slice(0, limit);
      
      console.log(`🎉 Final recommendations: ${finalRecommendations.length}`);
      console.log('📈 Score distribution:', finalRecommendations.map(r => Math.round(r.recommendationScore)));
      
      return finalRecommendations;
      
    } catch (error) {
      console.error('❌ Recommendation error:', error);
      // Return empty array instead of throwing to prevent frontend crashes
      return [];
    }
  }

  async getExactMatchJobs(user, limit) {
    try {
      const query = { status: 'active' };
      const matchConditions = [];
      
      // Skills AND industry AND experience match
      if (user.skills?.length > 0) {
        matchConditions.push({
          skills: { $in: user.skills.map(skill => new RegExp(skill, 'i')) }
        });
      }
      
      if (user.preferences?.industries?.length > 0) {
        matchConditions.push({
          industry: { $in: user.preferences.industries }
        });
      }
      
      if (user.inferredExperienceLevel) {
        matchConditions.push({
          experience: user.inferredExperienceLevel
        });
      }
      
      if (matchConditions.length > 0) {
        query.$and = matchConditions;
      }
      
      const jobs = await Job.find(query)
        .populate('employer', 'companyName companyLogo companyDescription industry')
        .sort({ createdAt: -1, viewCount: -1 })
        .limit(limit)
        .lean();
      
      return jobs;
    } catch (error) {
      console.error('Exact match error:', error);
      return [];
    }
  }

  async getSkillBasedJobs(user, limit) {
    try {
      if (!user.skills?.length) return [];
      
      const jobs = await Job.find({
        status: 'active',
        skills: { $in: user.skills.map(skill => new RegExp(skill, 'i')) }
      })
      .populate('employer', 'companyName companyLogo companyDescription industry')
      .sort({ createdAt: -1 })
      .limit(limit * 2) // Get more to filter
      .lean();
      
      // Filter and score by skill match count
      const scoredJobs = jobs.map(job => {
        const matchingSkills = job.skills.filter(jobSkill =>
          user.skills.some(userSkill =>
            jobSkill.toLowerCase().includes(userSkill.toLowerCase()) ||
            userSkill.toLowerCase().includes(jobSkill.toLowerCase())
          )
        );
        
        return {
          ...job,
          skillMatchCount: matchingSkills.length,
          matchingSkills
        };
      });
      
      return scoredJobs
        .sort((a, b) => b.skillMatchCount - a.skillMatchCount)
        .slice(0, limit);
        
    } catch (error) {
      console.error('Skill-based error:', error);
      return [];
    }
  }

  async getIndustryBasedJobs(user, limit, excludeIds = []) {
    try {
      const industries = user.preferences?.industries || [];
      if (industries.length === 0) return [];
      
      const jobs = await Job.find({
        status: 'active',
        _id: { $nin: excludeIds },
        industry: { $in: industries }
      })
      .populate('employer', 'companyName companyLogo companyDescription industry')
      .sort({ viewCount: -1, createdAt: -1 })
      .limit(limit)
      .lean();
      
      return jobs;
    } catch (error) {
      console.error('Industry-based error:', error);
      return [];
    }
  }

  async getExperienceBasedJobs(user, limit, excludeIds = []) {
    try {
      if (!user.inferredExperienceLevel) return [];
      
      // Include adjacent experience levels for flexibility
      const experienceLevels = ['Entry-level', 'Mid-level', 'Senior', 'Executive'];
      const userIndex = experienceLevels.indexOf(user.inferredExperienceLevel);
      const targetLevels = [];
      
      // Add current level
      targetLevels.push(user.inferredExperienceLevel);
      
      // Add adjacent levels
      if (userIndex > 0) targetLevels.push(experienceLevels[userIndex - 1]);
      if (userIndex < experienceLevels.length - 1) targetLevels.push(experienceLevels[userIndex + 1]);
      
      const jobs = await Job.find({
        status: 'active',
        _id: { $nin: excludeIds },
        experience: { $in: targetLevels }
      })
      .populate('employer', 'companyName companyLogo companyDescription industry')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
      
      return jobs;
    } catch (error) {
      console.error('Experience-based error:', error);
      return [];
    }
  }

  async getLocationBasedJobs(user, limit, excludeIds = []) {
    try {
      const query = {
        status: 'active',
        _id: { $nin: excludeIds }
      };
      
      const locationConditions = [];
      
      // User's current location
      if (user.location) {
        locationConditions.push({
          location: { $regex: user.location, $options: 'i' }
        });
      }
      
      // User's preferred locations
      if (user.preferences?.preferredLocations?.length > 0) {
        user.preferences.preferredLocations.forEach(loc => {
          locationConditions.push({
            location: { $regex: loc, $options: 'i' }
          });
        });
      }
      
      // Remote work preference
      if (user.preferences?.remoteWork) {
        locationConditions.push({ isRemote: true });
        locationConditions.push({ workArrangement: 'Remote' });
        locationConditions.push({ location: { $regex: 'remote', $options: 'i' } });
      }
      
      if (locationConditions.length > 0) {
        query.$or = locationConditions;
      } else {
        // Fallback: include remote jobs for everyone
        query.$or = [
          { isRemote: true },
          { workArrangement: 'Remote' }
        ];
      }
      
      const jobs = await Job.find(query)
        .populate('employer', 'companyName companyLogo companyDescription industry')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
      
      return jobs;
    } catch (error) {
      console.error('Location-based error:', error);
      return [];
    }
  }

  async getPopularJobs(limit, excludeIds = []) {
    try {
      const jobs = await Job.find({
        status: 'active',
        _id: { $nin: excludeIds }
      })
      .populate('employer', 'companyName companyLogo companyDescription industry')
      .sort({ 
        viewCount: -1, 
        applicationCount: -1,
        saveCount: -1,
        createdAt: -1 
      })
      .limit(limit)
      .lean();
      
      return jobs;
    } catch (error) {
      console.error('Popular jobs error:', error);
      return [];
    }
  }

  calculateRecommendationScore(job, user, rank = 0) {
    let score = 50; // Base score
    
    try {
      // Skill matching (0-30 points)
      if (user.skills?.length > 0 && job.skills?.length > 0) {
        const matchingSkills = job.skills.filter(jobSkill =>
          user.skills.some(userSkill =>
            jobSkill.toLowerCase().includes(userSkill.toLowerCase()) ||
            userSkill.toLowerCase().includes(jobSkill.toLowerCase())
          )
        );
        
        const skillMatchRatio = matchingSkills.length / Math.max(user.skills.length, 1);
        score += skillMatchRatio * 30;
      }
      
      // Experience level matching (0-20 points)
      if (job.experience === user.inferredExperienceLevel) {
        score += 20;
      } else if (user.inferredExperienceLevel) {
        const experienceLevels = ['Entry-level', 'Mid-level', 'Senior', 'Executive'];
        const userIndex = experienceLevels.indexOf(user.inferredExperienceLevel);
        const jobIndex = experienceLevels.indexOf(job.experience);
        
        if (Math.abs(userIndex - jobIndex) === 1) {
          score += 10; // Adjacent level
        }
      }
      
      // Industry matching (0-15 points)
      if (user.preferences?.industries?.includes(job.industry)) {
        score += 15;
      }
      
      // Location matching (0-15 points)
      if (user.location && job.location?.toLowerCase().includes(user.location.toLowerCase())) {
        score += 15;
      } else if (job.isRemote || job.workArrangement === 'Remote') {
        score += 10;
      }
      
      // Job type preference (0-10 points)
      if (user.preferences?.jobTypes?.includes(job.jobType)) {
        score += 10;
      }
      
      // Salary compatibility (0-10 points)
      if (user.preferences?.salaryRange?.min && job.salary?.min) {
        if (job.salary.min >= user.preferences.salaryRange.min) {
          score += 10;
        } else if (job.salary.min >= user.preferences.salaryRange.min * 0.8) {
          score += 5; // Close to expected
        }
      }
      
      // Company size preference (0-5 points)
      if (user.preferences?.companySize?.includes(job.companySize)) {
        score += 5;
      }
      
      // Recency bonus (0-5 points)
      const daysOld = (new Date() - new Date(job.createdAt)) / (1000 * 60 * 60 * 24);
      if (daysOld <= 7) {
        score += 5;
      } else if (daysOld <= 30) {
        score += 3;
      }
      
      // Popularity bonus (0-5 points)
      const totalEngagement = (job.viewCount || 0) + (job.applicationCount || 0) * 2 + (job.saveCount || 0);
      if (totalEngagement > 50) {
        score += 5;
      } else if (totalEngagement > 20) {
        score += 3;
      }
      
      // Ranking penalty (reduce score for lower-ranked strategies)
      const rankPenalty = Math.floor(rank / 5) * 2;
      score = Math.max(score - rankPenalty, 10);
      
    } catch (error) {
      console.error('Score calculation error:', error);
    }
    
    return Math.min(Math.round(score), 100);
  }

  generateRecommendationReasons(job, user) {
    const reasons = [];
    
    try {
      // Skill matches
      if (user.skills?.length > 0 && job.skills?.length > 0) {
        const matchingSkills = job.skills.filter(jobSkill =>
          user.skills.some(userSkill =>
            jobSkill.toLowerCase().includes(userSkill.toLowerCase()) ||
            userSkill.toLowerCase().includes(jobSkill.toLowerCase())
          )
        );
        
        if (matchingSkills.length > 0) {
          reasons.push(`${matchingSkills.length} of your skills match this role`);
        }
      }
      
      // Experience level
      if (job.experience === user.inferredExperienceLevel) {
        reasons.push('Perfect experience level match');
      } else if (user.inferredExperienceLevel) {
        const experienceLevels = ['Entry-level', 'Mid-level', 'Senior', 'Executive'];
        const userIndex = experienceLevels.indexOf(user.inferredExperienceLevel);
        const jobIndex = experienceLevels.indexOf(job.experience);
        
        if (Math.abs(userIndex - jobIndex) === 1) {
          reasons.push('Compatible experience level');
        }
      }
      
      // Industry match
      if (user.preferences?.industries?.includes(job.industry)) {
        reasons.push('Industry matches your preferences');
      }
      
      // Location match
      if (user.location && job.location?.toLowerCase().includes(user.location.toLowerCase())) {
        reasons.push('Location matches your area');
      } else if (job.isRemote || job.workArrangement === 'Remote') {
        reasons.push('Remote work opportunity');
      }
      
      // Job type
      if (user.preferences?.jobTypes?.includes(job.jobType)) {
        reasons.push('Job type matches your preference');
      }
      
      // Salary
      if (user.preferences?.salaryRange?.min && job.salary?.min >= user.preferences.salaryRange.min) {
        reasons.push('Salary meets your expectations');
      }
      
      // Company size
      if (user.preferences?.companySize?.includes(job.companySize)) {
        reasons.push('Company size fits your preference');
      }
      
      // Recent posting
      const daysOld = (new Date() - new Date(job.createdAt)) / (1000 * 60 * 60 * 24);
      if (daysOld <= 7) {
        reasons.push('Recently posted opportunity');
      }
      
      // Popular job
      const totalEngagement = (job.viewCount || 0) + (job.applicationCount || 0) * 2;
      if (totalEngagement > 30) {
        reasons.push('High-interest position');
      }
      
      // Fallback reasons
      if (reasons.length === 0) {
        reasons.push('Quality opportunity in your field');
        if (job.employer?.companyName) {
          reasons.push(`From ${job.employer.companyName}`);
        }
      }
      
    } catch (error) {
      console.error('Reason generation error:', error);
      reasons.push('Recommended for you');
    }
    
    return reasons.slice(0, 4); // Limit to top 4 reasons
  }

  // Utility methods
  async predictSalary(jobDetails) {
    return this.getRuleBasedSalaryPrediction(jobDetails);
  }

  getRuleBasedSalaryPrediction(jobDetails) {
    let baseSalary = 60000;
    
    const experienceMultipliers = {
      'Entry-level': 1.0,
      'Mid-level': 1.4,
      'Senior': 1.8,
      'Executive': 2.5
    };
    
    const industryMultipliers = {
      'Software': 1.3,
      'AI/ML': 1.4,
      'Fintech': 1.3,
      'Healthcare': 1.1,
      'Education': 0.9,
      'Media': 1.0
    };
    
    const locationMultipliers = {
      'San Francisco': 1.4,
      'New York': 1.3,
      'Seattle': 1.2,
      'Austin': 1.1,
      'Boston': 1.2,
      'Remote': 1.1
    };
    
    if (jobDetails.experience && experienceMultipliers[jobDetails.experience]) {
      baseSalary *= experienceMultipliers[jobDetails.experience];
    }
    
    if (jobDetails.industry && industryMultipliers[jobDetails.industry]) {
      baseSalary *= industryMultipliers[jobDetails.industry];
    }
    
    if (jobDetails.location) {
      for (const [city, multiplier] of Object.entries(locationMultipliers)) {
        if (jobDetails.location.includes(city)) {
          baseSalary *= multiplier;
          break;
        }
      }
    }
    
    if (jobDetails.skills) {
      const skillCount = jobDetails.skills.split(',').length;
      baseSalary *= (1 + (skillCount * 0.05));
    }
    
    return Math.round(baseSalary);
  }

  async getMarketInsights(filters) {
    try {
      const matchQuery = { status: 'active' };
      
      if (filters.industry) matchQuery.industry = filters.industry;
      if (filters.location) matchQuery.location = { $regex: filters.location, $options: 'i' };
      if (filters.experience) matchQuery.experience = filters.experience;
      
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
            jobTypes: { $addToSet: '$jobType' }
          }
        }
      ]);
      
      const result = insights[0] || {};
      
      return {
        totalJobs: result.totalJobs || 0,
        salary_insights: {
          average: Math.round(result.avgSalary || 0),
          range: {
            min: result.minSalary || 0,
            max: result.maxSalary || 0
          }
        },
        market_trends: {
          top_industries: result.industries || [],
          top_locations: result.locations || [],
          popular_job_types: result.jobTypes || []
        }
      };
      
    } catch (error) {
      console.error('Market insights error:', error);
      return { error: 'Unable to generate market insights' };
    }
  }

  async getTrendingJobs(timeframe = 7, limit = 10) {
    try {
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - timeframe);
      
      const jobs = await Job.find({
        status: 'active',
        createdAt: { $gte: dateThreshold }
      })
      .populate('employer', 'companyName companyLogo')
      .sort({ viewCount: -1, applicationCount: -1, createdAt: -1 })
      .limit(limit)
      .lean();
      
      return jobs.map(job => ({
        ...job,
        trendScore: (job.viewCount || 0) + (job.applicationCount || 0) * 2,
        trend_score: (job.viewCount || 0) + (job.applicationCount || 0) * 2
      }));
      
    } catch (error) {
      console.error('Trending jobs error:', error);
      return [];
    }
  }

  async trackInteraction(userId, jobId, action, metadata = {}) {
    try {
      console.log(`📊 Tracking: User ${userId} ${action} job ${jobId}`);
      
      // Update job metrics
      if (['viewed', 'clicked', 'saved', 'applied'].includes(action)) {
        const updateField = action === 'viewed' ? 'viewCount' : 
                           action === 'clicked' ? 'clickCount' :
                           action === 'saved' ? 'saveCount' : 'applicationCount';
        
        await Job.findByIdAndUpdate(jobId, { $inc: { [updateField]: 1 } });
      }
      
      return { success: true, tracked: true };
    } catch (error) {
      console.error('Error tracking interaction:', error);
      return { success: false, error: error.message };
    }
  }

  async healthCheck() {
    try {
      const jobCount = await Job.countDocuments({ status: 'active' });
      const userCount = await User.countDocuments({ role: 'jobseeker' });
      
      return {
        service: 'healthy',
        database_connection: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        active_jobs: jobCount,
        job_seekers: userCount,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        service: 'error',
        error: error.message,
        timestamp: new Date()
      };
    }
  }
}

// Create and export singleton instance
const recommendationService = new RecommendationService();
module.exports = recommendationService;