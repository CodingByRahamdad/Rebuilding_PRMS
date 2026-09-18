import { AuthRepository } from './auth.repository';
import { AuthUtils } from './auth.utils';
import {
  LoginInput,
  ChangePasswordInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from './auth.validation';
import {
  UnauthorizedError,
  NotFoundError,
  BadRequestError,
} from '../../shared/errors/app-error';
import { isDemoModeEnabled } from '../../shared/database/db-guard';

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
    status: string;
    phone: string;
  };
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  private authRepository: AuthRepository;

  constructor() {
    this.authRepository = new AuthRepository();
  }

  public async login(input: LoginInput): Promise<AuthResponse> {
    const user = await this.authRepository.findByEmailWithPassword(input.email);

    if (!user) {
      throw new UnauthorizedError('Invalid credentials.');
    }

    if (user.status === 'Inactive') {
      throw new UnauthorizedError('Account is inactive. Please contact system administrator.');
    }

    const isPasswordValid = await AuthUtils.comparePassword(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials.');
    }

    const tokenPayload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = AuthUtils.generateAccessToken(tokenPayload);
    const refreshToken = AuthUtils.generateRefreshToken(tokenPayload);

    await this.authRepository.updateRefreshToken(user._id.toString(), refreshToken);

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        status: user.status,
        phone: user.phone,
      },
      accessToken,
      refreshToken,
    };
  }

  public async refreshTokens(refreshTokenProvided: string): Promise<{ accessToken: string; refreshToken: string }> {
    if (!refreshTokenProvided) {
      throw new UnauthorizedError('Refresh token missing.');
    }

    const decoded = AuthUtils.verifyRefreshToken(refreshTokenProvided);
    const user = await this.authRepository.findByIdWithRefreshToken(decoded.id);

    if (!user || user.refreshToken !== refreshTokenProvided) {
      throw new UnauthorizedError('Invalid or revoked refresh token.');
    }

    const tokenPayload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const newAccessToken = AuthUtils.generateAccessToken(tokenPayload);
    const newRefreshToken = AuthUtils.generateRefreshToken(tokenPayload);

    await this.authRepository.updateRefreshToken(user._id.toString(), newRefreshToken);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  public async logout(userId: string): Promise<void> {
    await this.authRepository.updateRefreshToken(userId, null);
  }

  public async getMe(userId: string) {
    const user = await this.authRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found.');
    }
    const userObj = typeof (user as any).toJSON === 'function' ? (user as any).toJSON() : { ...user };
    delete (userObj as any).passwordHash;
    delete (userObj as any).refreshToken;
    return userObj;
  }

  public async changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
    const user = await this.authRepository.findByEmailWithPassword(
      (await this.authRepository.findById(userId))?.email || ''
    );

    if (!user) {
      throw new NotFoundError('User not found.');
    }

    const isOldPasswordValid = await AuthUtils.comparePassword(input.oldPassword, user.passwordHash);
    if (!isOldPasswordValid) {
      throw new BadRequestError('Current password provided is incorrect.');
    }

    const newPasswordHash = await AuthUtils.hashPassword(input.newPassword);
    await this.authRepository.updatePassword(userId, newPasswordHash);
    await this.authRepository.updateRefreshToken(userId, null); // Invalidate existing refresh token
  }

  public async forgotPassword(input: ForgotPasswordInput): Promise<{ message: string; resetToken?: string }> {
    const neutralMessage = 'If an account exists with that email, a password reset link has been dispatched.';

    const user = await this.authRepository.findByEmailWithPassword(input.email);
    if (!user) {
      // Return neutral response to avoid account enumeration
      return { message: neutralMessage };
    }

    // Generate high-entropy 256-bit cryptographically secure token
    const rawResetToken = AuthUtils.generateRandomToken(32);
    const tokenHash = AuthUtils.hashToken(rawResetToken);
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes validity

    const userId = user._id ? user._id.toString() : (user as any).id;
    await this.authRepository.savePasswordResetToken(userId, tokenHash, expires);

    // In demo mode, return resetToken to support zero-friction demo testing workflows
    const isDemo = isDemoModeEnabled();
    return {
      message: neutralMessage,
      ...(isDemo ? { resetToken: rawResetToken } : {}),
    };
  }

  public async resetPassword(input: ResetPasswordInput): Promise<void> {
    const user = await this.authRepository.findByEmailWithPassword(input.email);
    if (!user || !user.passwordResetTokenHash || !user.passwordResetExpires) {
      throw new BadRequestError('Invalid or expired reset token.');
    }

    const now = new Date();
    const tokenExpiry = new Date(user.passwordResetExpires);
    if (now > tokenExpiry) {
      throw new BadRequestError('Password reset token has expired. Please request a new one.');
    }

    const isTokenValid = AuthUtils.verifyTokenHash(input.token, user.passwordResetTokenHash);
    if (!isTokenValid) {
      throw new BadRequestError('Invalid or expired reset token.');
    }

    const newPasswordHash = await AuthUtils.hashPassword(input.newPassword);
    const userId = user._id ? user._id.toString() : (user as any).id;
    await this.authRepository.completePasswordReset(userId, newPasswordHash);
  }
}
