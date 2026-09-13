import { Router } from 'express';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '@resumind/shared';
import * as controller from '../../controllers/auth.controller.js';
import { authenticate, requireTrustedOrigin } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
export const authRouter = Router();
authRouter.post('/register', validateBody(registerSchema), controller.register);
authRouter.post('/login', validateBody(loginSchema), controller.login);
authRouter.post('/refresh', requireTrustedOrigin, controller.refresh);
authRouter.get('/google', controller.googleStart);
authRouter.get('/google/callback', controller.googleCallback);
authRouter.post('/verify-email', validateBody(verifyEmailSchema), controller.verifyEmail);
authRouter.post('/forgot-password', validateBody(forgotPasswordSchema), controller.forgotPassword);
authRouter.post('/reset-password', validateBody(resetPasswordSchema), controller.resetPassword);
authRouter.get('/me', authenticate, controller.me);
authRouter.post('/logout', authenticate, controller.logout);
authRouter.get('/sessions', authenticate, controller.sessions);
authRouter.delete('/sessions/:id', authenticate, controller.revokeSession);
authRouter.delete('/sessions', authenticate, controller.revokeAllSessions);
