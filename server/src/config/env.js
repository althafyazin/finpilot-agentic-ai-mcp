const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/financeflow',
  jwtSecret: process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  googleGeminiApiKey: process.env.GOOGLE_GEMINI_API_KEY || '',
};

// Fail-fast validation check for essential production configurations
if (!process.env.JWT_SECRET && config.nodeEnv === 'production') {
  throw new Error('CRITICAL SECURITY ERROR: JWT_SECRET environment variable is not defined!');
}

module.exports = config;
