import dotenv from 'dotenv';

dotenv.config();

/**
 * Required environment variables
 */
const REQUIRED_ENV_VARS = [
    'DATABASE_URL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'PORT',
    'NODE_ENV',
] as const;

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
] as const;

/**
 * Environment variable configuration
 */
interface EnvConfig {
    // Database
    DATABASE_URL: string;

    // JWT
    JWT_SECRET: string;
    JWT_REFRESH_SECRET: string;
    JWT_EXPIRES_IN?: string;
    JWT_REFRESH_EXPIRES_IN?: string;

    // Server
    PORT: string;
    NODE_ENV: 'development' | 'production' | 'test';

    // LINE
    LINE_CHANNEL_ID?: string;
    LINE_CHANNEL_SECRET?: string;
    LINE_ACCESS_TOKEN?: string;

    // Redis
    REDIS_URL?: string;
    REDIS_HOST?: string;
    REDIS_PORT?: string;
    REDIS_PASSWORD?: string;

    // Supabase
    SUPABASE_URL?: string;
    SUPABASE_ANON_KEY?: string;
    SUPABASE_SERVICE_ROLE_KEY?: string;

    // CORS
    CORS_ORIGIN?: string;

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS?: string;
    RATE_LIMIT_MAX_REQUESTS?: string;
}

/**
 * Validate required environment variables
 */
export function validateEnv(): EnvConfig {
    const missing: string[] = [];
    const warnings: string[] = [];

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
    if (!validEnvs.includes(process.env.NODE_ENV as string)) {
        console.error(`❌ NODE_ENV must be one of: ${validEnvs.join(', ')}`);
        process.exit(1);
    }

    // Return typed environment config
    return {
        DATABASE_URL: process.env.DATABASE_URL!,
        JWT_SECRET: process.env.JWT_SECRET!,
        JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
        JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
        JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
        PORT: process.env.PORT!,
        NODE_ENV: process.env.NODE_ENV as 'development' | 'production' | 'test',
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
export function getEnv(): EnvConfig {
    return validateEnv();
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development';
}

/**
 * Check if running in test
 */
export function isTest(): boolean {
    return process.env.NODE_ENV === 'test';
}

// Validate on import (except in test environment)
if (!isTest()) {
    validateEnv();
    console.log('✅ Environment variables validated successfully');
}
