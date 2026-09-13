import { Schema, model, Types } from 'mongoose';
interface SessionDocument {
  userId: Types.ObjectId;
  tokenHash: string;
  familyId: string;
  userAgent?: string;
  ipAddress?: string;
  expiresAt: Date;
  revokedAt?: Date;
  lastUsedAt: Date;
  createdAt: Date;
}
const sessionSchema = new Schema<SessionDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    familyId: { type: String, required: true, index: true },
    userAgent: String,
    ipAddress: String,
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    revokedAt: Date,
    lastUsedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);
export const Session = model<SessionDocument>('Session', sessionSchema);
