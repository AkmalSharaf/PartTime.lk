// utils/nlpService.js - Client-side NLP helper functions
export class NLPService {
  constructor() {
    this.baseURL = 'http://localhost:5000/api/jobs';
  }

  // Search jobs using natural language
  async searchJobs(query, page = 1, limit = 10) {
    try {
      const response = await fetch(
        `${this.baseURL}/search/nlp?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
      );
      
      if (!response.ok) {
        throw new Error('Search request failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error('NLP Search Error:', error);
      throw error;
    }
  }

  // Get search suggestions
  async getSuggestions(query) {
    try {
      const response = await fetch(
        `${this.baseURL}/search/suggestions?query=${encodeURIComponent(query)}`
      );
      
      if (!response.ok) {
        throw new Error('Suggestions request failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Suggestions Error:', error);
      throw error;
    }
  }

  // Client-side query parsing for immediate feedback
  parseQuery(query) {
    if (!query) return null;

    const lowerQuery = query.toLowerCase();
    const parsed = {
      jobType: null,
      experience: null,
      location: null,
      skills: [],
      salary: null,
      searchTerms: []
    };

    // Job type patterns
    const jobTypePatterns = {
      'full-time': /\b(full-?time|fulltime|permanent|full time)\b/i,
      'part-time': /\b(part-?time|parttime|part time|casual)\b/i,
      'contract': /\b(contract|contractor|freelance|temporary|temp)\b/i,
      'internship': /\b(intern|internship|trainee|apprentice)\b/i,
      'remote': /\b(remote|work from home|wfh|virtual|distributed)\b/i
    };

    // Experience patterns
    const experiencePatterns = {
      'entry-level': /\b(entry|junior|beginner|fresh|new grad|graduate|starter)\b/i,
      'mid-level': /\b(mid|intermediate|experienced|2-5 years|3-7 years)\b/i,
      'senior': /\b(senior|lead|principal|expert|architect|5\+ years|7\+ years)\b/i,
      'executive': /\b(executive|manager|director|vp|ceo|cto|head of)\b/i
    };

    // Common skills
    const skillPatterns = [
      'javascript', 'python', 'java', 'react', 'node', 'angular', 'vue',
      'php', 'ruby', 'golang', 'rust', 'html', 'css', 'sql', 'mongodb',
      'postgresql', 'aws', 'azure', 'docker', 'kubernetes', 'git',
      'ui', 'ux', 'figma', 'sketch', 'photoshop', 'illustrator',
      'marketing', 'seo', 'sem', 'analytics', 'sales', 'accounting'
    ];

    // Extract job type
    for (const [type, pattern] of Object.entries(jobTypePatterns)) {
      if (pattern.test(query)) {
        parsed.jobType = type;
        break;
      }
    }

    // Extract experience
    for (const [level, pattern] of Object.entries(experiencePatterns)) {
      if (pattern.test(query)) {
        parsed.experience = level;
        break;
      }
    }

    // Extract skills
    skillPatterns.forEach(skill => {
      if (lowerQuery.includes(skill.toLowerCase())) {
        parsed.skills.push(skill);
      }
    });

    // Extract location
    const locationPatterns = [
      /\bin\s+([a-zA-Z\s]+?)(?:\s+(?:for|with|at|,|$))/i,
      /\bnear\s+([a-zA-Z\s]+?)(?:\s+(?:for|with|at|,|$))/i,
      /\bat\s+([a-zA-Z\s]+?)(?:\s+(?:for|with|at|,|$))/i
    ];

    for (const pattern of locationPatterns) {
      const match = query.match(pattern);
      if (match) {
        parsed.location = match[1].trim();
        break;
      }
    }

    // Extract salary
    const salaryPattern = /\$?(\d+)k?\s*-?\s*\$?(\d+)?k?/i;
    const salaryMatch = query.match(salaryPattern);
    if (salaryMatch) {
      let min = parseInt(salaryMatch[1]);
      let max = salaryMatch[2] ? parseInt(salaryMatch[2]) : null;
      
      if (query.toLowerCase().includes('k') || min < 1000) {
        min *= 1000;
        if (max && max < 1000) max *= 1000;
      }
      
      parsed.salary = { min, max };
    }

    // Extract remaining search terms
    let cleanQuery = query.toLowerCase();
    
    // Remove extracted elements
    Object.values(jobTypePatterns).forEach(pattern => {
      cleanQuery = cleanQuery.replace(pattern, '');
    });
    
    Object.values(experiencePatterns).forEach(pattern => {
      cleanQuery = cleanQuery.replace(pattern, '');
    });
    
    if (parsed.location) {
      cleanQuery = cleanQuery.replace(new RegExp(parsed.location, 'gi'), '');
    }
    
    parsed.skills.forEach(skill => {
      cleanQuery = cleanQuery.replace(new RegExp(skill, 'gi'), '');
    });

    // Remove common words and get meaningful terms
    const stopWords = ['find', 'me', 'a', 'an', 'the', 'for', 'in', 'at', 'with', 'job', 'jobs', 'position', 'role', 'work', 'need', 'want', 'looking', 'search'];
    const words = cleanQuery.split(/\s+/).filter(word => 
      word.length > 2 && 
      !stopWords.includes(word) &&
      !['in', 'at', 'near', 'around', 'location'].includes(word)
    );
    
    parsed.searchTerms = words.filter(word => word.length > 0);

    return parsed;
  }

  // Generate search suggestions based on user input
  generateLocalSuggestions(query) {
    if (!query || query.length < 2) return [];

    const suggestions = [];
    const lowerQuery = query.toLowerCase();

    // Job role suggestions
    const jobRoles = [
      'software engineer', 'data scientist', 'product manager', 'designer',
      'marketing manager', 'sales representative', 'accountant', 'teacher',
      'nurse', 'developer', 'analyst', 'consultant', 'coordinator'
    ];

    // Location suggestions
    const locations = [
      'New York', 'San Francisco', 'Los Angeles', 'Chicago', 'Boston',
      'Seattle', 'Austin', 'Denver', 'Miami', 'Atlanta', 'remote'
    ];

    // Job type suggestions
    const jobTypes = ['full-time', 'part-time', 'contract', 'internship', 'remote'];

    // Experience level suggestions
    const experienceLevels = ['entry-level', 'mid-level', 'senior', 'executive'];

    // Generate role-based suggestions
    jobRoles.forEach(role => {
      if (role.includes(lowerQuery)) {
        suggestions.push(`Find ${role} jobs`);
        suggestions.push(`${role} positions in New York`);
        suggestions.push(`Senior ${role} roles`);
      }
    });

    // Generate location-based suggestions
    locations.forEach(location => {
      if (location.toLowerCase().includes(lowerQuery)) {
        suggestions.push(`Jobs in ${location}`);
        suggestions.push(`Software engineer jobs in ${location}`);
        suggestions.push(`Remote jobs based in ${location}`);
      }
    });

    // Generate type-based suggestions
    jobTypes.forEach(type => {
      if (type.includes(lowerQuery)) {
        suggestions.push(`${type} jobs`);
        suggestions.push(`${type} software engineer positions`);
        suggestions.push(`${type} roles in tech`);
      }
    });

    // Generate experience-based suggestions
    experienceLevels.forEach(level => {
      if (level.includes(lowerQuery)) {
        suggestions.push(`${level} positions`);
        suggestions.push(`${level} developer jobs`);
        suggestions.push(`${level} roles in startups`);
      }
    });

    // Remove duplicates and limit results
    return [...new Set(suggestions)].slice(0, 8);
  }

  // Format parsed query for display
  formatParsedQuery(parsedQuery) {
    if (!parsedQuery) return '';

    const parts = [];
    
    if (parsedQuery.jobType) {
      parts.push(`Type: ${parsedQuery.jobType}`);
    }
    
    if (parsedQuery.experience) {
      parts.push(`Level: ${parsedQuery.experience}`);
    }
    
    if (parsedQuery.location) {
      parts.push(`Location: ${parsedQuery.location}`);
    }
    
    if (parsedQuery.skills.length > 0) {
      parts.push(`Skills: ${parsedQuery.skills.join(', ')}`);
    }
    
    if (parsedQuery.salary) {
      const { min, max } = parsedQuery.salary;
      parts.push(`Salary: $${min.toLocaleString()}${max ? ` - $${max.toLocaleString()}` : '+'}`);
    }
    
    if (parsedQuery.searchTerms.length > 0) {
      parts.push(`Keywords: ${parsedQuery.searchTerms.join(', ')}`);
    }

    return parts.join(' | ');
  }
}

// Create singleton instance
export const nlpService = new NLPService();

// React hook for using NLP service
export const useNLPSearch = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const searchJobs = async (query, page = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await nlpService.searchJobs(query, page);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  const getSuggestions = async (query) => {
    try {
      return await nlpService.getSuggestions(query);
    } catch (err) {
      console.error('Error getting suggestions:', err);
      return { suggestions: [], nlpSuggestions: [] };
    }
  };

  return {
    searchJobs,
    getSuggestions,
    parseQuery: nlpService.parseQuery,
    generateLocalSuggestions: nlpService.generateLocalSuggestions,
    formatParsedQuery: nlpService.formatParsedQuery,
    loading,
    error
  };
};