import { Schema, model } from 'mongoose';
const schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    resumeId: { type: Schema.Types.ObjectId, ref: 'Resume', required: true, index: true },
    format: { type: String, enum: ['pdf', 'docx'], required: true },
    operationType: { type: String, default: 'export' },
    status: {
      type: String,
      enum: ['queued', 'processing', 'ready', 'failed', 'cancelled', 'expired'],
      default: 'queued',
      index: true,
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    currentStep: { type: String, default: 'queued' },
    attempts: { type: Number, default: 0 },
    idempotencyKey: { type: String, required: true },
    payloadHash: { type: String, required: true },
    leaseUntil: Date,
    startedAt: Date,
    completedAt: Date,
    filename: String,
    data: Buffer,
    mimeType: String,
    errorCode: String,
    safeErrorMessage: String,
  },
  { timestamps: true },
);
schema.index({ userId: 1, resumeId: 1, createdAt: -1 });
schema.index({ userId: 1, resumeId: 1, format: 1, idempotencyKey: 1 }, { unique: true });
schema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });
export const ResumeExport = model('ResumeExport', schema);
