import { randomUUID } from 'node:crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { LoginInput, RegisterInput, Role } from '@resumind/shared';
import { env } from '../config/env.js';
import { ActionToken } from '../models/action-token.model.js';
import { Session } from '../models/session.model.js';
import { User } from '../models/user.model.js';
import { hashToken, randomToken } from '../utilities/crypto.js';
import { HttpError } from '../utilities/http-error.js';
import { recordAudit } from './audit.service.js';
import { sendActionEmail } from './email.service.js';
type Client = { ipAddress?: string | undefined; userAgent?: string | undefined };
const accessToken = (userId: string, sessionId: string, role: Role) =>
  jwt.sign({ sid: sessionId, role }, env.JWT_ACCESS_SECRET, {
    subject: userId,
    expiresIn: env.JWT_ACCESS_TTL as NonNullable<jwt.SignOptions['expiresIn']>,
  });
async function createSession(userId: string, role: Role, client: Client) {
  const raw = randomToken();
  const expiresAt = new Date(Date.now() + env.JWT_REFRESH_TTL_DAYS * 86400000);
  const session = await Session.create({
    userId,
    tokenHash: hashToken(raw),
    familyId: randomUUID(),
    expiresAt,
    ...client,
  });
  return {
    accessToken: accessToken(userId, session.id, role),
    refreshToken: `${session.id}.${raw}`,
    expiresAt,
  };
}
export async function loginWithGoogle(
  profile: { id: string; email: string; name: string; picture?: string },
  client: Client,
) {
  let user = await User.findOne({ $or: [{ googleId: profile.id }, { email: profile.email }] });
  if (!user) {
    user = await User.create({
      googleId: profile.id,
      email: profile.email,
      name: profile.name,
      avatarUrl: profile.picture,
      emailVerifiedAt: new Date(),
    });
  } else {
    user.googleId = profile.id;
    user.emailVerifiedAt ??= new Date();
    if (profile.picture) user.avatarUrl = profile.picture;
    await user.save();
  }
  const tokens = await createSession(user.id, user.role, client);
  await recordAudit('auth.google_login', {
    actorId: user.id,
    ipAddress: client.ipAddress,
    userAgent: client.userAgent,
  });
  return { user: user.toJSON(), ...tokens };
}
export async function register(input: RegisterInput, client: Client) {
  if (await User.exists({ email: input.email, deletedAt: null }))
    throw new HttpError(409, 'EMAIL_IN_USE', 'An account already exists for this email.');
  const user = await User.create({
    name: input.name,
    email: input.email,
    passwordHash: await bcrypt.hash(input.password, env.PASSWORD_BCRYPT_ROUNDS),
  });
  const raw = randomToken();
  await ActionToken.create({
    userId: user.id,
    tokenHash: hashToken(raw),
    type: 'email_verification',
    expiresAt: new Date(Date.now() + 86400000),
  });
  await sendActionEmail(
    user.email,
    'Verify your ResuMind AI email',
    `${env.WEB_URL}/verify-email?token=${raw}`,
  );
  await recordAudit('auth.register', {
    actorId: user.id,
    ipAddress: client.ipAddress,
    userAgent: client.userAgent,
  });
  return { user: user.toJSON(), message: 'Check your email to verify your account.' };
}
export async function login(input: LoginInput, client: Client) {
  const user = await User.findOne({ email: input.email.toLowerCase(), deletedAt: null }).select(
    '+passwordHash +failedLoginAttempts +lockedUntil',
  );
  const invalid = () =>
    new HttpError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
  if (!user?.passwordHash) throw invalid();
  if (user.lockedUntil && user.lockedUntil > new Date())
    throw new HttpError(
      423,
      'ACCOUNT_LOCKED',
      'This account is temporarily locked. Try again later.',
    );
  if (!(await bcrypt.compare(input.password, user.passwordHash))) {
    user.failedLoginAttempts += 1;
    if (user.failedLoginAttempts >= env.ACCOUNT_LOCK_MAX_ATTEMPTS) {
      user.lockedUntil = new Date(Date.now() + env.ACCOUNT_LOCK_DURATION_MINUTES * 60000);
      user.failedLoginAttempts = 0;
    }
    await user.save();
    throw invalid();
  }
  user.failedLoginAttempts = 0;
  user.set('lockedUntil', undefined);
  await user.save();
  const tokens = await createSession(user.id, user.role, client);
  await recordAudit('auth.login', {
    actorId: user.id,
    ipAddress: client.ipAddress,
    userAgent: client.userAgent,
  });
  return { user: user.toJSON(), ...tokens };
}
export async function refresh(compoundToken: string, client: Client) {
  const [id, raw] = compoundToken.split('.');
  if (!id || !raw) throw new HttpError(401, 'REFRESH_INVALID', 'Refresh session is invalid.');
  const session = await Session.findById(id);
  if (
    !session ||
    session.expiresAt <= new Date() ||
    session.revokedAt ||
    session.tokenHash !== hashToken(raw)
  ) {
    if (session)
      await Session.updateMany({ familyId: session.familyId }, { revokedAt: new Date() });
    throw new HttpError(401, 'REFRESH_INVALID', 'Refresh session is invalid or expired.');
  }
  const user = await User.findById(session.userId);
  if (!user || user.deletedAt)
    throw new HttpError(401, 'REFRESH_INVALID', 'Account is unavailable.');
  const nextRaw = randomToken();
  session.tokenHash = hashToken(nextRaw);
  session.lastUsedAt = new Date();
  if (client.userAgent) session.userAgent = client.userAgent;
  if (client.ipAddress) session.ipAddress = client.ipAddress;
  await session.save();
  return {
    accessToken: accessToken(user.id, session.id, user.role),
    refreshToken: `${session.id}.${nextRaw}`,
    expiresAt: session.expiresAt,
    user: user.toJSON(),
  };
}
export async function verifyEmail(token: string) {
  const action = await ActionToken.findOne({
    tokenHash: hashToken(token),
    type: 'email_verification',
    usedAt: null,
    expiresAt: { $gt: new Date() },
  });
  if (!action)
    throw new HttpError(400, 'TOKEN_INVALID', 'Verification link is invalid or expired.');
  await Promise.all([
    User.findByIdAndUpdate(action.userId, { emailVerifiedAt: new Date() }),
    ActionToken.findByIdAndUpdate(action.id, { usedAt: new Date() }),
  ]);
  return { message: 'Email verified successfully.' };
}
export async function forgotPassword(email: string) {
  const user = await User.findOne({ email: email.toLowerCase(), deletedAt: null });
  if (user) {
    const raw = randomToken();
    await ActionToken.create({
      userId: user.id,
      tokenHash: hashToken(raw),
      type: 'password_reset',
      expiresAt: new Date(Date.now() + 3600000),
    });
    await sendActionEmail(
      user.email,
      'Reset your ResuMind AI password',
      `${env.WEB_URL}/reset-password?token=${raw}`,
    );
  }
  return { message: 'If the email exists, a reset link has been sent.' };
}
export async function resetPassword(token: string, password: string) {
  const action = await ActionToken.findOne({
    tokenHash: hashToken(token),
    type: 'password_reset',
    usedAt: null,
    expiresAt: { $gt: new Date() },
  });
  if (!action) throw new HttpError(400, 'TOKEN_INVALID', 'Reset link is invalid or expired.');
  const passwordHash = await bcrypt.hash(password, env.PASSWORD_BCRYPT_ROUNDS);
  await Promise.all([
    User.findByIdAndUpdate(action.userId, {
      passwordHash,
      failedLoginAttempts: 0,
      $unset: { lockedUntil: 1 },
    }),
    ActionToken.findByIdAndUpdate(action.id, { usedAt: new Date() }),
    Session.updateMany({ userId: action.userId, revokedAt: null }, { revokedAt: new Date() }),
  ]);
  return { message: 'Password reset successfully. Please sign in.' };
}
