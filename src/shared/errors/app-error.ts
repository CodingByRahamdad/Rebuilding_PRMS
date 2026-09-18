import { HttpStatus, HttpStatusCode } from '../constants/http-status';

export class AppError extends Error {
  public readonly statusCode: HttpStatusCode;
  public readonly isOperational: boolean;
  public readonly errors?: any[];

  constructor(message: string, statusCode: HttpStatusCode = HttpStatus.INTERNAL_SERVER_ERROR, errors?: any[]) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad Request', errors?: any[]) {
    super(message, HttpStatus.BAD_REQUEST, errors);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized access') {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden resource access') {
    super(message, HttpStatus.FORBIDDEN);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Requested resource not found') {
    super(message, HttpStatus.NOT_FOUND);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict occurred') {
    super(message, HttpStatus.CONFLICT);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', errors?: any[]) {
    super(message, HttpStatus.UNPROCESSABLE_ENTITY, errors);
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'Internal server error occurred') {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = 'Service unavailable. Database connection is required.') {
    super(message, HttpStatus.SERVICE_UNAVAILABLE);
  }
}

export class DatabaseUnavailableError extends AppError {
  constructor(message = 'Database service is unavailable. MongoDB connection is required in production mode.') {
    super(message, HttpStatus.SERVICE_UNAVAILABLE);
  }
}
