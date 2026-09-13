import type { RequestHandler } from 'express';
import { env } from '../config/env.js';
import { Session } from '../models/session.model.js';
import { User } from '../models/user.model.js';
import * as authService from '../services/auth.service.js';
import { HttpError } from '../utilities/http-error.js';
import { randomToken } from '../utilities/crypto.js';
const client = (req: Parameters<RequestHandler>[0]) => ({
  ipAddress: req.ip,
  userAgent: req.get('user-agent'),
});
const cookieOptions = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: env.COOKIE_SAME_SITE,
  path: '/api/v1/auth',
  maxAge: env.JWT_REFRESH_TTL_DAYS * 86400000,
  ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
} as const;
const oauthStateCookie = 'resumind_oauth_state';
export const register: RequestHandler = async (req, res) => {
  res.status(201).json({ success: true, data: await authService.register(req.body, client(req)) });
};
export const login: RequestHandler = async (req, res) => {
  const result = await authService.login(req.body, client(req));
  res
    .cookie(env.COOKIE_NAME, result.refreshToken, cookieOptions)
    .json({ success: true, data: { accessToken: result.accessToken, user: result.user } });
};
export const refresh: RequestHandler = async (req, res) => {
  const token = req.cookies[env.COOKIE_NAME] as string | undefined;
  if (!token) throw new HttpError(401, 'REFRESH_REQUIRED', 'Refresh session is required.');
  const result = await authService.refresh(token, client(req));
  res
    .cookie(env.COOKIE_NAME, result.refreshToken, cookieOptions)
    .json({ success: true, data: { accessToken: result.accessToken, user: result.user } });
};
export const logout: RequestHandler = async (req, res) => {
  if (req.auth) await Session.findByIdAndUpdate(req.auth.sessionId, { revokedAt: new Date() });
  res
    .clearCookie(env.COOKIE_NAME, cookieOptions)
    .json({ success: true, data: { message: 'Signed out.' } });
};
export const me: RequestHandler = async (req, res) => {
  const user = await User.findOne({ _id: req.auth?.userId, deletedAt: null });
  if (!user) throw new HttpError(404, 'USER_NOT_FOUND', 'User was not found.');
  res.json({ success: true, data: user });
};
export const verifyEmail: RequestHandler = async (req, res) => {
  res.json({ success: true, data: await authService.verifyEmail(req.body.token) });
};
export const forgotPassword: RequestHandler = async (req, res) => {
  res.json({ success: true, data: await authService.forgotPassword(req.body.email) });
};
export const resetPassword: RequestHandler = async (req, res) => {
  res.json({
    success: true,
    data: await authService.resetPassword(req.body.token, req.body.password),
  });
};
export const sessions: RequestHandler = async (req, res) => {
  const data = await Session.find({
    userId: req.auth?.userId,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  })
    .select('-tokenHash')
    .sort({ lastUsedAt: -1 });
  res.json({ success: true, data });
};
export const revokeSession: RequestHandler = async (req, res) => {
  await Session.updateOne(
    { _id: req.params.id, userId: req.auth?.userId },
    { revokedAt: new Date() },
  );
  res.json({ success: true, data: { message: 'Session revoked.' } });
};
export const revokeAllSessions: RequestHandler = async (req, res) => {
  await Session.updateMany(
    { userId: req.auth?.userId, revokedAt: null },
    { revokedAt: new Date() },
  );
  res
    .clearCookie(env.COOKIE_NAME, cookieOptions)
    .json({ success: true, data: { message: 'All sessions revoked.' } });
};
export const googleStart: RequestHandler = (_req, res) => {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CALLBACK_URL)
    throw new HttpError(503, 'OAUTH_NOT_CONFIGURED', 'Google sign-in is not configured.');
  const state = randomToken();
  res.cookie(oauthStateCookie, state, {
    ...cookieOptions,
    path: '/api/v1/auth/google',
    maxAge: 600000,
  });
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: env.GOOGLE_CALLBACK_URL,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
};
export const googleCallback: RequestHandler = async (req, res) => {
  const code = typeof req.query.code === 'string' ? req.query.code : undefined;
  const state = typeof req.query.state === 'string' ? req.query.state : undefined;
  if (!code || !state || state !== req.cookies[oauthStateCookie])
    throw new HttpError(400, 'OAUTH_STATE_INVALID', 'Google sign-in could not be verified.');
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_CALLBACK_URL)
    throw new HttpError(503, 'OAUTH_NOT_CONFIGURED', 'Google sign-in is not configured.');
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: env.GOOGLE_CALLBACK_URL,
      grant_type: 'authorization_code',
    }),
  });
  if (!tokenResponse.ok)
    throw new HttpError(401, 'OAUTH_EXCHANGE_FAILED', 'Google sign-in failed.');
  const tokenData = (await tokenResponse.json()) as { access_token?: string };
  if (!tokenData.access_token)
    throw new HttpError(401, 'OAUTH_EXCHANGE_FAILED', 'Google sign-in failed.');
  const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { authorization: `Bearer ${tokenData.access_token}` },
  });
  if (!profileResponse.ok)
    throw new HttpError(401, 'OAUTH_PROFILE_FAILED', 'Google profile could not be loaded.');
  const profile = (await profileResponse.json()) as {
    sub: string;
    email: string;
    name: string;
    picture?: string;
  };
  const result = await authService.loginWithGoogle(
    {
      id: profile.sub,
      email: profile.email,
      name: profile.name,
      ...(profile.picture ? { picture: profile.picture } : {}),
    },
    client(req),
  );
  res.clearCookie(oauthStateCookie, { ...cookieOptions, path: '/api/v1/auth/google' });
  res
    .cookie(env.COOKIE_NAME, result.refreshToken, cookieOptions)
    .redirect(`${env.WEB_URL}/auth/callback`);
};
