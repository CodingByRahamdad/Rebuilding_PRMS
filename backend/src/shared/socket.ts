import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { AuthUtils } from '../modules/auth/auth.utils';
import { env } from './config/env.config';

let io: SocketIOServer | null = null;

export const initSocket = (httpServer: HttpServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(','),
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
    path: '/socket.io',
  });

  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      // Allow unauthenticated connection or reject if required
      return next();
    }

    try {
      const decoded = AuthUtils.verifyAccessToken(token);
      socket.data.user = decoded;
      next();
    } catch {
      next();
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket client connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`🔌 Socket client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): SocketIOServer | null => io;

export const emitActivityLog = (logPayload: any) => {
  if (io) {
    io.emit('activity:new', logPayload);
  }
};
