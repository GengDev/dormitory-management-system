"use strict";
/**
 * Main Server Entry Point
 *
 * Express server สำหรับระบบจองหอพักและจัดการผู้เช่า
 * รองรับ REST API, Socket.io, และ LINE Webhook
 *
 * @module server/src/index
 * @author Dormitory Management System
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = exports.httpServer = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const dotenv_1 = __importDefault(require("dotenv"));
const socket_io_2 = require("./socket/socket.io");
const queue_1 = require("./jobs/queue");
const cron_1 = require("./jobs/cron");
const errorHandler_1 = require("./middleware/errorHandler");
const logger_1 = require("./utils/logger");
// Load environment variables
dotenv_1.default.config();
// Import routes
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const building_routes_1 = __importDefault(require("./routes/building.routes"));
const room_routes_1 = __importDefault(require("./routes/room.routes"));
const tenant_routes_1 = __importDefault(require("./routes/tenant.routes"));
const bill_routes_1 = __importDefault(require("./routes/bill.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const maintenance_routes_1 = __importDefault(require("./routes/maintenance.routes"));
const chat_routes_1 = __importDefault(require("./routes/chat.routes"));
const line_routes_1 = __importDefault(require("./routes/line.routes"));
const utility_routes_1 = __importDefault(require("./routes/utility.routes"));
const report_routes_1 = __importDefault(require("./routes/report.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const public_routes_1 = __importDefault(require("./routes/public.routes"));
const upload_routes_1 = __importDefault(require("./routes/upload.routes"));
const privacy_routes_1 = __importDefault(require("./routes/privacy.routes"));
const path_1 = __importDefault(require("path"));
/**
 * Initialize Express Application
 */
const app = (0, express_1.default)();
exports.app = app;
const httpServer = (0, http_1.createServer)(app);
exports.httpServer = httpServer;
const PORT = process.env.PORT || 3000;
/**
 * Security Middleware
 */
app.use((0, helmet_1.default)());
app.use((0, compression_1.default)());
/**
 * CORS Configuration
 */
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'];
app.use((0, cors_1.default)({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
/**
 * Rate Limiting
 */
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 100 : 500, // 100 prod, 500 dev
    message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);
// Stricter limit for auth endpoints (relaxed for development)
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: process.env.NODE_ENV === 'production' ? 15 * 60 * 1000 : 60 * 1000, // 15 min prod, 1 min dev
    max: process.env.NODE_ENV === 'production' ? 5 : 50, // 5 prod, 50 dev
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
/**
 * Body Parser Middleware
 */
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Serve static files
app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), 'uploads')));
/**
 * Request Logging Middleware
 */
app.use((req, _res, next) => {
    logger_1.logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('user-agent'),
    });
    next();
});
/**
 * Health Check Endpoint
 */
app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});
/**
 * API Routes
 */
app.use('/api/auth', auth_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/buildings', building_routes_1.default);
app.use('/api/rooms', room_routes_1.default);
app.use('/api/tenants', tenant_routes_1.default);
app.use('/api/tenant/payments', payment_routes_1.default); // Map both for frontend compatibility
app.use('/api/bills', bill_routes_1.default);
app.use('/api/tenant/bills', bill_routes_1.default); // Map both for frontend compatibility
app.use('/api/payments', payment_routes_1.default);
app.use('/api/maintenance', maintenance_routes_1.default);
app.use('/api/tenant/maintenance', maintenance_routes_1.default); // Map both for frontend compatibility
app.use('/api/chat', chat_routes_1.default);
app.use('/api/line', line_routes_1.default);
app.use('/api/utilities', utility_routes_1.default);
app.use('/api/reports', report_routes_1.default);
app.use('/api/notifications', notification_routes_1.default);
app.use('/api/upload', upload_routes_1.default);
app.use('/api/public', public_routes_1.default);
app.use('/', privacy_routes_1.default);
/**
 * Initialize Socket.io
 */
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        credentials: true,
    },
});
exports.io = io;
(0, socket_io_2.initializeSocketIO)(io);
/**
 * Initialize Background Jobs
 */
(0, queue_1.initializeBullQueues)();
(0, cron_1.initializeCronJobs)();
/**
 * Error Handling Middleware (must be last)
 */
app.use(errorHandler_1.errorHandler);
/**
 * 404 Handler
 */
app.use((_req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
    });
});
/**
 * Start Server
 */
httpServer.listen(PORT, () => {
    logger_1.logger.info(`🚀 Server is running on port ${PORT}`);
    logger_1.logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});
/**
 * Graceful Shutdown
 */
process.on('SIGTERM', () => {
    logger_1.logger.info('SIGTERM signal received: closing HTTP server');
    httpServer.close(() => {
        logger_1.logger.info('HTTP server closed');
        process.exit(0);
    });
});
process.on('SIGINT', () => {
    logger_1.logger.info('SIGINT signal received: closing HTTP server');
    httpServer.close(() => {
        logger_1.logger.info('HTTP server closed');
        process.exit(0);
    });
});
//# sourceMappingURL=index.js.map