import { Response } from 'express';
import { HttpStatus, HttpStatusCode } from '../constants/http-status';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export class ApiResponse {
  public static success<T>(
    res: Response,
    data: T,
    message = 'Operation successful',
    statusCode: HttpStatusCode = HttpStatus.OK,
    meta?: Record<string, any>
  ): Response {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      ...(meta && { meta }),
    });
  }

  public static created<T>(
    res: Response,
    data: T,
    message = 'Resource created successfully'
  ): Response {
    return this.success(res, data, message, HttpStatus.CREATED);
  }

  public static paginated<T>(
    res: Response,
    data: T[],
    paginationMeta: PaginationMeta,
    message = 'Data retrieved successfully'
  ): Response {
    return res.status(HttpStatus.OK).json({
      success: true,
      message,
      data,
      meta: paginationMeta,
    });
  }

  public static error(
    res: Response,
    message = 'An error occurred',
    statusCode: HttpStatusCode = HttpStatus.INTERNAL_SERVER_ERROR,
    errors?: any[]
  ): Response {
    return res.status(statusCode).json({
      success: false,
      message,
      ...(errors && errors.length > 0 && { errors }),
    });
  }
}
