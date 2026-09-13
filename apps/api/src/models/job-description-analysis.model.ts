import { Schema, model } from 'mongoose';
const schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    resumeId: { type: Schema.Types.ObjectId, ref: 'Resume', required: true, index: true },
    originalText: { type: String, required: true, maxlength: 20000 },
    jobTitle: String,
    companyName: String,
    targetCountry: String,
    normalizedJobTitle: String,
    requiredSkills: [String],
    preferredSkills: [String],
    responsibilities: [String],
    experienceRequirements: [String],
    educationRequirements: [String],
    toolsAndTechnologies: [String],
    importantKeywords: [String],
    matchedKeywords: [String],
    missingKeywords: [String],
    partiallyMatchedConcepts: [String],
    matchPercentage: { type: Number, min: 0, max: 100 },
    categories: Schema.Types.Mixed,
    warnings: [String],
    inputHash: { type: String, required: true },
  },
  { timestamps: true },
);
schema.index({ userId: 1, resumeId: 1, createdAt: -1 });
export const JobDescriptionAnalysis = model('JobDescriptionAnalysis', schema);
