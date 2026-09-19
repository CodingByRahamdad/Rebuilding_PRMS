import morgan from 'morgan';
import { RequestHandler } from 'express';
import { env } from '../config/env.config';

export const requestLogger: RequestHandler = morgan(
  env.NODE_ENV === 'production'
    ? ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"'
    : ':method :url :status :response-time ms - :res[content-length]'
);
