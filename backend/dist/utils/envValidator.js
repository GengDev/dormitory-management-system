"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEnv = validateEnv;
exports.getEnv = getEnv;
exports.isProduction = isProduction;
exports.isDevelopment = isDevelopment;
exports.isTest = isTest;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
/**
 * Required environment variables
 */
const REQUIRED_ENV_VARS = [
    'DATABASE_URL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'PORT',
    'NODE_ENV',
];
/**
 * Optional but recommended environment variables
 */
const RECOMMENDED_ENV_VARS = [
    'LINE_CHANNEL_ID',
    'LINE_CHANNEL_SECRET',
    'LINE_ACCESS_TOKEN',
    'REDIS_URL',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
];
/**
 * Validate required environment variables
 */
function validateEnv() {
    const missing = [];
    const warnings = [];
    // Check required variables
    for (const envVar of REQUIRED_ENV_VARS) {
        if (!process.env[envVar]) {
            missing.push(envVar);
        }
    }
    // Check recommended variables
    for (const envVar of RECOMMENDED_ENV_VARS) {
        if (!process.env[envVar]) {
            warnings.push(envVar);
        }
    }
    // Fail if required variables are missing
    if (missing.length > 0) {
        console.error('❌ Missing required environment variables:');
        missing.forEach(v => console.error(`   - ${v}`));
        console.error('\nPlease check your .env file and ensure all required variables are set.');
        process.exit(1);
    }
    // Warn about missing recommended variables
    if (warnings.length > 0 && process.env.NODE_ENV !== 'test') {
        console.warn('⚠️  Missing recommended environment variables:');
        warnings.forEach(v => console.warn(`   - ${v}`));
        console.warn('\nSome features may not work correctly without these variables.\n');
    }
    // Validate JWT_SECRET strength
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
        console.warn('⚠️  JWT_SECRET should be at least 32 characters long for security');
    }
    // Validate NODE_ENV
    const validEnvs = ['development', 'production', 'test'];
    if (!validEnvs.includes(process.env.NODE_ENV)) {
        console.error(`❌ NODE_ENV must be one of: ${validEnvs.join(', ')}`);
        process.exit(1);
    }
    // Return typed environment config
    return {
        DATABASE_URL: process.env.DATABASE_URL,
        JWT_SECRET: process.env.JWT_SECRET,
        JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
        JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
        JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
        PORT: process.env.PORT,
        NODE_ENV: process.env.NODE_ENV,
        LINE_CHANNEL_ID: process.env.LINE_CHANNEL_ID,
        LINE_CHANNEL_SECRET: process.env.LINE_CHANNEL_SECRET,
        LINE_ACCESS_TOKEN: process.env.LINE_ACCESS_TOKEN,
        REDIS_URL: process.env.REDIS_URL,
        REDIS_HOST: process.env.REDIS_HOST,
        REDIS_PORT: process.env.REDIS_PORT,
        REDIS_PASSWORD: process.env.REDIS_PASSWORD,
        SUPABASE_URL: process.env.SUPABASE_URL,
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
        CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
        RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS || '900000',
        RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS || '100',
    };
}
/**
 * Get environment configuration
 */
function getEnv() {
    return validateEnv();
}
/**
 * Check if running in production
 */
function isProduction() {
    return process.env.NODE_ENV === 'production';
}
/**
 * Check if running in development
 */
function isDevelopment() {
    return process.env.NODE_ENV === 'development';
}
/**
 * Check if running in test
 */
function isTest() {
    return process.env.NODE_ENV === 'test';
}
// Validate on import (except in test environment)
if (!isTest()) {
    validateEnv();
    console.log('✅ Environment variables validated successfully');
}
//# sourceMappingURL=envValidator.js.map