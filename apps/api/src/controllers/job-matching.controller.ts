import type { RequestHandler } from 'express';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { JobDescriptionAnalysis } from '../models/job-description-analysis.model.js';
import { concepts, keywordMatch } from '../services/ats-scoring.service.js';
import * as resumes from '../services/resume.service.js';
import { HttpError } from '../utilities/http-error.js';
const schema = z.object({
  jobTitle: z.string().trim().max(160),
  companyName: z.string().trim().max(160).optional(),
  jobDescription: z.string().trim().min(50).max(20000),
  targetCountry: z.string().trim().max(80).optional(),
  aiEnhanced: z.boolean().default(false),
  consent: z.boolean().default(false),
});
export const analyze: RequestHandler = async (req, res) => {
  const b = schema.parse(req.body),
    r = await resumes.get(req.auth!.userId, String(req.params.resumeId));
  const match = keywordMatch(JSON.stringify(r.toObject()), b.jobDescription),
    lines = b.jobDescription
      .split(/\n|\./)
      .map((x) => x.trim())
      .filter(Boolean),
    required = lines
      .filter((x) => /required|must|minimum/i.test(x))
      .flatMap(concepts)
      .slice(0, 30),
    preferred = lines
      .filter((x) => /preferred|nice to have|bonus/i.test(x))
      .flatMap(concepts)
      .slice(0, 30);
  const doc = await JobDescriptionAnalysis.create({
    userId: req.auth!.userId,
    resumeId: r.id,
    originalText: b.jobDescription,
    jobTitle: b.jobTitle,
    companyName: b.companyName,
    targetCountry: b.targetCountry,
    normalizedJobTitle: b.jobTitle.toLowerCase(),
    requiredSkills: [...new Set(required)],
    preferredSkills: [...new Set(preferred)],
    importantKeywords: concepts(b.jobDescription).slice(0, 80),
    matchedKeywords: match.matched,
    missingKeywords: match.missing,
    matchPercentage: match.percentage,
    categories: {
      keywordCoverage: match.percentage,
      requiredSkills: required.length
        ? Math.round(
            (required.filter((x) => match.matched.includes(x)).length / required.length) * 100,
          )
        : null,
      preferredSkills: preferred.length
        ? Math.round(
            (preferred.filter((x) => match.matched.includes(x)).length / preferred.length) * 100,
          )
        : null,
    },
    warnings: b.aiEnhanced
      ? ['Deterministic matching completed; semantic enhancement was not required.']
      : [],
    inputHash: createHash('sha256')
      .update(r.id + b.jobDescription)
      .digest('hex'),
  });
  res.status(201).json({ success: true, data: doc });
};
export const history: RequestHandler = async (req, res) => {
  await resumes.get(req.auth!.userId, String(req.params.resumeId));
  res.json({
    success: true,
    data: await JobDescriptionAnalysis.find({
      userId: req.auth!.userId,
      resumeId: req.params.resumeId,
    })
      .sort({ createdAt: -1 })
      .limit(50),
  });
};
export const get: RequestHandler = async (req, res) => {
  const x = await JobDescriptionAnalysis.findOne({
    _id: req.params.analysisId,
    userId: req.auth!.userId,
  });
  if (!x) throw new HttpError(404, 'JOB_ANALYSIS_NOT_FOUND', 'Job analysis was not found.');
  res.json({ success: true, data: x });
};
