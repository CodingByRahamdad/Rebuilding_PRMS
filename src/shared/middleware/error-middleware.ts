import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { AppError } from '../errors/app-error';
import { ApiResponse } from '../utils/api-response';
import { HttpStatus } from '../constants/http-status';
import { env } from '../config/env.config';
import { ZodError } from 'zod';

export const errorHandler: ErrorRequestHandler = (
  err: Error | AppError | ZodError | any,
  req: Request,
  res: Response,
  _next: NextFunction
): any => {
  // Handle AppError hierarchy
  if (err instanceof AppError) {
    return ApiResponse.error(res, err.message, err.statusCode, err.errors);
  }

  // Handle Zod validation error
  if (err instanceof ZodError) {
    const formattedErrors = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    return ApiResponse.error(res, 'Validation Error', HttpStatus.UNPROCESSABLE_ENTITY, formattedErrors);
  }

  // Handle Mongoose duplicate key error (code 11000)
  if (err.name === 'MongoServerError' && err.code === 11000) {
    const fields = Object.keys(err.keyValue || {}).join(', ');
    const message = `Duplicate field value entered for [${fields}]. Value must be unique.`;
    return ApiResponse.error(res, message, HttpStatus.CONFLICT);
  }

  // Handle Mongoose ValidationError
  if (err.name === 'ValidationError' && err.errors) {
    const formattedErrors = Object.values(err.errors).map((e: any) => ({
      field: e.path,
      message: e.message,
    }));
    return ApiResponse.error(res, 'Database validation failed', HttpStatus.UNPROCESSABLE_ENTITY, formattedErrors);
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return ApiResponse.error(res, `Invalid format for field: ${err.path}`, HttpStatus.BAD_REQUEST);
  }

  // Handle JWT invalid or expired token error
  if (err.name === 'JsonWebTokenError') {
    return ApiResponse.error(res, 'Invalid authentication token.', HttpStatus.UNAUTHORIZED);
  }

  if (err.name === 'TokenExpiredError') {
    return ApiResponse.error(res, 'Authentication token has expired.', HttpStatus.UNAUTHORIZED);
  }

  // Fallback for unhandled/unexpected server errors
  console.error('💥 Unhandled Exception:', err);
  const message = env.NODE_ENV === 'production' ? 'Internal server error' : err.message || 'Internal server error';
  return ApiResponse.error(res, message, HttpStatus.INTERNAL_SERVER_ERROR);
};
