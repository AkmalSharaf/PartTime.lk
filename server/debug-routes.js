// debug-controllers.js - Test each controller individually
console.log('🔍 Testing individual controller files...\n');

// List of controller files that your routes import
const controllerFiles = [
  { path: './controllers/authController', name: 'authController' },
  { path: './controllers/userController', name: 'userController' },
  { path: './controllers/jobController', name: 'jobController' },
  { path: './controllers/applicationController', name: 'applicationController' },
  { path: './controllers/uploadController', name: 'uploadController' },
  { path: './controllers/resourceController', name: 'resourceController' },
  { path: './controllers/statsController', name: 'statsController' },
  { path: './controllers/savedJobController', name: 'savedJobController' },
  { path: './controllers/companyController', name: 'companyController' }
];

// Test each controller file individually
for (const controller of controllerFiles) {
  try {
    console.log(`Testing ${controller.name} (${controller.path})...`);
    
    // Try to require the controller file
    const controllerModule = require(controller.path);
    
    console.log(`✅ ${controller.name} loaded successfully`);
    
    // Check what functions are exported
    if (typeof controllerModule === 'object') {
      const exportedFunctions = Object.keys(controllerModule);
      console.log(`   📦 Exports: ${exportedFunctions.join(', ')}`);
    }
    
  } catch (error) {
    console.error(`❌ ERROR in ${controller.name}:`);
    console.error(`   File: ${controller.path}`);
    console.error(`   Error: ${error.message}`);
    
    if (error.message.includes('Missing parameter name')) {
      console.error(`   🔍 This controller has route-related syntax errors!`);
      console.error(`   The error might be in route definitions within this controller.`);
    }
    
    if (error.code === 'MODULE_NOT_FOUND') {
      console.error(`   🔍 Controller file doesn't exist or has missing dependencies`);
      console.error(`   Create this file or check its imports: ${error.message}`);
    }
    
    console.error(`\n❌ Full error stack:`);
    console.error(error.stack);
    console.log(`\n🎯 FOUND THE PROBLEM! Fix ${controller.path} and try again.\n`);
    process.exit(1);
  }
}

console.log('\n🎉 All controller files loaded successfully!');

// Now test middleware files
console.log('\n🔍 Testing middleware files...');

const middlewareFiles = [
  { path: './middleware/auth', name: 'auth middleware' }
];

for (const middleware of middlewareFiles) {
  try {
    console.log(`Testing ${middleware.name} (${middleware.path})...`);
    
    const middlewareModule = require(middleware.path);
    
    console.log(`✅ ${middleware.name} loaded successfully`);
    
    if (typeof middlewareModule === 'object') {
      const exportedFunctions = Object.keys(middlewareModule);
      console.log(`   📦 Exports: ${exportedFunctions.join(', ')}`);
    }
    
  } catch (error) {
    console.error(`❌ ERROR in ${middleware.name}:`);
    console.error(`   File: ${middleware.path}`);
    console.error(`   Error: ${error.message}`);
    
    if (error.code === 'MODULE_NOT_FOUND') {
      console.error(`   🔍 Middleware file doesn't exist`);
    }
    
    console.error(`\n❌ Full error stack:`);
    console.error(error.stack);
    console.log(`\n🎯 FOUND THE PROBLEM! Fix ${middleware.path} and try again.\n`);
    process.exit(1);
  }
}

console.log('\n🎉 All middleware files loaded successfully!');

// Now test model files (they might be imported by controllers)
console.log('\n🔍 Testing model files...');

const modelFiles = [
  { path: './models/User', name: 'User model' },
  { path: './models/Job', name: 'Job model' },
  { path: './models/Application', name: 'Application model' }
];

for (const model of modelFiles) {
  try {
    console.log(`Testing ${model.name} (${model.path})...`);
    
    const modelModule = require(model.path);
    
    console.log(`✅ ${model.name} loaded successfully`);
    
  } catch (error) {
    console.error(`❌ ERROR in ${model.name}:`);
    console.error(`   File: ${model.path}`);
    console.error(`   Error: ${error.message}`);
    
    if (error.code === 'MODULE_NOT_FOUND') {
      console.error(`   🔍 Model file doesn't exist`);
    }
    
    console.error(`\n❌ Full error stack:`);
    console.error(error.stack);
    console.log(`\n🎯 FOUND THE PROBLEM! Fix ${model.path} and try again.\n`);
    process.exit(1);
  }
}

console.log('\n🎉 All files loaded successfully!');
console.log('\nIf you see this message, the issue might be:');
console.log('1. A circular dependency between files');
console.log('2. An issue with Express.js configuration');
console.log('3. A problem with path-to-regexp version compatibility');
console.log('\nTry updating your dependencies:');
console.log('npm update express path-to-regexp');