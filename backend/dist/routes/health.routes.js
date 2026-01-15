"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const ioredis_1 = __importDefault(require("ioredis"));
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
/**
 * Health Check Endpoint
 * GET /api/health
 */
router.get('/', async (req, res) => {
    const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        checks: {
            database: 'unknown',
            redis: 'unknown',
        },
    };
    try {
        // Check database connection
        await prisma.$queryRaw `SELECT 1`;
        health.checks.database = 'healthy';
    }
    catch (error) {
        health.checks.database = 'unhealthy';
        health.status = 'degraded';
    }
    try {
        // Check Redis connection (if configured)
        if (process.env.REDIS_URL) {
            const redis = new ioredis_1.default(process.env.REDIS_URL);
            await redis.ping();
            await redis.quit();
            health.checks.redis = 'healthy';
        }
        else {
            health.checks.redis = 'not_configured';
        }
    }
    catch (error) {
        health.checks.redis = 'unhealthy';
        health.status = 'degraded';
    }
    const statusCode = health.status === 'ok' ? 200 : 503;
    res.status(statusCode).json(health);
});
/**
 * Readiness Check
 * GET /api/health/ready
 */
router.get('/ready', async (req, res) => {
    try {
        // Check if database is ready
        await prisma.$queryRaw `SELECT 1`;
        res.status(200).json({
            status: 'ready',
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        res.status(503).json({
            status: 'not_ready',
            timestamp: new Date().toISOString(),
            error: 'Database not ready',
        });
    }
});
/**
 * Liveness Check
 * GET /api/health/live
 */
router.get('/live', (req, res) => {
    res.status(200).json({
        status: 'alive',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});
/**
 * Metrics Endpoint
 * GET /api/health/metrics
 */
router.get('/metrics', (req, res) => {
    const metrics = {
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        platform: process.platform,
        nodeVersion: process.version,
    };
    res.status(200).json(metrics);
});
exports.default = router;
//# sourceMappingURL=health.routes.js.map