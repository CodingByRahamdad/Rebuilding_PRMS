import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../../shared/config/env.config';
import { JwtPayload } from '../../shared/types/auth.types';
import { UserRole } from '../users/models/user.model';

export class AuthUtils {
  private static SALT_ROUNDS = 10;

  public static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  public static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  public static generateRandomToken(bytes = 32): string {
    return crypto.randomBytes(bytes).toString('hex');
  }

  public static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  public static verifyTokenHash(plainToken: string, storedHash: string): boolean {
    if (!plainToken || !storedHash) return false;
    try {
      const computedHash = this.hashToken(plainToken);
      const hashBuf = Buffer.from(computedHash, 'hex');
      const storedBuf = Buffer.from(storedHash, 'hex');
      if (hashBuf.length !== storedBuf.length) return false;
      return crypto.timingSafeEqual(hashBuf, storedBuf);
    } catch {
      return false;
    }
  }

  public static generateAccessToken(payload: { id: string; email: string; role: UserRole }): string {
    return jwt.sign(
      {
        id: payload.id,
        email: payload.email,
        role: payload.role,
        type: 'access',
      },
      env.JWT_SECRET,
      {
        algorithm: 'HS256',
        expiresIn: env.JWT_EXPIRES_IN as any,
      }
    );
  }

  public static generateRefreshToken(payload: { id: string; email: string; role: UserRole }): string {
    return jwt.sign(
      {
        id: payload.id,
        email: payload.email,
        role: payload.role,
        type: 'refresh',
      },
      env.JWT_REFRESH_SECRET,
      {
        algorithm: 'HS256',
        expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
      }
    );
  }

  public static verifyAccessToken(token: string): JwtPayload {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ['HS256'],
    }) as JwtPayload;

    if (decoded.type && decoded.type !== 'access') {
      const err: any = new Error('Invalid token purpose: expected access token.');
      err.name = 'JsonWebTokenError';
      throw err;
    }

    return decoded;
  }

  public static verifyRefreshToken(token: string): JwtPayload {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET, {
      algorithms: ['HS256'],
    }) as JwtPayload;

    if (decoded.type && decoded.type !== 'refresh') {
      const err: any = new Error('Invalid token purpose: expected refresh token.');
      err.name = 'JsonWebTokenError';
      throw err;
    }

    return decoded;
  }

  public static decodeTokenSafely(token: string): JwtPayload | null {
    try {
      return (jwt.decode(token) as JwtPayload) || null;
    } catch {
      return null;
    }
  }
}
