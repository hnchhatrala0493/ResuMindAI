import { Schema, model } from 'mongoose';
const schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    resumeId: { type: Schema.Types.ObjectId, ref: 'Resume', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    passwordHash: String,
    active: { type: Boolean, default: true, index: true },
    credentialVersion: { type: Number, default: 1, min: 1 },
    expiresAt: Date,
    downloadAllowed: { type: Boolean, default: false },
    searchIndexing: { type: Boolean, default: false },
    viewCount: { type: Number, default: 0 },
    downloadCount: { type: Number, default: 0 },
    lastViewedAt: Date,
    lastDownloadedAt: Date,
    revokedAt: Date,
  },
  { timestamps: true },
);
schema.index({ userId: 1, resumeId: 1, createdAt: -1 });
export const ResumeShareLink = model('ResumeShareLink', schema);
