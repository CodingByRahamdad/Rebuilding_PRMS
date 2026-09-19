import { Request, Response, CookieOptions } from 'express';
import { AuthService } from './auth.service';
import { AuthUtils } from './auth.utils';
import { ApiResponse } from '../../shared/utils/api-response';
import { asyncHandler } from '../../shared/utils/async-handler';
import { HttpStatus } from '../../shared/constants/http-status';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  private getRefreshTokenCookieOptions(): CookieOptions {
    const isProduction = process.env.NODE_ENV === 'production';
    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };
  }

  public login = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.authService.login(req.body);

    // Set secure HttpOnly refresh token cookie
    res.cookie('refreshToken', result.refreshToken, this.getRefreshTokenCookieOptions());

    // Secure payload: return user and accessToken without exposing refreshToken in JS JSON response
    const responseData = {
      user: result.user,
      accessToken: result.accessToken,
    };

    return ApiResponse.success(res, responseData, 'User logged in successfully', HttpStatus.OK);
  });

  public refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    const tokens = await this.authService.refreshTokens(token);

    // Set rotated secure HttpOnly refresh token cookie
    res.cookie('refreshToken', tokens.refreshToken, this.getRefreshTokenCookieOptions());

    const responseData = {
      accessToken: tokens.accessToken,
    };

    return ApiResponse.success(res, responseData, 'Tokens refreshed successfully', HttpStatus.OK);
  });

  public logout = asyncHandler(async (req: Request, res: Response) => {
    // 1. Identify user to invalidate from access token context
    let targetUserId = req.user?.id;

    // 2. If access token was expired, attempt recovery from refresh token cookie or body
    if (!targetUserId) {
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
      if (refreshToken) {
        const decoded = AuthUtils.decodeTokenSafely(refreshToken);
        if (decoded?.id) {
          targetUserId = decoded.id;
        }
      }
    }

    if (targetUserId) {
      await this.authService.logout(targetUserId);
    }

    // 3. Clear cookie cleanly across all environments
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/',
    });

    return ApiResponse.success(res, null, 'User logged out successfully', HttpStatus.OK);
  });

  public getMe = asyncHandler(async (req: Request, res: Response) => {
    const user = await this.authService.getMe(req.user!.id);
    return ApiResponse.success(res, user, 'Current user profile fetched successfully', HttpStatus.OK);
  });

  public changePassword = asyncHandler(async (req: Request, res: Response) => {
    await this.authService.changePassword(req.user!.id, req.body);
    return ApiResponse.success(res, null, 'Password updated successfully. Please log in again.', HttpStatus.OK);
  });

  public forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.authService.forgotPassword(req.body);
    return ApiResponse.success(res, result, 'Password reset request processed.', HttpStatus.OK);
  });

  public resetPassword = asyncHandler(async (req: Request, res: Response) => {
    await this.authService.resetPassword(req.body);
    return ApiResponse.success(res, null, 'Password reset successfully.', HttpStatus.OK);
  });
}

