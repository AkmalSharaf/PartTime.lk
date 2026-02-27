const dotenv = require('dotenv');

// Load env vars
dotenv.config();

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRE: process.env.JWT_EXPIRE || '30d',
  FILE_UPLOAD_PATH: process.env.FILE_UPLOAD_PATH || './public/uploads',
  MAX_FILE_UPLOAD: process.env.MAX_FILE_UPLOAD || 1000000 // 1MB in bytes
};