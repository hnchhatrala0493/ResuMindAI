import { Schema, model } from 'mongoose';
const schema = new Schema(
  {
    resumeId: { type: Schema.Types.ObjectId, ref: 'Resume', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    versionNumber: { type: Number, required: true },
    snapshot: { type: Schema.Types.Mixed, required: true },
    changeSource: {
      type: String,
      enum: [
        'manual',
        'duplicate',
        'archive',
        'restore',
        'ai-suggestion',
        'template-change',
        'import',
        'restore-safety',
      ],
      required: true,
    },
    changeSummary: { type: String, default: 'Resume updated', maxlength: 300 },
    schemaVersion: { type: Number, default: 1 },
    actorId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
schema.index({ resumeId: 1, versionNumber: -1 }, { unique: true });
export const ResumeVersion = model('ResumeVersion', schema);
