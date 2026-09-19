import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validate } from '../../shared/middleware/validate.middleware';
import { authenticate, optionalAuthenticate } from '../../shared/middleware/auth.middleware';
import {
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth.validation';

const authRouter = Router();
const authController = new AuthController();

authRouter.post('/login', validate(loginSchema), authController.login);
authRouter.post('/refresh-token', validate(refreshTokenSchema), authController.refreshToken);
authRouter.post('/logout', optionalAuthenticate, authController.logout);
authRouter.get('/me', authenticate, authController.getMe);
authRouter.post('/change-password', authenticate, validate(changePasswordSchema), authController.changePassword);
authRouter.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
authRouter.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

export default authRouter;

