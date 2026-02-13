import {
  WSController,
  OnWSConnection,
  OnWSDisConnection,
  Config,
} from '@midwayjs/decorator';
import { Context } from '@midwayjs/socketio';
import * as jwt from 'jsonwebtoken';

// In-memory map: userId -> Set<socketId>
const userSocketMap = new Map<number, Set<string>>();

export function getSocketIdsByUserId(userId: number): Set<string> | undefined {
  return userSocketMap.get(userId);
}

@WSController('/')
export class SocketGateway {
  @Config('module.base')
  coolConfig;

  @OnWSConnection()
  async onConnection(socket: Context) {
    try {
      const token = socket.handshake?.auth?.token;
      if (!token) {
        socket.disconnect();
        return;
      }

      const decoded = jwt.verify(token, this.coolConfig.jwt.secret) as any;
      if (!decoded || !decoded.userId) {
        socket.disconnect();
        return;
      }

      const userId = decoded.userId;

      if (!userSocketMap.has(userId)) {
        userSocketMap.set(userId, new Set());
      }
      userSocketMap.get(userId).add(socket.id);

      (socket as any).userId = userId;

      console.log(
        `[Socket] User ${userId} connected, socketId: ${socket.id}`
      );
    } catch (err) {
      console.log('[Socket] Auth failed:', err.message);
      socket.disconnect();
    }
  }

  @OnWSDisConnection()
  async onDisConnection(socket: Context) {
    const userId = (socket as any).userId;
    if (userId && userSocketMap.has(userId)) {
      userSocketMap.get(userId).delete(socket.id);
      if (userSocketMap.get(userId).size === 0) {
        userSocketMap.delete(userId);
      }
      console.log(
        `[Socket] User ${userId} disconnected, socketId: ${socket.id}`
      );
    }
  }
}
