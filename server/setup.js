// setup.js - Complete Backend Setup Script
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up AI-Enhanced Job Portal Backend...\n');

// Create all necessary directories
const directories = [
  'middleware',
  'services',
  'controllers',
  'models',
  'routes',
  'public/uploads/cvs',
  'public/uploads/photos',
  'public/uploads/logos',
  'public/uploads/profiles',
  'public/uploads/resumes',
  'public/uploads/applications/resumes',
  'public/uploads/applications/coverletters',
  'tmp',
  'ai',
  'logs'
];

console.log('📁 Creating directories...');
directories.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`✅ Created: ${dir}`);
  } else {
    console.log(`📂 Exists: ${dir}`);
  }
});

// Create .env template if it doesn't exist
const envTemplate = `# AI-Enhanced Job Portal Environment Variables

# Database
MONGO_URI=mongodb://localhost:27017/jobportal

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=30d

# Server
PORT=5000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# AI Features
AI_ENABLED=true
ML_RECOMMENDATIONS_ENABLED=true

# Email (Optional)
SMTP_HOST=
SMTP_PORT=587
SMTP_EMAIL=
SMTP_PASSWORD=

# File Upload
MAX_FILE_UPLOAD=50000000

# API Documentation
API_DOCS_URL=http://localhost:5000/api
`;

if (!fs.existsSync('.env')) {
  fs.writeFileSync('.env', envTemplate);
  console.log('✅ Created .env template file');
} else {
  console.log('📂 .env file already exists');
}

// Create package.json scripts section reminder
const packageJsonScripts = {
  "dev": "nodemon server.js",
  "start": "node server.js",
  "setup": "node setup.js",
  "test": "jest",
  "seed": "node utils/seeder.js"
};

console.log('\n📋 Make sure your package.json includes these scripts:');
console.log(JSON.stringify(packageJsonScripts, null, 2));

// Create a basic .gitignore
const gitignoreContent = `# Dependencies
node_modules/
npm-debug.log*

# Environment
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
logs
*.log

# Temporary files
tmp/
temp/

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# AI Model files (optional)
ai/*.pkl
ai/*.joblib
ai/__pycache__/

# Uploads (in production, use cloud storage)
public/uploads/*/
!public/uploads/.gitkeep
`;

if (!fs.existsSync('.gitignore')) {
  fs.writeFileSync('.gitignore', gitignoreContent);
  console.log('✅ Created .gitignore file');
}

// Create placeholder files for empty directories
const placeholderDirs = [
  'public/uploads/cvs',
  'public/uploads/photos',
  'public/uploads/logos',
  'public/uploads/profiles',
  'public/uploads/resumes',
  'public/uploads/applications/resumes',
  'public/uploads/applications/coverletters',
  'tmp',
  'logs'
];

placeholderDirs.forEach(dir => {
  const gitkeepPath = path.join(__dirname, dir, '.gitkeep');
  if (!fs.existsSync(gitkeepPath)) {
    fs.writeFileSync(gitkeepPath, '# Placeholder file to keep directory in git\n');
  }
});

// Create basic requirements.txt for Python AI model
const requirementsContent = `# Python Dependencies for AI Recommendation System
# Install with: pip install -r requirements.txt

# Core ML Libraries
numpy>=1.21.0
pandas>=1.3.0
scikit-learn>=1.0.0
scipy>=1.7.0

# Text Processing
nltk>=3.6

# Data Serialization
joblib>=1.1.0

# Utility Libraries
python-dotenv>=0.19.0
`;

const aiDir = path.join(__dirname, 'ai');
const requirementsPath = path.join(aiDir, 'requirements.txt');
if (!fs.existsSync(requirementsPath)) {
  fs.writeFileSync(requirementsPath, requirementsContent);
  console.log('✅ Created ai/requirements.txt');
}

console.log('\n🎉 Backend setup complete!');
console.log('\n📋 Next steps:');
console.log('1. Install dependencies: npm install');
console.log('2. Set up your MongoDB database');
console.log('3. Configure your .env file with your database URL');
console.log('4. (Optional) Set up Python AI model: cd ai && pip install -r requirements.txt');
console.log('5. Start the server: npm run dev');
console.log('\n🔗 The server will be available at: http://localhost:5000');
console.log('📚 API Documentation: http://localhost:5000/api');
console.log('🏥 Health Check: http://localhost:5000/health');

// Check if key dependencies are in package.json
const packageJsonPath = path.join(__dirname, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const requiredDeps = [
      'express', 'mongoose', 'bcryptjs', 'jsonwebtoken', 'cors', 
      'dotenv', 'express-fileupload', 'helmet', 'express-mongo-sanitize'
    ];
    
    const missingDeps = requiredDeps.filter(dep => 
      !packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]
    );
    
    if (missingDeps.length > 0) {
      console.log('\n⚠️  Missing dependencies. Install with:');
      console.log(`npm install ${missingDeps.join(' ')}`);
    }
  } catch (error) {
    console.log('\n⚠️  Could not read package.json to check dependencies');
  }
}

console.log('\n✨ Happy coding! 🚀');