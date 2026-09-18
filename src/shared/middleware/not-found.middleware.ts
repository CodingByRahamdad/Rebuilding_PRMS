import { Request, Response, NextFunction } from 'express';
import { NotFoundError } from '../errors/app-error';

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new NotFoundError(`Cannot ${req.method} ${req.originalUrl} - Route not found.`);
  next(error);
};
