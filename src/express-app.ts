import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { env } from './shared/config/env.config';
import { requestLogger } from './shared/middleware/request-logger.middleware';
import { apiRateLimiter } from './shared/middleware/rate-limiter.middleware';
import { notFoundHandler } from './shared/middleware/not-found.middleware';
import { errorHandler } from './shared/middleware/error-middleware';
import { ApiResponse } from './shared/utils/api-response';
import apiRouter from './routes';

export const createApp = (): Application => {
  const app: Application = express();

  // 1. Security & Infrastructure Middlewares
  app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: false, // Vite UI rendering compatibility in dev preview
    })
  );

  app.use(
    cors({
      origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(','),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  app.use(compression());
  app.use(cookieParser());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 2. System Health Check Endpoint (Direct probe without rate limit overhead)
  app.get('/api/health', (req, res) => {
    ApiResponse.success(
      res,
      {
        status: 'UP',
        service: 'PRMS Backend API',
        environment: env.NODE_ENV,
        timestamp: new Date().toISOString(),
      },
      'Backend operational'
    );
  });

  // 3. Request Logging & Rate Limiting
  app.use(requestLogger);
  app.use('/api', apiRateLimiter);

  // 4. Prevent stale browser caching / 304s on dynamic API responses
  app.use('/api/v1', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
  });

  // 5. API v1 Router Mount Point
  app.use('/api/v1', apiRouter);

  return app;
};
