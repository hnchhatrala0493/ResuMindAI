import { Schema, model } from 'mongoose';
import type { Role } from '@resumind/shared';

export interface UserDocument {
  name: string;
  email: string;
  passwordHash?: string;
  role: Role;
  emailVerifiedAt?: Date;
  failedLoginAttempts: number;
  lockedUntil?: Date;
  avatarUrl?: string;
  googleId?: string;
  plan: 'free' | 'pro';
  subscriptionStatus: 'inactive' | 'active' | 'trialing' | 'past_due' | 'cancelled';
  subscriptionExpiresAt?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
const userSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, select: false },
    role: { type: String, enum: ['super_admin', 'admin', 'user'], default: 'user', index: true },
    emailVerifiedAt: Date,
    failedLoginAttempts: { type: Number, default: 0, select: false },
    lockedUntil: { type: Date, select: false },
    avatarUrl: String,
    googleId: { type: String, unique: true, sparse: true, index: true },
    plan: { type: String, enum: ['free', 'pro'], default: 'free', index: true },
    subscriptionStatus: {
      type: String,
      enum: ['inactive', 'active', 'trialing', 'past_due', 'cancelled'],
      default: 'inactive',
    },
    subscriptionExpiresAt: Date,
    deletedAt: { type: Date, index: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        const safe = ret as Record<string, unknown>;
        delete safe.passwordHash;
        delete safe.failedLoginAttempts;
        delete safe.lockedUntil;
        delete safe.__v;
        return safe;
      },
    },
  },
);
export const User = model<UserDocument>('User', userSchema);
