import { UserRole } from '../../modules/users/models/user.model';

export interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
  type?: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
