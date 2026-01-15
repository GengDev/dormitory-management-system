/**
 * Environment variable configuration
 */
interface EnvConfig {
    DATABASE_URL: string;
    JWT_SECRET: string;
    JWT_REFRESH_SECRET: string;
    JWT_EXPIRES_IN?: string;
    JWT_REFRESH_EXPIRES_IN?: string;
    PORT: string;
    NODE_ENV: 'development' | 'production' | 'test';
    LINE_CHANNEL_ID?: string;
    LINE_CHANNEL_SECRET?: string;
    LINE_ACCESS_TOKEN?: string;
    REDIS_URL?: string;
    REDIS_HOST?: string;
    REDIS_PORT?: string;
    REDIS_PASSWORD?: string;
    SUPABASE_URL?: string;
    SUPABASE_ANON_KEY?: string;
    SUPABASE_SERVICE_ROLE_KEY?: string;
    CORS_ORIGIN?: string;
    RATE_LIMIT_WINDOW_MS?: string;
    RATE_LIMIT_MAX_REQUESTS?: string;
}
/**
 * Validate required environment variables
 */
export declare function validateEnv(): EnvConfig;
/**
 * Get environment configuration
 */
export declare function getEnv(): EnvConfig;
/**
 * Check if running in production
 */
export declare function isProduction(): boolean;
/**
 * Check if running in development
 */
export declare function isDevelopment(): boolean;
/**
 * Check if running in test
 */
export declare function isTest(): boolean;
export {};
//# sourceMappingURL=envValidator.d.ts.map