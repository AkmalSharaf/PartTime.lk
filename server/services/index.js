// services/index.js - Services initialization
const fs = require('fs');
const path = require('path');

// Create services directory if it doesn't exist
const servicesDir = path.join(__dirname);
if (!fs.existsSync(servicesDir)) {
  fs.mkdirSync(servicesDir, { recursive: true });
  console.log('✅ Services directory created');
}

// Export all services
module.exports = {
  recommendationService: require('./recommendationService')
};