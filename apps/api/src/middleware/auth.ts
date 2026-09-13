import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import type { Role } from '@resumind/shared';
import { env, isAllowedWebOrigin } from '../config/env.js';
import { Session } from '../models/session.model.js';
import { HttpError } from '../utilities/http-error.js';
type Claims = { sub: string; sid: string; role: Role };
export const authenticate: RequestHandler = async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer '))
    return next(new HttpError(401, 'AUTH_REQUIRED', 'Authentication is required.'));
  try {
    const claims = jwt.verify(header.slice(7), env.JWT_ACCESS_SECRET) as Claims;
    const session = await Session.exists({
      _id: claims.sid,
      userId: claims.sub,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    });
    if (!session)
      throw new HttpError(401, 'SESSION_INVALID', 'The session is invalid or has been revoked.');
    req.auth = { userId: claims.sub, sessionId: claims.sid, role: claims.role };
    next();
  } catch {
    next(new HttpError(401, 'TOKEN_INVALID', 'The access token is invalid or expired.'));
  }
};
export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) =>
    req.auth && roles.includes(req.auth.role)
      ? next()
      : next(new HttpError(403, 'FORBIDDEN', 'You do not have permission to perform this action.'));

export const requireTrustedOrigin: RequestHandler = (req, _res, next) => {
  if (!isAllowedWebOrigin(req.get('origin'))) {
    return next(new HttpError(403, 'ORIGIN_INVALID', 'Request origin could not be verified.'));
  }
  next();
};
