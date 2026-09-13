import { Schema, model } from 'mongoose';
const schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    resumeId: { type: Schema.Types.ObjectId, ref: 'Resume', required: true, index: true },
    jobDescriptionAnalysisId: { type: Schema.Types.ObjectId, ref: 'JobDescriptionAnalysis' },
    overallScore: { type: Number, min: 0, max: 100, required: true },
    deterministicScore: { type: Number, min: 0, max: 100, required: true },
    aiQualitativeScore: Number,
    scoreVersion: { type: String, required: true, index: true },
    categories: { type: [Schema.Types.Mixed], default: [] },
    strengths: [String],
    issues: [Schema.Types.Mixed],
    suggestions: [Schema.Types.Mixed],
    missingKeywords: [String],
    matchedKeywords: [String],
    overusedWords: [String],
    weakVerbs: [String],
    grammarObservations: [String],
    formattingObservations: [String],
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'completed',
      index: true,
    },
    inputHash: { type: String, required: true },
    providerMetadata: Schema.Types.Mixed,
    tokenUsage: Schema.Types.Mixed,
    estimatedCost: Number,
  },
  { timestamps: true },
);
schema.index({ userId: 1, resumeId: 1, createdAt: -1 });
schema.index({ userId: 1, resumeId: 1, inputHash: 1, scoreVersion: 1 });
export const ATSAnalysis = model('ATSAnalysis', schema);
