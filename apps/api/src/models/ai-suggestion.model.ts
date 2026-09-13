import { Schema, model } from 'mongoose';
const schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    resumeId: { type: Schema.Types.ObjectId, ref: 'Resume', required: true, index: true },
    analysisId: { type: Schema.Types.ObjectId, ref: 'ATSAnalysis' },
    suggestionType: String,
    severity: { type: String, enum: ['critical', 'high', 'medium', 'low'], default: 'medium' },
    resumeSection: String,
    nestedItemId: String,
    fieldPath: { type: String, required: true },
    problem: String,
    whyItMatters: String,
    originalText: { type: String, default: '' },
    suggestedReplacement: { type: String, required: true },
    expectedScoreImpact: Number,
    confidence: Number,
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'expired'],
      default: 'pending',
      index: true,
    },
    appliedAt: Date,
    rejectedAt: Date,
  },
  { timestamps: true },
);
schema.index({ userId: 1, resumeId: 1, status: 1 });
export const AISuggestion = model('AISuggestion', schema);
