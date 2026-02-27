// quickSeed.js - Fixed seeder for your setup
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Job = require('./models/Job');

// Use the EXACT same connection string as your main app
const connectDB = async () => {
  try {
    // Use your exact MongoDB URI from environment
    const mongoUri = process.env.MONGO_URI;
    console.log('🔗 Connecting to MongoDB...');
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
};

// Quick test data - just 3 jobs for testing
const quickTestData = async () => {
  try {
    console.log('🧪 Quick Test Data Setup');
    console.log('========================');

    // Check current data
    const existingUsers = await User.countDocuments();
    const existingJobs = await Job.countDocuments();
    
    console.log(`Current Users: ${existingUsers}`);
    console.log(`Current Jobs: ${existingJobs}`);

    // If we already have users, just add jobs
    let employer;
    if (existingUsers > 0) {
      employer = await User.findOne({ role: 'employer' });
      if (!employer) {
        console.log('👤 Creating test employer...');
        const salt = await bcrypt.genSalt(10);
        employer = await User.create({
          name: "Test Employer",
          email: "test@employer.com",
          password: await bcrypt.hash('password123', salt),
          role: "employer",
          companyName: "Test Tech Company",
          companyDescription: "Test company for recommendations",
          location: "San Francisco, CA",
          industry: "Technology",
          isVerified: true
        });
      }
    } else {
      console.log('👤 Creating test users...');
      const salt = await bcrypt.genSalt(10);
      
      // Create employer
      employer = await User.create({
        name: "Test Employer",
        email: "test@employer.com",
        password: await bcrypt.hash('password123', salt),
        role: "employer",
        companyName: "Test Tech Company",
        companyDescription: "Test company for recommendations",
        location: "San Francisco, CA",
        industry: "Technology",
        isVerified: true
      });

      // Create job seeker with skills and preferences
      await User.create({
        name: "Test Job Seeker",
        email: "test@jobseeker.com",
        password: await bcrypt.hash('password123', salt),
        role: "jobseeker",
        location: "San Francisco, CA",
        bio: "React developer looking for opportunities",
        skills: ["React", "JavaScript", "Node.js", "Python", "CSS"],
        preferences: {
          jobTypes: ["Full-time", "Remote"],
          preferredLocations: ["San Francisco, CA", "Remote"],
          industries: ["Software", "Technology"],
          experienceLevel: "Mid-level",
          remoteWork: true,
          salaryRange: { min: 80000, max: 120000, currency: "USD" },
          benefits: ["Health Insurance", "Remote Work"],
          workEnvironment: ["Startup"],
          companySize: ["11-50", "51-200"],
          lastUpdated: new Date()
        },
        isVerified: true
      });
      
      console.log('✅ Created test users');
    }

    // Clear existing jobs and create new ones
    await Job.deleteMany({});
    console.log('🗑️ Cleared existing jobs');

    // Create test jobs with skills that match our test user
    const testJobs = [
      {
        title: "React Frontend Developer",
        description: "Build amazing React applications. Work with modern JavaScript, TypeScript, and cutting-edge frontend technologies.",
        company: "Test Tech Company",
        location: "San Francisco, CA",
        jobType: "Full-time",
        experience: "Mid-level",
        skills: ["React", "JavaScript", "TypeScript", "CSS", "HTML"],
        industry: "Software",
        salary: { min: 90000, max: 120000, currency: "USD" },
        employer: employer._id,
        status: "active",
        requirements: ["3+ years React experience", "Strong JavaScript skills"],
        responsibilities: ["Build user interfaces", "Write clean code"],
        benefits: ["Health Insurance", "Remote Work"]
      },
      {
        title: "Full Stack JavaScript Developer",
        description: "Work with React frontend and Node.js backend. Build complete web applications from start to finish.",
        company: "Test Tech Company",
        location: "Remote",
        jobType: "Full-time",
        experience: "Mid-level",
        skills: ["React", "Node.js", "JavaScript", "MongoDB", "Express"],
        industry: "Software",
        salary: { min: 95000, max: 125000, currency: "USD" },
        employer: employer._id,
        status: "active",
        isRemote: true,
        workArrangement: "Remote",
        requirements: ["Full-stack experience", "Node.js knowledge"],
        responsibilities: ["Full-stack development", "API design"],
        benefits: ["Health Insurance", "Remote Work", "Flexible Hours"]
      },
      {
        title: "Python Backend Developer",
        description: "Build scalable backend services with Python and Django. Work on high-performance web applications.",
        company: "Test Tech Company",
        location: "San Francisco, CA",
        jobType: "Full-time",
        experience: "Senior",
        skills: ["Python", "Django", "PostgreSQL", "AWS", "Docker"],
        industry: "Software",
        salary: { min: 110000, max: 140000, currency: "USD" },
        employer: employer._id,
        status: "active",
        requirements: ["5+ years Python experience", "Django expertise"],
        responsibilities: ["Backend development", "Database design"],
        benefits: ["Health Insurance", "Stock Options"]
      }
    ];

    const createdJobs = await Job.insertMany(testJobs);
    console.log(`✅ Created ${createdJobs.length} test jobs`);

    // Test the recommendation logic
    console.log('\n🧪 Testing Recommendations...');
    const testUser = await User.findOne({ email: 'test@jobseeker.com' });
    
    if (testUser) {
      console.log(`User: ${testUser.name}`);
      console.log(`Skills: ${testUser.skills.join(', ')}`);
      
      // Simple skill-based matching
      const matchingJobs = await Job.find({
        status: 'active',
        skills: { $in: testUser.skills.map(skill => new RegExp(skill, 'i')) }
      });
      
      console.log(`\nFound ${matchingJobs.length} matching jobs:`);
      matchingJobs.forEach((job, index) => {
        const matches = job.skills.filter(jobSkill => 
          testUser.skills.some(userSkill => 
            jobSkill.toLowerCase().includes(userSkill.toLowerCase())
          )
        );
        console.log(`${index + 1}. ${job.title} - Matches: ${matches.join(', ')}`);
      });
    }

    console.log('\n🎉 Quick test setup completed!');
    console.log('\n🔑 Test Account:');
    console.log('   Job Seeker: test@jobseeker.com / password123');
    console.log('   Employer: test@employer.com / password123');
    
    console.log('\n📋 Next Steps:');
    console.log('1. Login as test@jobseeker.com');
    console.log('2. Go to Job Preferences page');
    console.log('3. Skills should be: React, JavaScript, Node.js, Python, CSS');
    console.log('4. Save preferences and see recommendations!');

    return {
      users: await User.countDocuments(),
      jobs: await Job.countDocuments()
    };

  } catch (error) {
    console.error('❌ Error in quick setup:', error);
    throw error;
  }
};

// Run the quick setup
const run = async () => {
  try {
    await connectDB();
    await quickTestData();
    console.log('\n🏁 Setup completed successfully!');
    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Setup failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Execute if run directly
if (require.main === module) {
  run();
}

module.exports = { quickTestData, run };