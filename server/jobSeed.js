// jobSeed.js - Fixed seeder for job portal
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Job = require('./models/Job');

// Connect to MongoDB with better error handling
const connectDB = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/jobportal';
    console.log(`Connecting to: ${mongoURI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`);
    
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // 10 seconds
      socketTimeoutMS: 45000,
      family: 4 // Force IPv4
    });

    console.log(`✅ Connected to MongoDB: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    
    // Provide helpful debugging info
    if (error.message.includes('IP')) {
      console.log('\n🔧 MongoDB Atlas IP Whitelist Issue:');
      console.log('1. Go to MongoDB Atlas dashboard');
      console.log('2. Navigate to Network Access');
      console.log('3. Add your current IP address');
      console.log('4. Or add 0.0.0.0/0 for testing (not recommended for production)');
    }
    
    if (error.message.includes('authentication')) {
      console.log('\n🔧 Authentication Issue:');
      console.log('1. Check your MONGO_URI in .env file');
      console.log('2. Verify username and password are correct');
      console.log('3. Make sure the database user has read/write permissions');
    }
    
    process.exit(1);
  }
};

// Sample employers - cleaned up data
const sampleEmployers = [
  {
    name: "Sarah Johnson",
    email: "sarah@techflow.com",
    password: "password123",
    role: "employer",
    companyName: "TechFlow Solutions",
    companyDescription: "Leading software development company specializing in full-stack solutions and modern web technologies.",
    location: "San Francisco, CA",
    companyWebsite: "https://techflow.com",
    industry: "Technology",
    companySize: "51-200",
    isVerified: true,
    phone: "+1-415-555-0101"
  },
  {
    name: "Mike Chen",
    email: "mike@startuptech.com", 
    password: "password123",
    role: "employer",
    companyName: "StartupTech Inc",
    companyDescription: "Innovative startup building cutting-edge web applications with modern technologies.",
    location: "Remote",
    companyWebsite: "https://startuptech.com",
    industry: "Technology",
    companySize: "11-50",
    isVerified: true,
    phone: "+1-650-555-0102"
  },
  {
    name: "Jennifer Davis",
    email: "jen@devcorp.com",
    password: "password123", 
    role: "employer",
    companyName: "DevCorp Technologies",
    companyDescription: "Enterprise software solutions provider with 15+ years of industry experience.",
    location: "Austin, TX",
    companyWebsite: "https://devcorp.com",
    industry: "Technology",
    companySize: "201-500",
    isVerified: true,
    phone: "+1-512-555-0103"
  },
  {
    name: "Robert Martinez",
    email: "robert@innovationlabs.com",
    password: "password123",
    role: "employer", 
    companyName: "Innovation Labs",
    companyDescription: "Research and development company focusing on emerging technologies including AI and blockchain.",
    location: "Boston, MA",
    companyWebsite: "https://innovationlabs.com",
    industry: "Technology",
    companySize: "51-200",
    isVerified: true,
    phone: "+1-617-555-0104"
  },
  {
    name: "Lisa Wong",
    email: "lisa@dataflow.com",
    password: "password123",
    role: "employer",
    companyName: "DataFlow Solutions", 
    companyDescription: "Big data and analytics company helping businesses make data-driven decisions.",
    location: "Seattle, WA",
    companyWebsite: "https://dataflow.com",
    industry: "Technology",
    companySize: "201-500",
    isVerified: true,
    phone: "+1-206-555-0105"
  }
];

// Sample job seekers - FIXED with proper enum values
const sampleJobSeekers = [
  {
    name: "John Smith",
    email: "john@example.com",
    password: "password123",
    role: "jobseeker",
    location: "San Francisco, CA",
    phone: "+1-415-555-1001",
    bio: "Passionate React developer with 4 years of experience building modern web applications.",
    skills: ["React", "JavaScript", "TypeScript", "Node.js", "CSS", "HTML"],
    preferences: {
      jobTypes: ["Full-time"],
      preferredLocations: ["San Francisco, CA", "Remote"],
      industries: ["Software", "Web Development"], // FIXED: valid enum values
      experienceLevel: "Mid-level",
      remoteWork: true,
      salaryRange: { min: 80000, max: 120000, currency: "USD" },
      benefits: ["Health Insurance", "Remote Work"],
      workEnvironment: ["Startup"],
      companySize: ["11-50", "51-200"],
      lastUpdated: new Date()
    },
    experience: [
      {
        company: "Previous Tech Co",
        position: "Frontend Developer",
        startDate: new Date('2020-01-01'),
        endDate: new Date('2023-12-31'),
        current: false,
        description: "Developed React applications for e-commerce platform",
        technologies: ["React", "JavaScript", "CSS"]
      }
    ],
    education: [
      {
        institution: "UC Berkeley",
        degree: "Bachelor of Science",
        fieldOfStudy: "Computer Science",
        startDate: new Date('2016-09-01'),
        endDate: new Date('2020-05-15'),
        current: false,
        gpa: 3.7
      }
    ],
    portfolio: {
      linkedin: "https://linkedin.com/in/johnsmith",
      github: "https://github.com/johnsmith",
      website: "https://johnsmith.dev"
    },
    isVerified: true
  },
  {
    name: "Sarah Johnson",
    email: "sarah@example.com", 
    password: "password123",
    role: "jobseeker",
    location: "Seattle, WA",
    phone: "+1-206-555-1002",
    bio: "Backend Python developer with expertise in Django, Flask, and AWS.",
    skills: ["Python", "Django", "Flask", "AWS", "PostgreSQL", "Docker"],
    preferences: {
      jobTypes: ["Full-time"],
      preferredLocations: ["Remote", "Seattle, WA"],
      industries: ["Software", "Data Science"], // FIXED: valid enum values
      experienceLevel: "Senior",
      remoteWork: true,
      salaryRange: { min: 110000, max: 160000, currency: "USD" },
      benefits: ["Health Insurance", "Remote Work"],
      workEnvironment: ["Startup"],
      companySize: ["51-200"],
      lastUpdated: new Date()
    },
    experience: [
      {
        company: "Backend Systems Inc",
        position: "Senior Python Developer", 
        startDate: new Date('2019-01-01'),
        endDate: new Date('2024-01-01'),
        current: false,
        description: "Built scalable backend services using Python and Django",
        technologies: ["Python", "Django", "AWS"]
      }
    ],
    education: [
      {
        institution: "Stanford University",
        degree: "Master of Science",
        fieldOfStudy: "Computer Science",
        startDate: new Date('2017-09-01'),
        endDate: new Date('2019-05-15'),
        current: false,
        gpa: 3.9
      }
    ],
    portfolio: {
      linkedin: "https://linkedin.com/in/sarahjohnson",
      github: "https://github.com/sarahjohnson"
    },
    isVerified: true
  },
  {
    name: "Michael Chen",
    email: "mike@example.com",
    password: "password123",
    role: "jobseeker", 
    location: "Los Angeles, CA",
    phone: "+1-310-555-1003",
    bio: "Creative UI/UX designer with a passion for user-centered design.",
    skills: ["Figma", "Sketch", "Adobe XD", "Prototyping", "User Research"],
    preferences: {
      jobTypes: ["Full-time", "Contract"],
      preferredLocations: ["Los Angeles, CA", "Remote"],
      industries: ["Design", "Software"], // FIXED: valid enum values
      experienceLevel: "Mid-level",
      remoteWork: true,
      salaryRange: { min: 70000, max: 100000, currency: "USD" },
      benefits: ["Health Insurance", "Flexible Hours"],
      workEnvironment: ["Startup"],
      companySize: ["11-50"],
      lastUpdated: new Date()
    },
    experience: [
      {
        company: "Design Agency Pro",
        position: "UI/UX Designer",
        startDate: new Date('2021-01-01'),
        endDate: new Date('2024-01-01'),
        current: false,
        description: "Designed user interfaces for web and mobile applications",
        technologies: ["Figma", "Sketch", "Prototyping"]
      }
    ],
    education: [
      {
        institution: "Art Center College of Design",
        degree: "Bachelor of Fine Arts",
        fieldOfStudy: "Graphic Design", 
        startDate: new Date('2017-09-01'),
        endDate: new Date('2021-05-15'),
        current: false,
        gpa: 3.8
      }
    ],
    portfolio: {
      behance: "https://behance.net/michaelchen",
      portfolio: "https://michaelchen.design"
    },
    isVerified: true
  },
  {
    name: "Alex Rodriguez",
    email: "alex@example.com",
    password: "password123",
    role: "jobseeker",
    location: "Austin, TX",
    phone: "+1-512-555-1004",
    bio: "Full-stack developer with experience in both frontend and backend technologies.",
    skills: ["JavaScript", "Node.js", "React", "MongoDB", "Express"],
    preferences: {
      jobTypes: ["Full-time"],
      preferredLocations: ["Austin, TX", "Remote"],
      industries: ["Software", "Web Development"], // FIXED: valid enum values  
      experienceLevel: "Mid-level",
      remoteWork: true,
      salaryRange: { min: 85000, max: 125000, currency: "USD" },
      benefits: ["Health Insurance", "Remote Work"],
      workEnvironment: ["Startup"],
      companySize: ["11-50", "51-200"],
      lastUpdated: new Date()
    },
    experience: [
      {
        company: "Web Solutions LLC",
        position: "Full Stack Developer",
        startDate: new Date('2021-06-01'),
        endDate: new Date('2024-01-01'),
        current: false,
        description: "Developed full-stack web applications using JavaScript and Node.js",
        technologies: ["JavaScript", "Node.js", "React"]
      }
    ],
    education: [
      {
        institution: "University of Texas at Austin",
        degree: "Bachelor of Science", 
        fieldOfStudy: "Computer Science",
        startDate: new Date('2017-09-01'),
        endDate: new Date('2021-05-15'),
        current: false,
        gpa: 3.6
      }
    ],
    portfolio: {
      linkedin: "https://linkedin.com/in/alexrodriguez",
      github: "https://github.com/alexrodriguez"
    },
    isVerified: true
  },
  {
    name: "Emma Williams",
    email: "emma@example.com",
    password: "password123",
    role: "jobseeker",
    location: "Boston, MA", 
    phone: "+1-617-555-1005",
    bio: "Data scientist with expertise in machine learning and statistical analysis.",
    skills: ["Python", "R", "Machine Learning", "SQL", "Pandas", "TensorFlow"],
    preferences: {
      jobTypes: ["Full-time"],
      preferredLocations: ["Boston, MA", "Remote"],
      industries: ["Data Science", "AI/ML"], // FIXED: valid enum values
      experienceLevel: "Mid-level",
      remoteWork: true,
      salaryRange: { min: 95000, max: 140000, currency: "USD" },
      benefits: ["Health Insurance", "Learning Budget"],
      workEnvironment: ["Corporate"],
      companySize: ["201-500"],
      lastUpdated: new Date()
    },
    experience: [
      {
        company: "Analytics Corp",
        position: "Data Scientist",
        startDate: new Date('2022-01-01'),
        endDate: new Date('2024-01-01'),
        current: false,
        description: "Built predictive models and performed statistical analysis",
        technologies: ["Python", "R", "Machine Learning"]
      }
    ],
    education: [
      {
        institution: "MIT",
        degree: "Master of Science",
        fieldOfStudy: "Data Science",
        startDate: new Date('2020-09-01'),
        endDate: new Date('2022-05-15'),
        current: false,
        gpa: 3.9
      }
    ],
    portfolio: {
      linkedin: "https://linkedin.com/in/emmawilliams",
      github: "https://github.com/emmawilliams"
    },
    isVerified: true
  }
];

// Sample jobs - FIXED with proper enum values
const seedJobs = [
  {
    title: "Senior React Developer",
    description: "We are looking for an experienced React developer to join our dynamic team. You will be responsible for developing user interface components and implementing them following well-known React.js workflows.",
    shortDescription: "Senior React developer position with focus on modern web applications.",
    company: "TechFlow Solutions",
    location: "San Francisco, CA",
    jobType: "Full-time",
    experience: "Senior",
    skills: ["React", "JavaScript", "TypeScript", "CSS", "HTML"],
    industry: "Software", // FIXED: valid enum value
    salary: { min: 120000, max: 150000, currency: "USD", period: "yearly" },
    requirements: [
      "5+ years React experience",
      "Strong JavaScript and TypeScript skills",
      "Experience with state management"
    ],
    responsibilities: [
      "Build reusable React components",
      "Optimize applications for performance",
      "Collaborate with design team"
    ],
    benefits: ["Health Insurance", "Remote Work", "Stock Options"],
    status: "active",
    featured: true,
    isRemote: false,
    workArrangement: "Hybrid",
    educationLevel: "Bachelor",
    workEnvironment: "corporate",
    companySize: "51-200"
  },
  {
    title: "Frontend React Developer", 
    description: "Join our innovative startup as a Frontend Developer and help build the next generation of web applications.",
    shortDescription: "Frontend React developer role at growing startup.",
    company: "StartupTech Inc",
    location: "Remote",
    jobType: "Full-time",
    experience: "Mid-level",
    skills: ["React", "JavaScript", "CSS3", "HTML5"],
    industry: "Software", // FIXED: valid enum value
    salary: { min: 80000, max: 100000, currency: "USD", period: "yearly" },
    requirements: [
      "3+ years React experience",
      "Strong JavaScript fundamentals",
      "Portfolio of React projects"
    ],
    responsibilities: [
      "Develop user interfaces using React",
      "Write clean, maintainable code",
      "Participate in code reviews"
    ],
    benefits: ["Health Insurance", "Remote Work", "Flexible Hours"],
    status: "active",
    isRemote: true,
    workArrangement: "Remote",
    educationLevel: "Bachelor",
    workEnvironment: "startup",
    companySize: "11-50"
  },
  {
    title: "Senior Python Developer",
    description: "Join our backend team to build scalable microservices using Python, Django, and AWS.",
    shortDescription: "Senior Python developer for backend systems.",
    company: "DataFlow Solutions",
    location: "Seattle, WA",
    jobType: "Full-time",
    experience: "Senior",
    skills: ["Python", "Django", "AWS", "PostgreSQL"],
    industry: "Software", // FIXED: valid enum value
    salary: { min: 120000, max: 160000, currency: "USD", period: "yearly" },
    requirements: [
      "5+ years Python experience",
      "Strong Django/Flask knowledge",
      "AWS cloud experience"
    ],
    responsibilities: [
      "Design and build backend services",
      "Implement RESTful APIs",
      "Optimize database performance"
    ],
    benefits: ["Health Insurance", "Remote Work", "Stock Options"],
    status: "active",
    featured: true,
    isRemote: false,
    workArrangement: "Hybrid",
    educationLevel: "Bachelor",
    workEnvironment: "corporate",
    companySize: "201-500"
  },
  {
    title: "Full Stack JavaScript Developer",
    description: "Work with modern JavaScript technologies including Node.js, React, and MongoDB.",
    shortDescription: "Full stack JavaScript developer for web applications.",
    company: "Innovation Labs",
    location: "Austin, TX",
    jobType: "Full-time",
    experience: "Mid-level",
    skills: ["JavaScript", "Node.js", "React", "MongoDB"],
    industry: "Software", // FIXED: valid enum value
    salary: { min: 85000, max: 115000, currency: "USD", period: "yearly" },
    requirements: [
      "3+ years full-stack JavaScript experience",
      "Experience with Node.js and Express",
      "Database design knowledge"
    ],
    responsibilities: [
      "Full-stack web application development", 
      "API design and implementation",
      "Frontend component development"
    ],
    benefits: ["Health Insurance", "Flexible Hours", "Professional Development"],
    status: "active",
    isRemote: false,
    workArrangement: "On-site",
    educationLevel: "Bachelor",
    workEnvironment: "startup",
    companySize: "51-200"
  },
  {
    title: "UI/UX Designer",
    description: "Design beautiful and intuitive user interfaces for web and mobile applications.",
    shortDescription: "UI/UX designer for web and mobile applications.",
    company: "StartupTech Inc",
    location: "Remote",
    jobType: "Full-time",
    experience: "Mid-level",
    skills: ["Figma", "Sketch", "Adobe XD", "Prototyping"],
    industry: "Design", // FIXED: valid enum value
    salary: { min: 75000, max: 95000, currency: "USD", period: "yearly" },
    requirements: [
      "3+ years UX/UI design experience",
      "Strong portfolio",
      "User research experience"
    ],
    responsibilities: [
      "Design user interfaces", 
      "Conduct user research",
      "Create design systems"
    ],
    benefits: ["Health Insurance", "Remote Work", "Professional Development"],
    status: "active",
    isRemote: true,
    workArrangement: "Remote",
    educationLevel: "Bachelor",
    workEnvironment: "startup",
    companySize: "11-50"
  },
  {
    title: "Data Scientist",
    description: "Analyze large datasets to extract meaningful insights and build predictive models.",
    shortDescription: "Data scientist for predictive modeling and analytics.",
    company: "DataFlow Solutions",
    location: "Boston, MA",
    jobType: "Full-time",
    experience: "Mid-level",
    skills: ["Python", "R", "Machine Learning", "SQL"],
    industry: "Data Science", // FIXED: valid enum value
    salary: { min: 100000, max: 130000, currency: "USD", period: "yearly" },
    requirements: [
      "Master's degree in Data Science",
      "3+ years data science experience",
      "Strong statistical background"
    ],
    responsibilities: [
      "Analyze complex datasets",
      "Build predictive models",
      "Create data visualizations"
    ],
    benefits: ["Health Insurance", "Learning Budget", "Conference Attendance"],
    status: "active",
    isRemote: false,
    workArrangement: "On-site",
    educationLevel: "Master",
    workEnvironment: "corporate",
    companySize: "201-500"
  },
  {
    title: "Junior Software Engineer",
    description: "Perfect opportunity for a recent graduate to start their career in software development.",
    shortDescription: "Junior software engineer for recent graduates.",
    company: "DevCorp Technologies",
    location: "Austin, TX",
    jobType: "Full-time",
    experience: "Entry-level",
    skills: ["Python", "JavaScript", "Git", "SQL"],
    industry: "Software", // FIXED: valid enum value
    salary: { min: 65000, max: 80000, currency: "USD", period: "yearly" },
    requirements: [
      "Computer Science degree",
      "Basic programming knowledge",
      "Eagerness to learn"
    ],
    responsibilities: [
      "Write clean code",
      "Learn from senior developers",
      "Participate in code reviews"
    ],
    benefits: ["Health Insurance", "Professional Development", "Learning Budget"],
    status: "active",
    isRemote: false,
    workArrangement: "On-site",
    educationLevel: "Bachelor",
    workEnvironment: "corporate",
    companySize: "201-500"
  },
  {
    title: "Remote Node.js Developer",
    description: "Build server-side applications using Node.js and Express for our growing platform.",
    shortDescription: "Remote Node.js developer for backend services.",
    company: "StartupTech Inc",
    location: "Remote",
    jobType: "Contract",
    experience: "Mid-level",
    skills: ["Node.js", "Express", "JavaScript", "MongoDB"],
    industry: "Software", // FIXED: valid enum value
    salary: { min: 70, max: 95, currency: "USD", period: "hourly" },
    requirements: [
      "3+ years Node.js experience",
      "RESTful API development",
      "Remote work experience"
    ],
    responsibilities: [
      "Build and maintain APIs",
      "Design database schemas",
      "Write technical documentation"
    ],
    benefits: ["Flexible Hours", "Remote Work"],
    status: "active",
    isRemote: true,
    workArrangement: "Remote",
    educationLevel: "Bachelor",
    workEnvironment: "startup",
    companySize: "11-50"
  }
];

// Main seeding function
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    console.log('==================================================');

    // Clear existing data
    console.log('🗑️ Clearing existing data...');
    await User.deleteMany({});
    await Job.deleteMany({});
    console.log('✅ Existing data cleared');

    // Create employer users
    console.log('\n👥 Creating employer accounts...');
    const createdEmployers = [];
    
    for (const employer of sampleEmployers) {
      try {
        const salt = await bcrypt.genSalt(10);
        employer.password = await bcrypt.hash(employer.password, salt);
        const createdEmployer = await User.create(employer);
        createdEmployers.push(createdEmployer);
        console.log(`   ✅ ${createdEmployer.companyName} (${createdEmployer.email})`);
      } catch (error) {
        console.log(`   ❌ Failed to create ${employer.companyName}: ${error.message}`);
      }
    }

    // Create job seeker users  
    console.log('\n👤 Creating job seeker accounts...');
    const createdJobSeekers = [];
    
    for (const jobSeeker of sampleJobSeekers) {
      try {
        const salt = await bcrypt.genSalt(10);
        jobSeeker.password = await bcrypt.hash(jobSeeker.password, salt);
        const createdJobSeeker = await User.create(jobSeeker);
        createdJobSeekers.push(createdJobSeeker);
        console.log(`   ✅ ${createdJobSeeker.name} (${createdJobSeeker.email})`);
      } catch (error) {
        console.log(`   ❌ Failed to create ${jobSeeker.name}: ${error.message}`);
      }
    }

    // Create jobs
    console.log('\n💼 Creating job listings...');
    const createdJobs = [];
    
    for (let i = 0; i < seedJobs.length; i++) {
      try {
        const jobData = { ...seedJobs[i] };
        
        // Find employer by company name
        const employer = createdEmployers.find(emp => emp.companyName === jobData.company);
        if (employer) {
          jobData.employer = employer._id;
        } else {
          // Fallback to first employer
          jobData.employer = createdEmployers[0]._id;
        }
        
        // Add engagement metrics
        jobData.viewCount = Math.floor(Math.random() * 50) + 10;
        jobData.applicationCount = Math.floor(Math.random() * 10) + 1;
        jobData.saveCount = Math.floor(Math.random() * 8) + 1;
        
        const createdJob = await Job.create(jobData);
        createdJobs.push(createdJob);
        console.log(`   ✅ ${createdJob.title} at ${createdJob.company}`);
      } catch (error) {
        console.log(`   ❌ Failed to create job ${seedJobs[i].title}: ${error.message}`);
      }
    }

    // Test recommendations
    console.log('\n🧪 Testing recommendation system...');
    
    if (createdJobSeekers.length > 0 && createdJobs.length > 0) {
      const testUser = createdJobSeekers[0];
      console.log(`\n🔍 Testing with: ${testUser.name}`);
      console.log(`   Skills: ${testUser.skills.join(', ')}`);
      
      // Find matching jobs
      const matches = await Job.find({
        status: 'active',
        skills: { $in: testUser.skills.map(skill => new RegExp(skill, 'i')) }
      }).limit(3);
      
      console.log(`   📋 Found ${matches.length} matching jobs:`);
      matches.forEach((job, index) => {
        const matchingSkills = job.skills.filter(jobSkill => 
          testUser.skills.some(userSkill => 
            jobSkill.toLowerCase().includes(userSkill.toLowerCase())
          )
        );
        console.log(`      ${index + 1}. ${job.title} at ${job.company}`);
        console.log(`         Matching skills: ${matchingSkills.join(', ')}`);
      });
    }

    // Final summary
    console.log('\n🎉 Database seeding completed!');
    console.log('==================================================');
    console.log(`✅ Created ${createdEmployers.length} employers`);
    console.log(`✅ Created ${createdJobSeekers.length} job seekers`);
    console.log(`✅ Created ${createdJobs.length} jobs`);
    
    console.log('\n🔑 Test Accounts (all use password: password123):');
    console.log('\nEMPLOYERS:');
    createdEmployers.forEach(emp => {
      console.log(`   📧 ${emp.email} - ${emp.companyName}`);
    });
    
    console.log('\nJOB SEEKERS:');
    createdJobSeekers.forEach(seeker => {
      console.log(`   📧 ${seeker.email} - ${seeker.name} (${seeker.skills.slice(0, 2).join(', ')})`);
    });
    
    console.log('\n🚀 Next Steps:');
    console.log('1. Start your server: npm start');
    console.log('2. Visit: http://localhost:5000');
    console.log('3. Login with any account above');
    console.log('4. Test job posting and application features');

    return {
      employers: createdEmployers.length,
      jobSeekers: createdJobSeekers.length,
      jobs: createdJobs.length
    };

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
};

// Main execution
const runSeed = async () => {
  try {
    await connectDB();
    const results = await seedDatabase();
    console.log('\n🏁 Seeding completed successfully!');
    console.log(`📊 Results: ${results.employers} employers, ${results.jobSeekers} job seekers, ${results.jobs} jobs`);
    
    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Export for use in other files
module.exports = { seedDatabase, runSeed };

// Run if called directly
if (require.main === module) {
  runSeed();
}