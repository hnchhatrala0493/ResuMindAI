import { ResumeModel } from '../models/resume.model.js';
import { ResumeVersion } from '../models/resume-version.model.js';
import { HttpError } from '../utilities/http-error.js';
import type { z } from 'zod';
import type { HydratedDocument } from 'mongoose';
import type { ResumeDocument } from '../models/resume.model.js';
import type { createResumeSchema, listResumesSchema, updateResumeSchema } from '@resumind/shared';
type Create = z.infer<typeof createResumeSchema>;
type Update = z.infer<typeof updateResumeSchema>;
type List = z.infer<typeof listResumesSchema>;
export function completion(r: Record<string, unknown>) {
  const p = r.personalDetails as Record<string, string> | undefined;
  const arrays = (k: string) => Array.isArray(r[k]) && (r[k] as unknown[]).length > 0;
  const parts = [
    { k: 'personalDetails', v: p?.firstName && p?.lastName && p?.email, w: 15 },
    {
      k: 'professionalSummary',
      v: typeof r.professionalSummary === 'string' && r.professionalSummary.trim().length >= 80,
      w: 10,
    },
    { k: 'workExperience', v: arrays('workExperience'), w: 25 },
    { k: 'education', v: arrays('education'), w: 15 },
    { k: 'skills', v: Array.isArray(r.skills) && (r.skills as unknown[]).length >= 3, w: 15 },
    { k: 'projects', v: arrays('projects'), w: 10 },
    { k: 'certifications', v: arrays('certifications'), w: 5 },
    {
      k: 'other',
      v:
        arrays('languages') ||
        arrays('achievements') ||
        arrays('volunteerExperience') ||
        arrays('customSections'),
      w: 5,
    },
  ];
  const completed = parts.filter((x) => x.v).map((x) => x.k);
  const incomplete = parts.filter((x) => !x.v).map((x) => x.k);
  return {
    percentage: parts.filter((x) => x.v).reduce((n, x) => n + x.w, 0),
    completedSections: completed,
    incompleteSections: incomplete,
    recommendedNextSection: incomplete[0] ?? null,
  };
}
function ifMissing<T>(value: T | null): T {
  if (!value) throw new HttpError(404, 'RESUME_NOT_FOUND', 'Resume was not found.');
  return value;
}
export async function create(userId: string, input: Create) {
  return ResumeModel.create({
    userId,
    ...input,
    personalDetails: { firstName: '', lastName: '', email: '' },
    workExperience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    languages: [],
    achievements: [],
    volunteerExperience: [],
    customSections: [],
  });
}
export async function list(userId: string, q: List) {
  const filter: Record<string, unknown> = { userId, deletedAt: null };
  if (q.status) filter.status = q.status;
  if (q.templateId) filter.templateId = q.templateId;
  if (q.search)
    filter.title = { $regex: q.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
  const sort: Record<string, 1 | -1> = { [q.sort]: q.direction === 'asc' ? 1 : -1 };
  const [data, total] = await Promise.all([
    ResumeModel.find(filter)
      .select('-workExperience -education -projects -customSections')
      .sort(sort)
      .skip((q.page - 1) * q.limit)
      .limit(q.limit)
      .lean(),
    ResumeModel.countDocuments(filter),
  ]);
  return { data, meta: { page: q.page, limit: q.limit, total, pages: Math.ceil(total / q.limit) } };
}
export async function get(userId: string, id: string): Promise<HydratedDocument<ResumeDocument>> {
  const resume = await ResumeModel.findOne({ _id: id, userId, deletedAt: null });
  return ifMissing(resume);
}
async function version(r: InstanceType<typeof ResumeModel>, source: string) {
  const n = await ResumeVersion.countDocuments({ resumeId: r.id });
  await ResumeVersion.create({
    resumeId: r.id,
    userId: r.userId,
    versionNumber: n + 1,
    snapshot: r.toObject(),
    changeSource: source,
  });
}
export async function createVersion(userId: string, id: string, source: string, summary: string) {
  const r = await get(userId, id);
  const n = await ResumeVersion.countDocuments({ resumeId: r.id });
  return ResumeVersion.create({
    resumeId: r.id,
    userId: r.userId,
    versionNumber: n + 1,
    snapshot: r.toObject(),
    changeSource: source,
    changeSummary: summary,
    schemaVersion: 1,
    actorId: userId,
  });
}
export async function update(userId: string, id: string, input: Update, manual = false) {
  const r = await get(userId, id);
  Object.assign(r, input);
  const c = completion(r.toObject() as unknown as Record<string, unknown>);
  r.completionPercentage = c.percentage;
  r.lastSavedAt = new Date();
  await r.save();
  if (manual) await version(r, 'manual');
  return r;
}
export async function remove(userId: string, id: string) {
  const r = await get(userId, id);
  r.deletedAt = new Date();
  await r.save();
}
export async function duplicate(userId: string, id: string) {
  const r = await get(userId, id);
  const o = r.toObject() as unknown as Record<string, unknown>;
  delete o._id;
  delete o.createdAt;
  delete o.updatedAt;
  const copy = await ResumeModel.create({
    ...o,
    userId,
    title: `${r.title} Copy`,
    status: 'draft',
    deletedAt: undefined,
  });
  await version(copy, 'duplicate');
  return copy;
}
export async function status(userId: string, id: string, s: 'archived' | 'draft') {
  const r = await get(userId, id);
  r.status = s;
  await r.save();
  await version(r, s === 'archived' ? 'archive' : 'restore');
  return r;
}
export async function getCompletion(userId: string, id: string) {
  return completion((await get(userId, id)).toObject() as unknown as Record<string, unknown>);
}
