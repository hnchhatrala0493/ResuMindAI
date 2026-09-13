import { Schema, model } from 'mongoose';
const schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: {
      type: String,
      enum: [
        'queued',
        'processing',
        'review_required',
        'confirmed',
        'failed',
        'expired',
        'cancelled',
      ],
      required: true,
      index: true,
    },
    originalName: { type: String, required: true },
    operationType: { type: String, default: 'import' },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    currentStep: { type: String, default: 'queued' },
    attempts: { type: Number, default: 0 },
    idempotencyKey: { type: String, required: true },
    leaseUntil: Date,
    startedAt: Date,
    completedAt: Date,
    safeErrorMessage: String,
    rawFile: Buffer,
    fileType: { type: String, enum: ['pdf', 'docx'], required: true },
    extractedText: { type: String, default:'', maxlength: 200000 },
    parsedData: { type: Schema.Types.Mixed, required: true },
    confidence: { type: Schema.Types.Mixed, default: {} },
    errorCode: String,
    resumeId: { type: Schema.Types.ObjectId, ref: 'Resume' },
    expiresAt: { type: Date, required: true },
    confirmedAt: Date,
  },
  { timestamps: true },
);
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
schema.index({ userId: 1, createdAt: -1 });
schema.index({ userId: 1, idempotencyKey: 1 }, { unique: true });
export const ResumeImport = model('ResumeImport', schema);
