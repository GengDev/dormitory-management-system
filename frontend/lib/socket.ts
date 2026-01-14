/**
 * Socket.io Client
 * 
 * Socket.io client สำหรับ real-time chat
 * 
 * @module lib/socket
 */

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

/**
 * Initialize Socket Connection
 * 
 * @param token - JWT access token
 * @returns Socket instance
 * 
 * @description
 * สร้าง Socket.io connection พร้อม authentication
 */
export function initSocket(token: string): Socket {
  if (socket?.connected) {
    return socket;
  }

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  socket = io(API_URL, {
    auth: {
      token,
    },
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket?.id);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  return socket;
}

/**
 * Get Socket Instance
 * 
 * @returns Socket instance or null
 */
export function getSocket(): Socket | null {
  return socket;
}

/**
 * Disconnect Socket
 * 
 * @description
 * ปิด Socket.io connection
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

