import rateLimit from 'express-rate-limit';
import { env } from '../config/env.config';
import { HttpStatus } from '../constants/http-status';

export const apiRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Health checks and status probes should never be blocked by rate limiting
    return req.path === '/health' || req.path === '/api/health' || req.originalUrl.includes('/health');
  },
  handler: (req, res) => {
    res.status(HttpStatus.TOO_MANY_REQUESTS).json({
      success: false,
      message: 'Too many requests from this IP address, please try again later.',
    });
  },
});
