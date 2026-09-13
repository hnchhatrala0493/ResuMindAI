/* eslint-disable @typescript-eslint/no-explicit-any */
import type { RequestHandler } from 'express';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { ATSAnalysis } from '../models/ats-analysis.model.js';
import { AISuggestion } from '../models/ai-suggestion.model.js';
import { ResumeVersion } from '../models/resume-version.model.js';
import { scoreResume } from '../services/ats-scoring.service.js';
import * as resumes from '../services/resume.service.js';
import { HttpError } from '../utilities/http-error.js';
const analyzeSchema = z.object({
  jobDescription: z.string().trim().max(20000).optional(),
  mode: z.enum(['deterministic', 'enhanced']).default('deterministic'),
});
const page = z.coerce.number().int().min(1).default(1),
  limit = z.coerce.number().int().min(1).max(50).default(20);
export const analyze: RequestHandler = async (req, res) => {
  const input = analyzeSchema.parse(req.body),
    r = await resumes.get(req.auth!.userId, String(req.params.resumeId)),
    result = scoreResume(r, input.jobDescription),
    hash = createHash('sha256')
      .update(JSON.stringify(r.toObject()) + (input.jobDescription ?? ''))
      .digest('hex');
  const doc = await ATSAnalysis.create({
    userId: req.auth!.userId,
    resumeId: r.id,
    overallScore: result.overallScore,
    deterministicScore: result.overallScore,
    scoreVersion: result.scoreVersion,
    categories: result.categories,
    strengths: result.strengths,
    issues: result.issues,
    suggestions: result.recommendations,
    missingKeywords: result.missingKeywords,
    matchedKeywords: result.matchedKeywords,
    overusedWords: result.overusedWords,
    weakVerbs: result.weakVerbs,
    grammarObservations: result.grammarObservations,
    formattingObservations: result.formattingObservations,
    inputHash: hash,
    status: 'completed',
    providerMetadata:
      input.mode === 'enhanced'
        ? {
            warning:
              'Deterministic result returned; qualitative enhancement is available through writer actions.',
          }
        : undefined,
  });
  res.status(201).json({
    success: true,
    data: doc,
    disclaimer: 'Internal estimate; not an official employer ATS score.',
  });
};
export const latest: RequestHandler = async (req, res) => {
  await resumes.get(req.auth!.userId, String(req.params.resumeId));
  const x = await ATSAnalysis.findOne({
    userId: req.auth!.userId,
    resumeId: req.params.resumeId,
  }).sort({ createdAt: -1 });
  if (!x) throw new HttpError(404, 'ANALYSIS_NOT_FOUND', 'No analysis was found.');
  res.json({ success: true, data: x });
};
export const history: RequestHandler = async (req, res) => {
  await resumes.get(req.auth!.userId, String(req.params.resumeId));
  const p = page.parse(req.query.page),
    l = limit.parse(req.query.limit),
    filter = { userId: req.auth!.userId, resumeId: req.params.resumeId };
  const [data, total] = await Promise.all([
    ATSAnalysis.find(filter)
      .sort({ createdAt: -1 })
      .skip((p - 1) * l)
      .limit(l),
    ATSAnalysis.countDocuments(filter),
  ]);
  res.json({
    success: true,
    data,
    meta: { page: p, limit: l, total, pages: Math.ceil(total / l) },
  });
};
export const getAnalysis: RequestHandler = async (req, res) => {
  const x = await ATSAnalysis.findOne({ _id: req.params.analysisId, userId: req.auth!.userId });
  if (!x) throw new HttpError(404, 'ANALYSIS_NOT_FOUND', 'Analysis was not found.');
  await resumes.get(req.auth!.userId, String(x.resumeId));
  res.json({ success: true, data: x });
};
export const removeAnalysis: RequestHandler = async (req, res) => {
  const x = await ATSAnalysis.findOneAndDelete({
    _id: req.params.analysisId,
    userId: req.auth!.userId,
  });
  if (!x) throw new HttpError(404, 'ANALYSIS_NOT_FOUND', 'Analysis was not found.');
  res.status(204).send();
};
const allowed =
  /^(professionalSummary|workExperience\.[0-9]+\.(description|achievements\.[0-9]+)|projects\.[0-9]+\.description)$/;
export const applySuggestion: RequestHandler = async (req, res) => {
  const s = await AISuggestion.findOne({ _id: req.params.suggestionId, userId: req.auth!.userId });
  if (!s) throw new HttpError(404, 'SUGGESTION_NOT_FOUND', 'Suggestion was not found.');
  if (s.status !== 'pending')
    throw new HttpError(409, 'SUGGESTION_NOT_PENDING', 'Suggestion is no longer pending.');
  if (!allowed.test(s.fieldPath))
    throw new HttpError(400, 'SUGGESTION_TARGET_INVALID', 'Suggestion target is not editable.');
  const r = await resumes.get(req.auth!.userId, String(s.resumeId)),
    parts = s.fieldPath.split('.'),
    root = r.toObject() as any;
  let target = root;
  for (const part of parts.slice(0, -1)) {
    if (target[part] === undefined)
      throw new HttpError(409, 'STALE_SUGGESTION', 'The target no longer exists.');
    target = target[part];
  }
  const field = parts.at(-1)!;
  if (String(target[field] ?? '') !== s.originalText) {
    s.status = 'expired';
    await s.save();
    throw new HttpError(
      409,
      'STALE_SUGGESTION',
      'Resume content changed after this suggestion was created.',
    );
  }
  const n = await ResumeVersion.countDocuments({ resumeId: r.id });
  await ResumeVersion.create({
    resumeId: r.id,
    userId: r.userId,
    versionNumber: n + 1,
    snapshot: r.toObject(),
    changeSource: 'ai-suggestion',
  });
  target[field] =
    z.object({ replacement: z.string().max(5000).optional() }).parse(req.body).replacement ??
    s.suggestedReplacement;
  const updated = await resumes.update(req.auth!.userId, r.id, root, false);
  s.status = 'accepted';
  s.appliedAt = new Date();
  await s.save();
  res.json({ success: true, data: { resume: updated, suggestion: s, updatedSection: parts[0] } });
};
export const rejectSuggestion: RequestHandler = async (req, res) => {
  const s = await AISuggestion.findOne({
    _id: req.params.suggestionId,
    userId: req.auth!.userId,
    status: 'pending',
  });
  if (!s) throw new HttpError(404, 'SUGGESTION_NOT_FOUND', 'Pending suggestion was not found.');
  s.status = 'rejected';
  s.rejectedAt = new Date();
  await s.save();
  res.json({ success: true, data: s });
};
