/**
 * Main Server Entry Point
 * 
 * Express server สำหรับระบบจองหอพักและจัดการผู้เช่า
 * รองรับ REST API, Socket.io, และ LINE Webhook
 * 
 * @module server/src/index
 * @author Dormitory Management System
 */

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import { initializeSocketIO } from './socket/socket.io';
import { initializeBullQueues } from './jobs/queue';
import { initializeCronJobs } from './jobs/cron';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import buildingRoutes from './routes/building.routes';
import roomRoutes from './routes/room.routes';
import tenantRoutes from './routes/tenant.routes';
import billRoutes from './routes/bill.routes';
import paymentRoutes from './routes/payment.routes';
import maintenanceRoutes from './routes/maintenance.routes';
import chatRoutes from './routes/chat.routes';
import lineRoutes from './routes/line.routes';
import utilityRoutes from './routes/utility.routes';
import reportRoutes from './routes/report.routes';
import notificationRoutes from './routes/notification.routes';
import publicRoutes from './routes/public.routes';
import uploadRoutes from './routes/upload.routes';
import privacyRoutes from './routes/privacy.routes';
import path from 'path';

/**
 * Initialize Express Application
 */
const app: Application = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;

/**
 * Security Middleware
 */
app.use(helmet());
app.use(compression());

/**
 * CORS Configuration
 */
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'];
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

/**
 * Rate Limiting
 */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 500, // 100 prod, 500 dev
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Stricter limit for auth endpoints (relaxed for development)
const authLimiter = rateLimit({
  windowMs: process.env.NODE_ENV === 'production' ? 15 * 60 * 1000 : 60 * 1000, // 15 min prod, 1 min dev
  max: process.env.NODE_ENV === 'production' ? 5 : 50, // 5 prod, 50 dev
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

/**
 * Body Parser Middleware
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

/**
 * Request Logging Middleware
 */
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`, {
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
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/buildings', buildingRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/tenant/payments', paymentRoutes); // Map both for frontend compatibility
app.use('/api/bills', billRoutes);
app.use('/api/tenant/bills', billRoutes); // Map both for frontend compatibility
app.use('/api/payments', paymentRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/tenant/maintenance', maintenanceRoutes); // Map both for frontend compatibility
app.use('/api/chat', chatRoutes);
app.use('/api/line', lineRoutes);
app.use('/api/utilities', utilityRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/public', publicRoutes);
app.use('/', privacyRoutes);

/**
 * Initialize Socket.io
 */
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});
initializeSocketIO(io);

/**
 * Initialize Background Jobs
 */
initializeBullQueues();
initializeCronJobs();

/**
 * Error Handling Middleware (must be last)
 */
app.use(errorHandler);

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
  logger.info(`🚀 Server is running on port ${PORT}`);
  logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});

/**
 * Graceful Shutdown
 */
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

export { app, httpServer, io };

