// controllers/jobController.js - Fixed NLP Search Implementation
const Job = require('../models/Job');
const User = require('../models/User');
const mongoose = require('mongoose');

// Enhanced NLP Query Parser - FIXED VERSION
class NLPQueryParser {
  constructor() {
    // Job type patterns - Fixed structure
    this.jobTypePatterns = {
      'Full-time': [/\b(full\s*time|fulltime|permanent|full\-time|ft)\b/gi],
      'Part-time': [/\b(part\s*time|parttime|part\-time|pt|flexible|hourly)\b/gi],
      'Contract': [/\b(contract|contractor|freelance|temporary|temp|consulting)\b/gi],
      'Internship': [/\b(intern|internship|trainee|apprentice|co\-op|student)\b/gi],
      'Remote': [/\b(remote|work\s*from\s*home|wfh|virtual|distributed|anywhere)\b/gi]
    };

    // Experience patterns - Fixed structure
    this.experiencePatterns = {
      'Entry-level': [/\b(entry|junior|beginner|fresh|new\s*grad|graduate|starter)\b/gi],
      'Mid-level': [/\b(mid|intermediate|experienced|mid\-level|2\-5\s*years)\b/gi],
      'Senior': [/\b(senior|lead|principal|expert|architect|5\+\s*years)\b/gi],
      'Executive': [/\b(executive|manager|director|vp|ceo|cto|head\s*of|chief)\b/gi]
    };

    // Industry patterns - Fixed structure
    this.industryPatterns = {
      'Software': [/\b(software|tech|technology|it|programming|coding|development)\b/gi],
      'Healthcare': [/\b(healthcare|medical|hospital|clinic|health|pharma)\b/gi],
      'Finance': [/\b(finance|financial|bank|banking|investment|trading|fintech)\b/gi],
      'Education': [/\b(education|school|university|college|teaching|academic)\b/gi],
      'Marketing': [/\b(marketing|advertising|promotion|brand|campaign|digital\s*marketing)\b/gi],
      'Design': [/\b(design|creative|graphic|ui|ux|visual|art)\b/gi],
      'Sales': [/\b(sales|selling|business\s*development|account|customer)\b/gi]
    };

    // Skills patterns - Fixed structure
    this.skillsPatterns = {
      'JavaScript': [/\b(javascript|js|es6|node|nodejs|react|angular|vue)\b/gi],
      'Python': [/\b(python|django|flask|pandas|numpy|tensorflow)\b/gi],
      'Java': [/\b(java|spring|hibernate|maven|gradle)\b/gi],
      'React': [/\b(react|reactjs|react\.js|jsx|hooks)\b/gi],
      'Angular': [/\b(angular|angularjs|typescript)\b/gi],
      'Vue': [/\b(vue|vuejs|vue\.js|nuxt)\b/gi],
      'PHP': [/\b(php|laravel|symfony|wordpress)\b/gi],
      'SQL': [/\b(sql|mysql|postgresql|postgres|database)\b/gi],
      'MongoDB': [/\b(mongodb|mongo|nosql)\b/gi],
      'AWS': [/\b(aws|amazon\s*web\s*services|cloud)\b/gi],
      'Docker': [/\b(docker|containerization|containers)\b/gi],
      'Git': [/\b(git|github|gitlab|version\s*control)\b/gi],
      'Machine Learning': [/\b(machine\s*learning|ml|ai|artificial\s*intelligence)\b/gi],
      'Data Science': [/\b(data\s*science|data\s*scientist|analytics|big\s*data)\b/gi],
      'UI/UX': [/\b(ui|ux|user\s*experience|user\s*interface|design)\b/gi],
      'SEO': [/\b(seo|search\s*engine\s*optimization)\b/gi],
      'Digital Marketing': [/\b(digital\s*marketing|online\s*marketing|sem)\b/gi]
    };

    // Location patterns
    this.locationPatterns = [
      /\bin\s+([a-zA-Z\s,]+?)(?:\s+(?:area|city|state|for|with|at|as|,|$))/gi,
      /\bnear\s+([a-zA-Z\s,]+?)(?:\s+(?:area|city|for|with|at|as|,|$))/gi,
      /\bat\s+([a-zA-Z\s,]+?)(?:\s+(?:for|with|as|,|$))/gi
    ];

    // Salary patterns
    this.salaryPatterns = [
      /\$(\d+)k?\s*[-–—]\s*\$?(\d+)k?/gi,
      /\$(\d+)k?\s*\+/gi,
      /(\d+)k?\+?\s*(?:thousand|k)\s*(?:dollars?|usd|\$)?/gi,
      /above\s*\$?(\d+)k?/gi,
      /over\s*\$?(\d+)k?/gi,
      /under\s*\$?(\d+)k?/gi,
      /up\s*to\s*\$?(\d+)k?/gi
    ];

    // Stop words
    this.stopWords = new Set([
      'find', 'me', 'a', 'an', 'the', 'for', 'in', 'at', 'with', 'job', 'jobs', 
      'position', 'positions', 'role', 'roles', 'work', 'need', 'want', 'looking', 
      'search', 'searching', 'seeking', 'opportunity', 'opportunities', 'career'
    ]);
  }

  parseQuery(query) {
    if (!query || typeof query !== 'string') return null;

    const parsed = {
      jobType: null,
      experience: null,
      location: null,
      skills: [],
      salary: null,
      industry: null,
      searchTerms: [],
      originalQuery: query,
      confidence: 0
    };

    let confidence = 0;

    try {
      // Extract job type
      for (const [type, patterns] of Object.entries(this.jobTypePatterns)) {
        if (Array.isArray(patterns) && patterns.some(pattern => pattern.test(query))) {
          parsed.jobType = type;
          confidence += 20;
          break;
        }
      }

      // Extract experience level
      for (const [level, patterns] of Object.entries(this.experiencePatterns)) {
        if (Array.isArray(patterns) && patterns.some(pattern => pattern.test(query))) {
          parsed.experience = level;
          confidence += 15;
          break;
        }
      }

      // Extract industry
      for (const [industry, patterns] of Object.entries(this.industryPatterns)) {
        if (Array.isArray(patterns) && patterns.some(pattern => pattern.test(query))) {
          parsed.industry = industry;
          confidence += 15;
          break;
        }
      }

      // Extract skills
      for (const [skill, patterns] of Object.entries(this.skillsPatterns)) {
        if (Array.isArray(patterns) && patterns.some(pattern => pattern.test(query))) {
          parsed.skills.push(skill);
          confidence += 10;
        }
      }

      // Extract location
      for (const pattern of this.locationPatterns) {
        const matches = [...query.matchAll(pattern)];
        if (matches.length > 0) {
          const location = matches[0][1].trim().replace(/\s+(area|city|state)$/i, '').replace(/[,.]$/, '');
          if (location.length > 2 && location.length < 50) {
            parsed.location = location;
            confidence += 15;
            break;
          }
        }
      }

      // Extract salary
      for (const pattern of this.salaryPatterns) {
        const matches = [...query.matchAll(pattern)];
        if (matches.length > 0) {
          const match = matches[0];
          let min = parseInt(match[1]);
          let max = match[2] ? parseInt(match[2]) : null;

          if (query.toLowerCase().includes('k') || min < 1000) {
            min *= 1000;
            if (max && max < 1000) max *= 1000;
          }

          if (query.toLowerCase().includes('above') || query.toLowerCase().includes('over')) {
            parsed.salary = { min, max: null };
          } else if (query.toLowerCase().includes('under') || query.toLowerCase().includes('below') || query.toLowerCase().includes('up to')) {
            parsed.salary = { min: 0, max: min };
          } else {
            parsed.salary = { min, max };
          }

          confidence += 10;
          break;
        }
      }

      // Extract search terms
      let cleanQuery = query.toLowerCase();
      
      // Remove detected patterns - FIXED VERSION
      const allPatterns = [
        ...Object.values(this.jobTypePatterns).flat(),
        ...Object.values(this.experiencePatterns).flat(),
        ...Object.values(this.industryPatterns).flat(),
        ...Object.values(this.skillsPatterns).flat()
      ];

      allPatterns.forEach(pattern => {
        if (pattern && typeof pattern.test === 'function') {
          cleanQuery = cleanQuery.replace(pattern, ' ');
        }
      });

      if (parsed.location) {
        cleanQuery = cleanQuery.replace(new RegExp(parsed.location.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), ' ');
      }

      this.salaryPatterns.forEach(pattern => {
        cleanQuery = cleanQuery.replace(pattern, ' ');
      });

      // Get meaningful search terms
      const words = cleanQuery
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => 
          word.length > 2 && 
          !this.stopWords.has(word.toLowerCase())
        );
      
      parsed.searchTerms = [...new Set(words)];
      
      if (parsed.searchTerms.length > 0) {
        confidence += parsed.searchTerms.length * 5;
      }

      parsed.confidence = Math.min(confidence, 100);
      
      return parsed;

    } catch (error) {
      console.error('Error parsing NLP query:', error);
      return {
        jobType: null,
        experience: null,
        location: null,
        skills: [],
        salary: null,
        industry: null,
        searchTerms: query.toLowerCase().split(' ').filter(word => word.length > 2),
        originalQuery: query,
        confidence: 0
      };
    }
  }
}

// Initialize the NLP parser
const nlpParser = new NLPQueryParser();

// @desc    Get all jobs with enhanced filtering
// @route   GET /api/jobs
// @access  Public
exports.getJobs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      location,
      jobType,
      experience,
      industry,
      salaryMin,
      salaryMax,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      remote,
      featured,
      skills
    } = req.query;

    console.log('📋 Jobs query:', { search, location, jobType, industry, skills });

    // Build query
    let query = { status: 'active' };
    let sortCriteria = {};

    // Enhanced search functionality
    if (search) {
      // Check if this looks like a natural language query
      const isNaturalLanguage = search.length > 10 && 
        /\b(find|looking|want|need|search|seeking)\b/i.test(search);

      if (isNaturalLanguage) {
        console.log('🧠 Detected natural language query, using NLP search');
        // Use NLP search for better results
        req.query.query = search;
        return exports.searchJobsWithNLP(req, res);
      }

      // Regular search
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { skills: { $in: [new RegExp(search, 'i')] } }
      ];

      // Add text search if available
      try {
        query.$text = { $search: search };
        sortCriteria = { score: { $meta: 'textScore' }, createdAt: -1 };
      } catch (textSearchError) {
        console.log('Text search not available, using regex search');
      }
    }

    // Location filter with remote handling
    if (location) {
      if (location.toLowerCase() === 'remote') {
        query.$or = [
          { isRemote: true },
          { workArrangement: 'Remote' },
          { location: { $regex: 'remote', $options: 'i' } }
        ];
      } else {
        query.location = { $regex: location, $options: 'i' };
      }
    }

    // Other filters
    if (jobType) query.jobType = jobType;
    if (experience) query.experience = experience;
    if (industry) query.industry = industry;
    if (featured === 'true') query.featured = true;
    if (remote === 'true') query.isRemote = true;

    // Skills filter
    if (skills) {
      const skillArray = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim());
      const skillRegexes = skillArray.map(skill => new RegExp(skill, 'i'));
      
      if (query.$or && !query.$text) {
        query.$and = [
          { $or: query.$or },
          { skills: { $in: skillRegexes } }
        ];
        delete query.$or;
      } else {
        query.skills = { $in: skillRegexes };
      }
    }

    // Salary filter
    if (salaryMin || salaryMax) {
      query['salary.min'] = {};
      if (salaryMin) query['salary.min'].$gte = parseInt(salaryMin);
      if (salaryMax) query['salary.min'].$lte = parseInt(salaryMax);
    }

    // Build sort object
    if (!sortCriteria.score) {
      const sort = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
      sortCriteria = sort;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const jobs = await Job.find(query)
      .populate({
        path: 'employer',
        select: 'name companyName companyDescription companyLogo companyWebsite'
      })
      .sort(sortCriteria)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Job.countDocuments(query);

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      success: true,
      count: jobs.length,
      total,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        limit: parseInt(limit),
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      },
      data: jobs
    });

  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching jobs',
      error: error.message
    });
  }
};

// @desc    Enhanced NLP Job Search - FIXED VERSION
// @route   GET /api/jobs/search/nlp
// @access  Public
exports.searchJobsWithNLP = async (req, res) => {
  try {
    const { query: searchQuery, page = 1, limit = 12 } = req.query;

    if (!searchQuery || searchQuery.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required for NLP search'
      });
    }

    console.log(`🔍 NLP Search Query: "${searchQuery}"`);

    // Parse the natural language query
    const parsedQuery = nlpParser.parseQuery(searchQuery);
    
    if (!parsedQuery) {
      console.error('❌ Failed to parse query');
      return res.status(400).json({
        success: false,
        message: 'Could not parse the search query'
      });
    }

    console.log('📊 Parsed Query:', JSON.stringify(parsedQuery, null, 2));

    // Build MongoDB query based on parsed elements
    let mongoQuery = { status: 'active' };
    let sortCriteria = { createdAt: -1 };

    // Add text search if we have search terms or skills
    const searchTerms = [
      ...parsedQuery.searchTerms,
      ...parsedQuery.skills
    ].filter(term => term && term.length > 0);

    if (searchTerms.length > 0) {
      const searchText = searchTerms.join(' ');
      console.log('🔤 Text search terms:', searchText);
      
      try {
        mongoQuery.$text = { $search: searchText };
        sortCriteria = { score: { $meta: 'textScore' }, createdAt: -1 };
      } catch (textSearchError) {
        console.log('Text search not available, using alternative search');
        // Fallback to regex search
        mongoQuery.$or = [
          { title: { $regex: searchText, $options: 'i' } },
          { description: { $regex: searchText, $options: 'i' } },
          { skills: { $in: searchTerms.map(term => new RegExp(term, 'i')) } }
        ];
      }
    }

    // Add specific filters
    if (parsedQuery.jobType) {
      if (parsedQuery.jobType === 'Remote') {
        mongoQuery.$or = [
          { isRemote: true },
          { workArrangement: 'Remote' },
          { location: { $regex: 'remote', $options: 'i' } }
        ];
      } else {
        mongoQuery.jobType = parsedQuery.jobType;
      }
      console.log('💼 Applied job type filter:', parsedQuery.jobType);
    }

    if (parsedQuery.experience) {
      mongoQuery.experience = parsedQuery.experience;
      console.log('📈 Applied experience filter:', parsedQuery.experience);
    }

    if (parsedQuery.industry) {
      mongoQuery.industry = parsedQuery.industry;
      console.log('🏭 Applied industry filter:', parsedQuery.industry);
    }

    if (parsedQuery.location && parsedQuery.jobType !== 'Remote') {
      mongoQuery.location = { $regex: parsedQuery.location, $options: 'i' };
      console.log('📍 Applied location filter:', parsedQuery.location);
    }

    // Handle salary filter
    if (parsedQuery.salary) {
      const salaryFilter = {};
      if (parsedQuery.salary.min > 0) {
        salaryFilter.$gte = parsedQuery.salary.min;
      }
      if (parsedQuery.salary.max) {
        salaryFilter.$lte = parsedQuery.salary.max;
      }
      if (Object.keys(salaryFilter).length > 0) {
        mongoQuery['salary.min'] = salaryFilter;
        console.log('💰 Applied salary filter:', salaryFilter);
      }
    }

    // Handle skills matching
    if (parsedQuery.skills.length > 0) {
      const skillRegexes = parsedQuery.skills.map(skill => new RegExp(skill, 'i'));
      if (!mongoQuery.$or) {
        mongoQuery.skills = { $in: skillRegexes };
      } else {
        mongoQuery.$and = [
          { $or: mongoQuery.$or },
          { skills: { $in: skillRegexes } }
        ];
        delete mongoQuery.$or;
      }
      console.log('🛠️ Applied skills filter:', parsedQuery.skills);
    }

    console.log('🔍 Final MongoDB Query:', JSON.stringify(mongoQuery, null, 2));

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute the search
    const jobs = await Job.find(mongoQuery)
      .populate({
        path: 'employer',
        select: 'name companyName companyDescription companyLogo companyWebsite industry'
      })
      .sort(sortCriteria)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Job.countDocuments(mongoQuery);

    // Add relevance scoring and matching skills info
    const enhancedJobs = jobs.map(job => {
      const jobObj = job.toObject();
      
      // Calculate relevance score
      let relevanceScore = 0;
      
      // Skills matching bonus
      if (parsedQuery.skills.length > 0 && job.skills) {
        const matchingSkills = parsedQuery.skills.filter(skill =>
          job.skills.some(jobSkill => 
            jobSkill.toLowerCase().includes(skill.toLowerCase()) ||
            skill.toLowerCase().includes(jobSkill.toLowerCase())
          )
        );
        relevanceScore += (matchingSkills.length / parsedQuery.skills.length) * 40;
        jobObj.matchingSkills = matchingSkills;
      }

      // Exact match bonuses
      if (parsedQuery.jobType && job.jobType === parsedQuery.jobType) relevanceScore += 20;
      if (parsedQuery.experience && job.experience === parsedQuery.experience) relevanceScore += 15;
      if (parsedQuery.industry && job.industry === parsedQuery.industry) relevanceScore += 15;
      if (parsedQuery.location && job.location.toLowerCase().includes(parsedQuery.location.toLowerCase())) relevanceScore += 10;

      // Text search score
      if (mongoQuery.$text) {
        relevanceScore += 10;
      }

      jobObj.relevanceScore = Math.round(relevanceScore);
      
      return jobObj;
    });

    // Sort by relevance score
    enhancedJobs.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));

    console.log(`✅ NLP Search Results: ${enhancedJobs.length} jobs found (${total} total)`);

    res.status(200).json({
      success: true,
      count: enhancedJobs.length,
      total,
      query: searchQuery,
      parsedQuery: {
        ...parsedQuery,
        confidence: parsedQuery.confidence
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        limit: parseInt(limit),
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      },
      data: enhancedJobs
    });

  } catch (error) {
    console.error('❌ NLP Search Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error performing NLP search',
      error: error.message,
      suggestion: 'Try simplifying your search query or use basic search instead'
    });
  }
};

// @desc    Get single job
// @route   GET /api/jobs/:id
// @access  Public
exports.getJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate({
        path: 'employer',
        select: 'name companyName companyDescription companyLogo companyWebsite industry companySize'
      });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Increment view count
    setImmediate(async () => {
      try {
        await Job.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });
      } catch (error) {
        console.error('Error incrementing view count:', error);
      }
    });

    res.status(200).json({
      success: true,
      data: job
    });

  } catch (error) {
    console.error('Get job error:', error);
    
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error fetching job',
      error: error.message
    });
  }
};

// @desc    Create new job
// @route   POST /api/jobs
// @access  Private (Employer only)
exports.createJob = async (req, res) => {
  try {
    console.log('📝 Creating job:', req.body.title);

    req.body.employer = req.user.id;

    // Process skills if it's a string
    if (typeof req.body.skills === 'string') {
      req.body.skills = req.body.skills.split(',').map(skill => skill.trim()).filter(skill => skill);
    }

    // Process requirements and responsibilities if they're strings
    if (typeof req.body.requirements === 'string') {
      req.body.requirements = req.body.requirements.split('\n').map(req => req.trim()).filter(req => req);
    }
    if (typeof req.body.responsibilities === 'string') {
      req.body.responsibilities = req.body.responsibilities.split('\n').map(resp => resp.trim()).filter(resp => resp);
    }

    // Process benefits if it's a string
    if (typeof req.body.benefits === 'string') {
      req.body.benefits = req.body.benefits.split(',').map(benefit => benefit.trim()).filter(benefit => benefit);
    }

    const job = await Job.create(req.body);

    const populatedJob = await Job.findById(job._id)
      .populate({
        path: 'employer',
        select: 'name companyName companyDescription companyLogo'
      });

    res.status(201).json({
      success: true,
      message: 'Job created successfully',
      data: populatedJob
    });

  } catch (error) {
    console.error('Create job error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating job',
      error: error.message
    });
  }
};

// @desc    Update job
// @route   PUT /api/jobs/:id
// @access  Private (Employer only - own jobs)
exports.updateJob = async (req, res) => {
  try {
    let job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    if (job.employer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this job'
      });
    }

    // Process arrays from strings
    if (typeof req.body.skills === 'string') {
      req.body.skills = req.body.skills.split(',').map(skill => skill.trim()).filter(skill => skill);
    }

    if (typeof req.body.requirements === 'string') {
      req.body.requirements = req.body.requirements.split('\n').map(req => req.trim()).filter(req => req);
    }
    if (typeof req.body.responsibilities === 'string') {
      req.body.responsibilities = req.body.responsibilities.split('\n').map(resp => resp.trim()).filter(resp => resp);
    }

    if (typeof req.body.benefits === 'string') {
      req.body.benefits = req.body.benefits.split(',').map(benefit => benefit.trim()).filter(benefit => benefit);
    }

    job = await Job.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate({
      path: 'employer',
      select: 'name companyName companyDescription companyLogo'
    });

    res.status(200).json({
      success: true,
      message: 'Job updated successfully',
      data: job
    });

  } catch (error) {
    console.error('Update job error:', error);
    
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error updating job',
      error: error.message
    });
  }
};

// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Private (Employer only - own jobs)
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    if (job.employer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this job'
      });
    }

    await Job.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Job deleted successfully'
    });

  } catch (error) {
    console.error('Delete job error:', error);
    
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message : 'Job not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error deleting job',
      error: error.message
    });
  }
};

// @desc    Get jobs by employer
// @route   GET /api/jobs/employer/me
// @access  Private (Employer only)
exports.getMyJobs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status = 'all',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    let query = { employer: req.user.id };
    
    if (status !== 'all') {
      query.status = status;
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const jobs = await Job.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Job.countDocuments(query);

    const statusBreakdown = await Job.aggregate([
      { $match: { employer: new mongoose.Types.ObjectId(req.user.id) }},
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      success: true,
      count: jobs.length,
      total,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      },
      statusBreakdown: statusBreakdown.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      data: jobs
    });

  } catch (error) {
    console.error('Get my jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching your jobs',
      error: error.message
    });
  }
};

// @desc    Get enhanced search suggestions with NLP
// @route   GET /api/jobs/search/suggestions
// @access  Public
exports.getSearchSuggestions = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.status(200).json({
        success: true,
        suggestions: {
          titles: [],
          companies: [],
          skills: [],
          locations: []
        },
        nlpSuggestions: []
      });
    }

    console.log(`💡 Getting suggestions for: "${q}"`);

    // Get database suggestions
    const [titleSuggestions, companySuggestions, skillSuggestions, locationSuggestions] = await Promise.all([
      // Job titles
      Job.aggregate([
        {
          $match: {
            status: 'active',
            title: { $regex: q, $options: 'i' }
          }
        },
        {
          $group: {
            _id: '$title',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),

      // Companies
      Job.aggregate([
        {
          $match: {
            status: 'active',
            company: { $regex: q, $options: 'i' }
          }
        },
        {
          $group: {
            _id: '$company',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 3 }
      ]),

      // Skills
      Job.aggregate([
        { $match: { status: 'active' } },
        { $unwind: '$skills' },
        {
          $match: {
            skills: { $regex: q, $options: 'i' }
          }
        },
        {
          $group: {
            _id: '$skills',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),

      // Locations
      Job.aggregate([
        {
          $match: {
            status: 'active',
            location: { $regex: q, $options: 'i' }
          }
        },
        {
          $group: {
            _id: '$location',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 3 }
      ])
    ]);

    // Generate NLP-style suggestions
    const nlpSuggestions = generateNLPSuggestions(q);

    const suggestions = {
      titles: titleSuggestions.map(s => s._id),
      companies: companySuggestions.map(s => s._id),
      skills: skillSuggestions.map(s => s._id),
      locations: locationSuggestions.map(s => s._id)
    };

    res.status(200).json({
      success: true,
      suggestions,
      nlpSuggestions: nlpSuggestions.slice(0, 8)
    });

  } catch (error) {
    console.error('❌ Suggestions Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting search suggestions',
      suggestions: {
        titles: [],
        companies: [],
        skills: [],
        locations: []
      },
      nlpSuggestions: []
    });
  }
};

// Helper function to generate NLP suggestions
function generateNLPSuggestions(query) {
  const lowerQuery = query.toLowerCase();
  const suggestions = [];

  // Job role suggestions
  const jobRoles = [
    'software engineer', 'data scientist', 'product manager', 'designer', 'developer',
    'marketing manager', 'sales representative', 'accountant', 'analyst', 
    'consultant', 'coordinator', 'specialist', 'administrator'
  ];

  // Location suggestions
  const locations = [
    'New York', 'San Francisco', 'Los Angeles', 'Chicago', 'Boston',
    'Seattle', 'Austin', 'Denver', 'Miami', 'Atlanta', 'remote'
  ];

  // Experience levels
  const experiences = ['entry-level', 'junior', 'senior', 'lead', 'principal'];

  // Job types
  const jobTypes = ['full-time', 'part-time', 'contract', 'remote', 'freelance'];

  // Generate contextual suggestions
  jobRoles.forEach(role => {
    if (role.includes(lowerQuery) || lowerQuery.includes(role.split(' ')[0])) {
      suggestions.push(`Find ${role} jobs`);
      suggestions.push(`${role} positions in New York`);
      suggestions.push(`Remote ${role} opportunities`);
      suggestions.push(`Senior ${role} roles with good salary`);
    }
  });

  locations.forEach(location => {
    if (location.toLowerCase().includes(lowerQuery)) {
      suggestions.push(`Software engineer jobs in ${location}`);
      suggestions.push(`Find jobs in ${location}`);
      suggestions.push(`${location} tech positions`);
    }
  });

  experiences.forEach(exp => {
    if (exp.includes(lowerQuery)) {
      suggestions.push(`${exp} developer positions`);
      suggestions.push(`${exp} jobs in tech`);
      suggestions.push(`Find ${exp} opportunities`);
    }
  });

  jobTypes.forEach(type => {
    if (type.includes(lowerQuery)) {
      suggestions.push(`${type} software engineer jobs`);
      suggestions.push(`${type} positions in startups`);
      suggestions.push(`Find ${type} work`);
    }
  });

  // Add some generic high-quality suggestions if query is very short
  if (lowerQuery.length <= 3) {
    suggestions.push(
      'Find remote software engineer jobs',
      'Entry level marketing positions in New York',
      'Senior React developer roles with good salary',
      'Part-time design jobs',
      'Contract data scientist positions'
    );
  }

  // Remove duplicates and return unique suggestions
  return [...new Set(suggestions)];
}

// @desc    Get trending jobs
// @route   GET /api/jobs/trending
// @access  Public
exports.getTrendingJobs = async (req, res) => {
  try {
    const { limit = 10, timeframe = 7 } = req.query;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(timeframe));
    
    const trendingJobs = await Job.aggregate([
      {
        $match: {
          status: 'active',
          createdAt: { $gte: cutoffDate }
        }
      },
      {
        $addFields: {
          trendingScore: {
            $add: [
              { $multiply: ['$viewCount', 1] },
              { $multiply: ['$applicationCount', 5] },
              { $multiply: ['$saveCount', 3] },
              { $multiply: ['$clickCount', 2] }
            ]
          }
        }
      },
      { $sort: { trendingScore: -1, createdAt: -1 } },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: 'users',
          localField: 'employer',
          foreignField: '_id',
          as: 'employer',
          pipeline: [
            { $project: { name: 1, companyName: 1, companyLogo: 1 } }
          ]
        }
      },
      { $unwind: '$employer' }
    ]);

    res.status(200).json({
      success: true,
      count: trendingJobs.length,
      timeframe: `${timeframe} days`,
      data: trendingJobs
    });

  } catch (error) {
    console.error('Get trending jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching trending jobs',
      error: error.message
    });
  }
};

// @desc    Get job statistics for analytics
// @route   GET /api/jobs/analytics
// @access  Public
exports.getJobAnalytics = async (req, res) => {
  try {
    const { timeframe = 30 } = req.query;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(timeframe));

    const analytics = await Job.aggregate([
      { $match: { status: 'active', createdAt: { $gte: cutoffDate } } },
      {
        $group: {
          _id: null,
          totalJobs: { $sum: 1 },
          avgSalaryMin: { $avg: '$salary.min' },
          avgSalaryMax: { $avg: '$salary.max' },
          totalViews: { $sum: '$viewCount' },
          totalApplications: { $sum: '$applicationCount' },
          jobTypeDistribution: { $push: '$jobType' },
          experienceDistribution: { $push: '$experience' },
          industryDistribution: { $push: '$industry' },
          topSkills: { $push: '$skills' },
          topLocations: { $push: '$location' }
        }
      },
      {
        $addFields: {
          avgApplicationRate: {
            $cond: [
              { $gt: ['$totalViews', 0] },
              { $multiply: [{ $divide: ['$totalApplications', '$totalViews'] }, 100] },
              0
            ]
          }
        }
      }
    ]);

    if (analytics.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          totalJobs: 0,
          message: 'No jobs found in the specified timeframe'
        }
      });
    }

    const result = analytics[0];
    
    // Process distributions
    const processDistribution = (array) => {
      const counts = {};
      array.forEach(item => {
        if (item) counts[item] = (counts[item] || 0) + 1;
      });
      return Object.entries(counts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .reduce((obj, [key, value]) => {
          obj[key] = value;
          return obj;
        }, {});
    };

    // Process skills (flatten array of arrays)
    const allSkills = result.topSkills.flat().filter(skill => skill);
    const skillCounts = {};
    allSkills.forEach(skill => {
      skillCounts[skill] = (skillCounts[skill] || 0) + 1;
    });
    const topSkills = Object.entries(skillCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 15)
      .map(([skill, count]) => ({ skill, count }));

    res.status(200).json({
      success: true,
      timeframe: `${timeframe} days`,
      data: {
        totalJobs: result.totalJobs,
        avgSalary: {
          min: Math.round(result.avgSalaryMin || 0),
          max: Math.round(result.avgSalaryMax || 0)
        },
        engagement: {
          totalViews: result.totalViews,
          totalApplications: result.totalApplications,
          avgApplicationRate: Math.round((result.avgApplicationRate || 0) * 100) / 100
        },
        distributions: {
          jobTypes: processDistribution(result.jobTypeDistribution),
          experienceLevels: processDistribution(result.experienceDistribution),
          industries: processDistribution(result.industryDistribution),
          locations: processDistribution(result.topLocations)
        },
        topSkills
      }
    });

  } catch (error) {
    console.error('Get job analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching job analytics',
      error: error.message
    });
  }
};

// @desc    Get job recommendations for specific user
// @route   GET /api/jobs/recommendations/:userId
// @access  Private (Admin only or own recommendations)
exports.getJobRecommendations = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10, excludeApplied = true } = req.query;

    // Check if user can access recommendations
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role !== 'jobseeker') {
      return res.status(400).json({
        success: false,
        message: 'Recommendations are only available for job seekers'
      });
    }

    // Check if user has sufficient profile data
    if (!user.skills || user.skills.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please complete your profile to get recommendations',
        suggestions: [
          'Add at least 3 relevant skills to your profile',
          'Complete your work experience section',
          'Set your job preferences'
        ]
      });
    }

    // Get personalized recommendations
    const recommendations = await user.getPersonalizedRecommendations(parseInt(limit));

    res.status(200).json({
      success: true,
      count: recommendations.length,
      data: recommendations,
      userProfile: {
        skills: user.skills,
        location: user.location,
        experienceLevel: user.inferredExperienceLevel,
        preferences: user.preferences
      }
    });

  } catch (error) {
    console.error('❌ Job Recommendations Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating recommendations',
      error: error.message
    });
  }
};

// @desc    Get jobs by company
// @route   GET /api/jobs/company/:companyId
// @access  Public
exports.getJobsByCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { page = 1, limit = 10, status = 'active' } = req.query;

    // Build query
    const query = { 
      employer: companyId,
      status: status
    };

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const jobs = await Job.find(query)
      .populate({
        path: 'employer',
        select: 'name companyName companyDescription companyLogo companyWebsite'
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Job.countDocuments(query);

    // Get company info
    const company = await User.findById(companyId).select('name companyName companyDescription companyLogo companyWebsite industry companySize');

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    res.status(200).json({
      success: true,
      count: jobs.length,
      total,
      company: company,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      },
      data: jobs
    });

  } catch (error) {
    console.error('Get jobs by company error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching company jobs',
      error: error.message
    });
  }
};

// @desc    Get jobs with advanced filters
// @route   POST /api/jobs/filter
// @access  Public
exports.getJobsWithAdvancedFilters = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      filters = {}
    } = req.body;

    console.log('🔍 Advanced filters:', filters);

    // Build query
    let query = { status: 'active' };

    // Apply filters
    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
        { company: { $regex: filters.search, $options: 'i' } },
        { skills: { $in: [new RegExp(filters.search, 'i')] } }
      ];
    }

    if (filters.location) {
      if (filters.location.toLowerCase() === 'remote') {
        query.$or = [
          { isRemote: true },
          { workArrangement: 'Remote' },
          { location: { $regex: 'remote', $options: 'i' } }
        ];
      } else {
        query.location = { $regex: filters.location, $options: 'i' };
      }
    }

    if (filters.jobTypes && filters.jobTypes.length > 0) {
      query.jobType = { $in: filters.jobTypes };
    }

    if (filters.experienceLevels && filters.experienceLevels.length > 0) {
      query.experience = { $in: filters.experienceLevels };
    }

    if (filters.industries && filters.industries.length > 0) {
      query.industry = { $in: filters.industries };
    }

    if (filters.skills && filters.skills.length > 0) {
      const skillRegexes = filters.skills.map(skill => new RegExp(skill, 'i'));
      query.skills = { $in: skillRegexes };
    }

    if (filters.salaryRange) {
      const salaryQuery = {};
      if (filters.salaryRange.min) salaryQuery.$gte = filters.salaryRange.min;
      if (filters.salaryRange.max) salaryQuery.$lte = filters.salaryRange.max;
      if (Object.keys(salaryQuery).length > 0) {
        query['salary.min'] = salaryQuery;
      }
    }

    if (filters.postedWithin) {
      const daysAgo = parseInt(filters.postedWithin);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
      query.createdAt = { $gte: cutoffDate };
    }

    if (filters.benefits && filters.benefits.length > 0) {
      query.benefits = { $in: filters.benefits };
    }

    if (filters.workArrangement && filters.workArrangement.length > 0) {
      query.workArrangement = { $in: filters.workArrangement };
    }

    if (filters.companySize && filters.companySize.length > 0) {
      // Need to populate employer and filter by company size
      // This is more complex and would require aggregation
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    console.log('🔍 Final query:', JSON.stringify(query, null, 2));

    // Execute query
    const jobs = await Job.find(query)
      .populate({
        path: 'employer',
        select: 'name companyName companyDescription companyLogo companyWebsite companySize'
      })
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Job.countDocuments(query);

    res.status(200).json({
      success: true,
      count: jobs.length,
      total,
      filters: filters,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit),
        hasNextPage: parseInt(page) < Math.ceil(total / parseInt(limit)),
        hasPrevPage: parseInt(page) > 1
      },
      data: jobs
    });

  } catch (error) {
    console.error('Advanced filter error:', error);
    res.status(500).json({
      success: false,
      message: 'Error applying advanced filters',
      error: error.message
    });
  }
};

// @desc    Bulk operations on jobs (Admin only)
// @route   POST /api/jobs/bulk
// @access  Private (Admin only)
exports.bulkJobOperations = async (req, res) => {
  try {
    const { operation, jobIds, data } = req.body;

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required for bulk operations'
      });
    }

    if (!operation || !jobIds || !Array.isArray(jobIds)) {
      return res.status(400).json({
        success: false,
        message: 'Operation and jobIds array are required'
      });
    }

    let result;

    switch (operation) {
      case 'updateStatus':
        if (!data.status) {
          return res.status(400).json({
            success: false,
            message: 'Status is required for updateStatus operation'
          });
        }
        result = await Job.updateMany(
          { _id: { $in: jobIds } },
          { status: data.status, updatedAt: Date.now() }
        );
        break;

      case 'delete':
        result = await Job.deleteMany({ _id: { $in: jobIds } });
        break;

      case 'feature':
        result = await Job.updateMany(
          { _id: { $in: jobIds } },
          { featured: data.featured !== false, updatedAt: Date.now() }
        );
        break;

      case 'updateIndustry':
        if (!data.industry) {
          return res.status(400).json({
            success: false,
            message: 'Industry is required for updateIndustry operation'
          });
        }
        result = await Job.updateMany(
          { _id: { $in: jobIds } },
          { industry: data.industry, updatedAt: Date.now() }
        );
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid operation. Supported: updateStatus, delete, feature, updateIndustry'
        });
    }

    res.status(200).json({
      success: true,
      message: `Bulk ${operation} completed successfully`,
      data: {
        operation,
        affectedJobs: result.modifiedCount || result.deletedCount,
        totalRequested: jobIds.length
      }
    });

  } catch (error) {
    console.error('Bulk operations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error performing bulk operation',
      error: error.message
    });
  }
};