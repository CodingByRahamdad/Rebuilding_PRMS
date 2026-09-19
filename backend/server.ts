import http from 'http';
import { createApp } from './src/express-app';
import { dbConnection } from './src/shared/database/connection';
import { seedDatabase } from './src/shared/database/seeder';
import { env } from './src/shared/config/env.config';
import { notFoundHandler } from './src/shared/middleware/not-found.middleware';
import { errorHandler } from './src/shared/middleware/error-middleware';
import { initSocket } from './src/shared/socket';

async function startServer() {
  const app = createApp();
  const server = http.createServer(app);

  // Initialize Socket.IO
  initSocket(server);

  // 1. Connect to MongoDB database & seed initial data if connected
  try {
    await dbConnection.connect();
    if (dbConnection.getStatus().isConnected) {
      await seedDatabase();
    }
  } catch (err: any) {
    console.warn('⚠️ Non-fatal database initialization note:', err?.message || err);
  }

  // 2. Fallback handlers for unmatched API routes and error handler
  app.use(notFoundHandler);
  app.use(errorHandler);

  const PORT = env.PORT || 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 PRMS Backend API listening on http://0.0.0.0:${PORT}`);
  });

  // 4. Graceful Shutdown & Signal Handling
  const gracefulShutdown = async (signal: string) => {
    console.log(`\n⚠️ Received ${signal}. Shutting down server gracefully...`);
    server.close(async () => {
      console.log('🔒 HTTP server closed.');
      await dbConnection.disconnect();
      process.exit(0);
    });

    setTimeout(() => {
      console.error('⌛ Forced shutdown triggered.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  process.on('unhandledRejection', (reason: any) => {
    console.error('💥 Unhandled Promise Rejection:', reason);
  });

  process.on('uncaughtException', (error: Error) => {
    console.error('💥 Uncaught Exception:', error);
    gracefulShutdown('uncaughtException');
  });
}

startServer();
