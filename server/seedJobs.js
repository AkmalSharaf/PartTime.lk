// scripts/finalCleanSeeder.js - Completely fixed job seeder with correct enum values
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Job = require('./models/Job');

// Connect to MongoDB
const connectDB = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ Connected to MongoDB: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    process.exit(1);
  }
};

// Sample employers with correct enum values
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

// Sample job seekers with CORRECT enum values based on your User model
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
      industries: ["Software", "Web Development"],
      experienceLevel: "Mid-level",
      remoteWork: true,
      salaryRange: { min: 80000, max: 120000, currency: "USD" },
      benefits: ["Health Insurance", "Remote Work"],
      workEnvironment: ["Startup"], // Fixed: Capital 'S' in Startup
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
      industries: ["Software", "Data Science"],
      experienceLevel: "Senior",
      remoteWork: true,
      salaryRange: { min: 110000, max: 160000, currency: "USD" },
      benefits: ["Health Insurance", "Remote Work"],
      workEnvironment: ["Corporate"],
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
      industries: ["Design", "Software"],
      experienceLevel: "Mid-level",
      remoteWork: true,
      salaryRange: { min: 70000, max: 100000, currency: "USD" },
      benefits: ["Health Insurance", "Flexible Hours"],
      workEnvironment: ["Agency"],
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
  }
];

// Sample jobs with ONLY valid enum values from your Job model
const seedJobs = [
  {
    title: "Senior React Developer",
    description: "We are looking for an experienced React developer to join our dynamic team. You will be responsible for developing user interface components and implementing them following well-known React.js workflows (such as Flux or Redux). You will ensure that these components and the overall application are robust and easy to maintain.",
    shortDescription: "Senior React developer position with focus on modern web applications and component architecture.",
    company: "TechFlow Solutions",
    location: "San Francisco, CA",
    jobType: "Full-time",
    experience: "Senior",
    skills: ["React", "JavaScript", "TypeScript", "Redux", "CSS", "HTML"],
    industry: "Software",
    salary: { min: 120000, max: 150000, currency: "USD", period: "yearly", negotiable: true },
    requirements: [
      "5+ years of React development experience",
      "Strong proficiency in JavaScript and TypeScript",
      "Experience with state management libraries like Redux",
      "Knowledge of modern authorization mechanisms",
      "Familiarity with RESTful APIs"
    ],
    responsibilities: [
      "Build reusable React components and front-end libraries",
      "Translate designs and wireframes into high-quality code",
      "Optimize components for maximum performance across devices",
      "Collaborate with design team to implement UI/UX best practices"
    ],
    benefits: ["Health Insurance", "Remote Work", "Stock Options", "Professional Development"],
    status: "active",
    featured: true,
    isRemote: false,
    workArrangement: "Hybrid",
    educationLevel: "Bachelor",
    workEnvironment: "corporate",  // lowercase as per your model
    companySize: "51-200"
  },
  {
    title: "Frontend React Developer", 
    description: "Join our innovative startup as a Frontend Developer and help build the next generation of web applications. You'll work with cutting-edge technologies and have the opportunity to make significant impact on product development.",
    shortDescription: "Frontend React developer role at growing startup with modern tech stack.",
    company: "StartupTech Inc",
    location: "Remote",
    jobType: "Full-time",
    experience: "Mid-level",
    skills: ["React", "JavaScript", "CSS3", "HTML5", "Webpack", "Git"],
    industry: "Software",
    salary: { min: 80000, max: 100000, currency: "USD", period: "yearly" },
    requirements: [
      "3+ years of React development experience",
      "Strong JavaScript fundamentals and ES6+ features",
      "Portfolio of React projects and applications",
      "Experience with version control systems (Git)",
      "Understanding of responsive design principles"
    ],
    responsibilities: [
      "Develop user interfaces using React and modern JavaScript",
      "Write clean, maintainable, and well-documented code",
      "Participate in code reviews and maintain coding standards",
      "Collaborate with backend developers on API integration"
    ],
    benefits: ["Health Insurance", "Remote Work", "Flexible Hours", "Learning Budget"],
    status: "active",
    isRemote: true,
    workArrangement: "Remote",
    educationLevel: "Bachelor",
    workEnvironment: "startup",
    companySize: "11-50"
  },
  {
    title: "Senior Python Developer",
    description: "Join our backend team to build scalable microservices using Python, Django, and AWS. You'll be working on high-traffic applications that serve millions of users worldwide.",
    shortDescription: "Senior Python developer for backend systems and microservices architecture.",
    company: "DataFlow Solutions",
    location: "Seattle, WA",
    jobType: "Full-time",
    experience: "Senior",
    skills: ["Python", "Django", "Flask", "AWS", "PostgreSQL", "Redis"],
    industry: "Software",
    salary: { min: 120000, max: 160000, currency: "USD", period: "yearly", negotiable: true },
    requirements: [
      "5+ years of Python development experience",
      "Strong knowledge of Django and/or Flask frameworks",
      "Experience with AWS cloud services and deployment",
      "Database design and optimization skills",
      "Understanding of microservices architecture"
    ],
    responsibilities: [
      "Design and build scalable backend services and APIs",
      "Implement and maintain microservices architecture",
      "Optimize database queries and application performance",
      "Deploy and monitor applications on AWS infrastructure"
    ],
    benefits: ["Health Insurance", "Remote Work", "Stock Options", "Conference Attendance"],
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
    description: "Work with modern JavaScript technologies including Node.js, React, and MongoDB. You'll be involved in all aspects of web development from frontend to backend.",
    shortDescription: "Full stack JavaScript developer for end-to-end web application development.",
    company: "Innovation Labs",
    location: "Austin, TX",
    jobType: "Full-time",
    experience: "Mid-level",
    skills: ["JavaScript", "Node.js", "React", "MongoDB", "Express", "Git"],
    industry: "Software",
    salary: { min: 85000, max: 115000, currency: "USD", period: "yearly" },
    requirements: [
      "3+ years of full-stack JavaScript development experience",
      "Proficiency with Node.js and Express framework",
      "Experience with React and modern frontend development",
      "Database design knowledge (MongoDB, SQL)",
      "Understanding of RESTful API design principles"
    ],
    responsibilities: [
      "Develop full-stack web applications using JavaScript technologies",
      "Design and implement RESTful APIs using Node.js and Express",
      "Build responsive frontend components using React",
      "Design and optimize database schemas and queries"
    ],
    benefits: ["Health Insurance", "Flexible Hours", "Professional Development", "Learning Budget"],
    status: "active",
    isRemote: false,
    workArrangement: "On-site",
    educationLevel: "Bachelor",
    workEnvironment: "startup",
    companySize: "51-200"
  },
  {
    title: "UI/UX Designer",
    description: "Design beautiful and intuitive user interfaces for web and mobile applications. You'll work closely with our development team to create exceptional user experiences.",
    shortDescription: "UI/UX designer for web and mobile applications with focus on user experience.",
    company: "StartupTech Inc",
    location: "Remote",
    jobType: "Full-time",
    experience: "Mid-level",
    skills: ["Figma", "Sketch", "Adobe XD", "Prototyping", "User Research", "Wireframing"],
    industry: "Design",
    salary: { min: 75000, max: 95000, currency: "USD", period: "yearly" },
    requirements: [
      "3+ years of UX/UI design experience",
      "Strong portfolio demonstrating design process and outcomes",
      "Experience with user research and usability testing",
      "Proficiency in design tools (Figma, Sketch, Adobe Creative Suite)",
      "Understanding of responsive and mobile-first design principles"
    ],
    responsibilities: [
      "Design user interfaces and experiences for web and mobile platforms",
      "Conduct user research and analyze user feedback",
      "Create wireframes, prototypes, and design systems",
      "Collaborate with developers to ensure design implementation quality"
    ],
    benefits: ["Health Insurance", "Remote Work", "Professional Development", "Flexible Hours"],
    status: "active",
    isRemote: true,
    workArrangement: "Remote",
    educationLevel: "Bachelor",
    workEnvironment: "startup",
    companySize: "11-50"
  },
  {
    title: "Data Scientist",
    description: "Analyze large datasets to extract meaningful insights and build predictive models that drive business decisions. You'll work with cutting-edge machine learning technologies.",
    shortDescription: "Data scientist for predictive modeling and business analytics.",
    company: "DataFlow Solutions",
    location: "Boston, MA",
    jobType: "Full-time",
    experience: "Mid-level",
    skills: ["Python", "R", "Machine Learning", "SQL", "Pandas", "TensorFlow"],
    industry: "Data Science",
    salary: { min: 100000, max: 130000, currency: "USD", period: "yearly" },
    requirements: [
      "Master's degree in Data Science, Statistics, or related field",
      "3+ years of data science and analytics experience",
      "Strong programming skills in Python and R",
      "Experience with machine learning libraries and frameworks",
      "Solid understanding of statistical analysis and modeling"
    ],
    responsibilities: [
      "Analyze complex datasets to identify trends and patterns",
      "Build and deploy machine learning models for business solutions",
      "Create data visualizations and reports for stakeholders",
      "Collaborate with engineering teams to implement data solutions"
    ],
    benefits: ["Health Insurance", "Learning Budget", "Conference Attendance", "Professional Development"],
    status: "active",
    isRemote: false,
    workArrangement: "On-site",
    educationLevel: "Master",
    workEnvironment: "corporate",
    companySize: "201-500"
  },
  {
    title: "Junior Software Engineer",
    description: "Perfect opportunity for a recent graduate to start their career in software development. You'll receive mentorship and work on real projects that make an impact.",
    shortDescription: "Junior software engineer position for recent graduates with mentorship opportunities.",
    company: "DevCorp Technologies",
    location: "Austin, TX",
    jobType: "Full-time",
    experience: "Entry-level",
    skills: ["Python", "JavaScript", "Git", "SQL", "HTML", "CSS"],
    industry: "Software",
    salary: { min: 65000, max: 80000, currency: "USD", period: "yearly" },
    requirements: [
      "Bachelor's degree in Computer Science or related field",
      "Basic programming knowledge in at least one language",
      "Understanding of software development fundamentals",
      "Strong problem-solving and analytical skills",
      "Eagerness to learn and grow in a team environment"
    ],
    responsibilities: [
      "Write clean, maintainable code under senior developer guidance",
      "Participate in code reviews and learn development best practices",
      "Contribute to software projects and feature development",
      "Learn new technologies and frameworks as needed"
    ],
    benefits: ["Health Insurance", "Professional Development", "Learning Budget", "Flexible Hours"],
    status: "active",
    isRemote: false,
    workArrangement: "On-site",
    educationLevel: "Bachelor",
    workEnvironment: "corporate",
    companySize: "201-500"
  },
  {
    title: "Remote Node.js Developer",
    description: "Build server-side applications using Node.js and Express for our growing platform. This is a fully remote position with flexible working hours.",
    shortDescription: "Remote Node.js developer for backend services and API development.",
    company: "StartupTech Inc",
    location: "Remote",
    jobType: "Contract",
    experience: "Mid-level",
    skills: ["Node.js", "Express", "JavaScript", "MongoDB", "REST APIs", "Git"],
    industry: "Software",
    salary: { min: 70, max: 95, currency: "USD", period: "hourly" },
    requirements: [
      "3+ years of Node.js development experience",
      "Strong experience with Express.js framework",
      "RESTful API development and integration experience",
      "Database design and management skills",
      "Experience working in remote/distributed teams"
    ],
    responsibilities: [
      "Develop and maintain Node.js backend services and APIs",
      "Design and implement database schemas and queries",
      "Write comprehensive technical documentation",
      "Collaborate with frontend developers on API integration"
    ],
    benefits: ["Flexible Hours", "Remote Work"],
    status: "active",
    isRemote: true,
    workArrangement: "Remote",
    educationLevel: "Bachelor",
    workEnvironment: "startup",
    companySize: "11-50"
  },
  {
    title: "DevOps Engineer",
    description: "Manage our cloud infrastructure and deployment pipelines. You'll work with AWS, Docker, and Kubernetes to ensure scalable and reliable systems.",
    shortDescription: "DevOps engineer for cloud infrastructure and deployment automation.",
    company: "Innovation Labs",
    location: "Boston, MA",
    jobType: "Full-time",
    experience: "Senior",
    skills: ["AWS", "Docker", "Kubernetes", "Terraform", "Jenkins", "Linux"],
    industry: "DevOps",
    salary: { min: 110000, max: 140000, currency: "USD", period: "yearly" },
    requirements: [
      "4+ years of DevOps and infrastructure experience",
      "Strong experience with AWS cloud services",
      "Containerization experience with Docker and Kubernetes",
      "Infrastructure as Code tools (Terraform, CloudFormation)",
      "CI/CD pipeline design and implementation"
    ],
    responsibilities: [
      "Design and manage cloud infrastructure on AWS",
      "Implement and maintain CI/CD pipelines",
      "Monitor system performance and reliability",
      "Automate deployment and scaling processes"
    ],
    benefits: ["Health Insurance", "Stock Options", "Professional Development", "Conference Attendance"],
    status: "active",
    isRemote: false,
    workArrangement: "Hybrid",
    educationLevel: "Bachelor",
    workEnvironment: "startup",
    companySize: "51-200"
  },
  {
    title: "Machine Learning Engineer",
    description: "Build and deploy machine learning models at scale. You'll work with large datasets and implement ML solutions that impact millions of users.",
    shortDescription: "Machine learning engineer for scalable ML model development and deployment.",
    company: "DataFlow Solutions",
    location: "Seattle, WA",
    jobType: "Full-time",
    experience: "Senior",
    skills: ["Python", "TensorFlow", "PyTorch", "Scikit-learn", "AWS", "Docker"],
    industry: "AI/ML",
    salary: { min: 130000, max: 170000, currency: "USD", period: "yearly", negotiable: true },
    requirements: [
      "5+ years of machine learning engineering experience",
      "Strong background in ML algorithms and statistical modeling",
      "Experience with ML frameworks (TensorFlow, PyTorch, Scikit-learn)",
      "Cloud platform experience for ML model deployment",
      "Programming proficiency in Python and related ML libraries"
    ],
    responsibilities: [
      "Design and develop machine learning models and algorithms",
      "Deploy ML models to production environments at scale",
      "Optimize model performance and accuracy",
      "Collaborate with data scientists and engineers on ML solutions"
    ],
    benefits: ["Health Insurance", "Stock Options", "Conference Attendance", "Learning Budget"],
    status: "active",
    featured: true,
    isRemote: false,
    workArrangement: "Hybrid",
    educationLevel: "Master",
    workEnvironment: "corporate",
    companySize: "201-500"
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
        jobData.viewCount = Math.floor(Math.random() * 100) + 10;
        jobData.applicationCount = Math.floor(Math.random() * 15) + 1;
        jobData.saveCount = Math.floor(Math.random() * 20) + 1;
        
        // Set random creation date within last 30 days
        jobData.createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
        
        const createdJob = await Job.create(jobData);
        createdJobs.push(createdJob);
        console.log(`   ✅ ${createdJob.title} at ${createdJob.company}`);
      } catch (error) {
        console.log(`   ❌ Failed to create job ${seedJobs[i].title}: ${error.message}`);
      }
    }

    // Test the recommendation system
    console.log('\n🧪 Testing recommendation system...');
    
    if (createdJobSeekers.length > 0 && createdJobs.length > 0) {
      const testUser = createdJobSeekers[0];
      console.log(`\n🔍 Testing with: ${testUser.name}`);
      console.log(`   Skills: ${testUser.skills.join(', ')}`);
      console.log(`   Preferred Industries: ${testUser.preferences.industries.join(', ')}`);
      
      // Find matching jobs based on skills and industry
      const matches = await Job.find({
        $and: [
          { status: 'active' },
          {
            $or: [
              { skills: { $in: testUser.skills.map(skill => new RegExp(skill, 'i')) } },
              { industry: { $in: testUser.preferences.industries } }
            ]
          }
        ]
      }).limit(5).populate('employer', 'companyName');
      
      console.log(`   📋 Found ${matches.length} matching jobs:`);
      matches.forEach((job, index) => {
        const matchingSkills = job.skills.filter(jobSkill => 
          testUser.skills.some(userSkill => 
            jobSkill.toLowerCase().includes(userSkill.toLowerCase()) ||
            userSkill.toLowerCase().includes(jobSkill.toLowerCase())
          )
        );
        console.log(`      ${index + 1}. ${job.title} at ${job.company}`);
        console.log(`         💰 Salary: $${job.salary.min.toLocaleString()} - $${job.salary.max.toLocaleString()}`);
        console.log(`         🏭 Industry: ${job.industry}`);
        if (matchingSkills.length > 0) {
          console.log(`         🎯 Matching skills: ${matchingSkills.join(', ')}`);
        }
      });
    }

    // Create some sample applications for testing
    console.log('\n📋 Creating sample applications...');
    let sampleApplications = [];
    
    // Only try to create applications if Application model exists
    try {
      const Application = require('./models/Application');
      
      if (createdJobSeekers.length > 0 && createdJobs.length > 0) {
        // Create 3 sample applications
        for (let i = 0; i < Math.min(3, createdJobs.length); i++) {
          try {
            const application = await Application.create({
              job: createdJobs[i]._id,
              applicant: createdJobSeekers[0]._id,
              coverLetter: "I am very interested in this position and believe my skills would be a great fit for your team.",
              resume: "/uploads/resumes/sample_resume.pdf",
              status: i === 0 ? 'reviewing' : 'pending',
              appliedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Random date within last week
            });
            sampleApplications.push(application);
            console.log(`   ✅ Application for ${createdJobs[i].title}`);
          } catch (error) {
            console.log(`   ❌ Failed to create application: ${error.message}`);
          }
        }
      }
    } catch (error) {
      console.log(`   ℹ️  Application model not found, skipping sample applications`);
    }

    // Final summary
    console.log('\n🎉 Database seeding completed!');
    console.log('==================================================');
    console.log(`✅ Created ${createdEmployers.length} employers`);
    console.log(`✅ Created ${createdJobSeekers.length} job seekers`);
    console.log(`✅ Created ${createdJobs.length} jobs`);
    console.log(`✅ Created ${sampleApplications.length} sample applications`);
    
    // Display job statistics
    console.log('\n📊 Job Statistics by Industry:');
    const jobStats = await Job.aggregate([
      {
        $group: {
          _id: '$industry',
          count: { $sum: 1 },
          avgMinSalary: { $avg: '$salary.min' },
          avgMaxSalary: { $avg: '$salary.max' }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    jobStats.forEach(stat => {
      console.log(`   📈 ${stat._id}: ${stat.count} jobs (Avg: ${Math.round(stat.avgMinSalary).toLocaleString()} - ${Math.round(stat.avgMaxSalary).toLocaleString()})`);
    });

    // Display experience level distribution
    console.log('\n👔 Jobs by Experience Level:');
    const expStats = await Job.aggregate([
      {
        $group: {
          _id: '$experience',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    expStats.forEach(stat => {
      console.log(`   🎯 ${stat._id}: ${stat.count} jobs`);
    });

    // Display location distribution
    console.log('\n🌍 Jobs by Location:');
    const locationStats = await Job.aggregate([
      {
        $group: {
          _id: '$location',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    locationStats.forEach(stat => {
      const emoji = stat._id === 'Remote' ? '🏠' : '📍';
      console.log(`   ${emoji} ${stat._id}: ${stat.count} jobs`);
    });
    
    console.log('\n🔑 Test Login Credentials (Password: password123):');
    console.log('\n👔 EMPLOYERS:');
    createdEmployers.forEach(emp => {
      console.log(`   📧 ${emp.email} - ${emp.companyName}`);
    });
    
    console.log('\n👤 JOB SEEKERS:');
    createdJobSeekers.forEach(seeker => {
      console.log(`   📧 ${seeker.email} - ${seeker.name}`);
      console.log(`      Skills: ${seeker.skills.slice(0, 3).join(', ')}`);
    });
    
    console.log('\n🚀 Next Steps:');
    console.log('1. Start your server: npm run dev');
    console.log('2. Visit: http://localhost:5000');
    console.log('3. Test the API endpoints:');
    console.log('   • GET /api/jobs - View all jobs');
    console.log('   • POST /api/auth/login - Login with test accounts');
    console.log('   • GET /api/jobs/ai/recommendations - AI job recommendations');
    console.log('4. Build your React frontend to connect to these APIs');
    console.log('\n🎯 Sample API Tests:');
    console.log('curl -X POST http://localhost:5000/api/auth/login \\');
    console.log('  -H "Content-Type: application/json" \\');
    console.log('  -d \'{"email":"john@example.com","password":"password123"}\'');

    return {
      employers: createdEmployers.length,
      jobSeekers: createdJobSeekers.length,
      jobs: createdJobs.length,
      applications: sampleApplications.length
    };

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
};

// Main execution function
const runSeed = async () => {
  try {
    await connectDB();
    const results = await seedDatabase();
    console.log('\n🏁 Seeding completed successfully!');
    console.log(`📊 Final Results:`);
    console.log(`   👔 ${results.employers} employers created`);
    console.log(`   👤 ${results.jobSeekers} job seekers created`);
    console.log(`   💼 ${results.jobs} jobs created`);
    console.log(`   📋 ${results.applications} applications created`);
    
    // Close connection
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    console.log('✨ Your job portal is ready for action!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    if (error.errors) {
      console.error('Validation errors:');
      Object.keys(error.errors).forEach(key => {
        console.error(`  - ${key}: ${error.errors[key].message}`);
      });
    }
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