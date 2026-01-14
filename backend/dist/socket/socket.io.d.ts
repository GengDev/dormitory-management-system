/**
 * Socket.io Gateway
 *
 * Real-time chat gateway สำหรับ WebSocket connections
 * รองรับ multi-server ด้วย Redis adapter
 *
 * @module server/src/socket/socket.io
 */
import { Server as SocketIOServer } from 'socket.io';
/**
 * Initialize Socket.io
 *
 * @param io - Socket.io server instance
 *
 * @description
 * Setup Socket.io middleware, authentication, และ event handlers
 */
export declare function initializeSocketIO(io: SocketIOServer): void;
//# sourceMappingURL=socket.io.d.ts.map