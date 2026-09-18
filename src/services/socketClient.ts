import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io({
      autoConnect: true,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('Connected to PRMS Real-Time Socket.IO server');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from Socket.IO server');
    });
  }
  return socket;
}

export function subscribeToActivityLogs(callback: (activity: any) => void) {
  const s = getSocket();
  s.on('activity:new', callback);
  return () => {
    s.off('activity:new', callback);
  };
}
