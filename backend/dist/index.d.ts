/**
 * Main Server Entry Point
 *
 * Express server สำหรับระบบจองหอพักและจัดการผู้เช่า
 * รองรับ REST API, Socket.io, และ LINE Webhook
 *
 * @module server/src/index
 * @author Dormitory Management System
 */
import { Server as SocketIOServer } from 'socket.io';
/**
 * Initialize Express Application
 */
declare const app: import("express-serve-static-core").Express;
declare const httpServer: import("http").Server<typeof import("http").IncomingMessage, typeof import("http").ServerResponse>;
/**
 * Initialize Socket.io
 */
declare const io: SocketIOServer<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
export { app, httpServer, io };
//# sourceMappingURL=index.d.ts.map