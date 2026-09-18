import { Request, Response, NextFunction } from 'express';
import { AuthUtils } from '../../modules/auth/auth.utils';
import { UnauthorizedError, ForbiddenError } from '../errors/app-error';
import { UserRole, UserModel } from '../../modules/users/models/user.model';
import { isDbConnected, isDemoModeEnabled } from '../database/db-guard';
import { memoryStore } from '../database/memory-store';

export const authenticate = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw new UnauthorizedError('Authentication required. Please log in.');
    }

    const decoded = AuthUtils.verifyAccessToken(token);
    let activeRole: UserRole = decoded.role as UserRole;
    let activeEmail: string = decoded.email;

    // Check database or memory store for latest role and status to ensure authoritative RBAC
    if (isDbConnected()) {
      try {
        const dbUser = await UserModel.findOne({ _id: decoded.id, isDeleted: false }).select('role status email name').exec();
        if (dbUser) {
          if (dbUser.status === 'Inactive') {
            throw new UnauthorizedError('Account is inactive. Please contact system administrator.');
          }
          activeRole = dbUser.role;
          activeEmail = dbUser.email;
        }
      } catch (err: any) {
        if (err instanceof UnauthorizedError) throw err;
      }
    } else if (isDemoModeEnabled()) {
      const memUser = memoryStore.users.find((u) => (u._id === decoded.id || u.id === decoded.id) && !u.isDeleted);
      if (memUser) {
        if (memUser.status === 'Inactive') {
          throw new UnauthorizedError('Account is inactive. Please contact system administrator.');
        }
        activeRole = memUser.role as UserRole;
        activeEmail = memUser.email;
      }
    }

    req.user = {
      id: decoded.id,
      email: activeEmail,
      role: activeRole,
    };

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      next(new UnauthorizedError('Authentication token has expired. Please log in or refresh.'));
    } else if (error.name === 'JsonWebTokenError') {
      next(new UnauthorizedError('Invalid authentication token.'));
    } else {
      next(error);
    }
  }
};

export const optionalAuthenticate = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (token) {
      const decoded = AuthUtils.decodeTokenSafely(token);
      if (decoded && decoded.id && decoded.email && decoded.role) {
        req.user = {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role,
        };
      }
    }
  } catch {
    // Continue without throwing
  }
  next();
};

export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('User authentication context missing.'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Access denied. Role '${req.user.role}' is not authorized to access this resource.`
        )
      );
    }

    next();
  };
};

