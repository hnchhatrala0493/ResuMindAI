import type { RequestHandler } from 'express';
import { z } from 'zod';
import { applyTemplateSchema, stylingSchema, type ResumeContent } from '@resumind/shared';
import {
  templateRegistry,
  findTemplate,
  entitlement,
  assertAccess,
} from '../services/template.service.js';
import * as resumes from '../services/resume.service.js';
import { HttpError } from '../utilities/http-error.js';
const query = z.object({
  accessLevel: z.enum(['free', 'premium']).optional(),
  category: z.enum(['modern', 'professional', 'minimal', 'creative']).optional(),
  layout: z.enum(['single-column', 'two-column']).optional(),
  industry: z.string().max(80).optional(),
  atsFriendly: z.stringbool().optional(),
  featured: z.stringbool().optional(),
  search: z.string().max(100).optional(),
  sort: z.enum(['popular', 'newest', 'name']).default('popular'),
});
export const list: RequestHandler = async (req, res) => {
  const q = query.parse(req.query);
  let data = templateRegistry.filter(
    (t) =>
      t.active &&
      (!q.accessLevel || t.accessLevel === q.accessLevel) &&
      (!q.category || t.category === q.category) &&
      (!q.layout || t.layout === q.layout) &&
      (q.atsFriendly === undefined || t.atsFriendly === q.atsFriendly) &&
      (q.featured === undefined || t.featured === q.featured) &&
      (!q.industry ||
        t.recommendedFor.some((x) => x.toLowerCase().includes(q.industry!.toLowerCase()))) &&
      (!q.search || `${t.name} ${t.description}`.toLowerCase().includes(q.search.toLowerCase())),
  );
  data = [...data].sort(
    q.sort === 'name'
      ? (a, b) => a.name.localeCompare(b.name)
      : q.sort === 'newest'
        ? (a, b) => b.sortOrder - a.sortOrder
        : (a, b) => b.popular - a.popular,
  );
  res.json({ success: true, data });
};
export const get: RequestHandler = async (req, res) => {
  const t = findTemplate(String(req.params.templateId));
  if (!t || !t.active) throw new HttpError(404, 'TEMPLATE_NOT_FOUND', 'Template was not found.');
  res.json({ success: true, data: t });
};
export const access: RequestHandler = async (req, res) => {
  const t = findTemplate(String(req.params.templateId));
  if (!t || !t.active) throw new HttpError(404, 'TEMPLATE_NOT_FOUND', 'Template was not found.');
  const e = await entitlement(req.auth!.userId);
  res.json({
    success: true,
    data: {
      templateId: t.id,
      accessLevel: t.accessLevel,
      canApply: t.accessLevel === 'free' || e.premium,
      entitlement: e,
    },
  });
};
export const preview: RequestHandler = async (req, res) => {
  const body = z.object({ templateId: z.string() }).parse(req.body),
    r = await resumes.get(req.auth!.userId, String(req.params.resumeId)),
    t = findTemplate(body.templateId);
  if (!t || !t.active) throw new HttpError(404, 'TEMPLATE_NOT_FOUND', 'Template was not found.');
  const e = await entitlement(req.auth!.userId);
  res.json({
    success: true,
    data: { resume: r, template: t, canApply: t.accessLevel === 'free' || e.premium },
  });
};
export const apply: RequestHandler = async (req, res) => {
  const rawStyling = (req.body as { styling?: Record<string, unknown> }).styling;
  const body = applyTemplateSchema.parse(req.body),
    r = await resumes.get(req.auth!.userId, String(req.params.resumeId)),
    t = findTemplate(body.templateId);
  if (!t) throw new HttpError(404, 'TEMPLATE_NOT_FOUND', 'Template was not found.');
  if (!t.active)
    throw new HttpError(409, 'TEMPLATE_INACTIVE', 'Template is not currently available.');
  await assertAccess(req.auth!.userId, t);
  const parsedStyling = body.styling ? stylingSchema.partial().parse(body.styling) : {};
  const permitted: Record<string, unknown> = rawStyling
    ? Object.fromEntries(
        Object.keys(rawStyling).map((key) => [
          key,
          parsedStyling[key as keyof typeof parsedStyling],
        ]),
      )
    : {};
  if (typeof permitted.fontFamily === 'string' && !t.fonts.includes(permitted.fontFamily))
    throw new HttpError(400, 'STYLE_NOT_SUPPORTED', 'That font is not supported by this template.');
  if (typeof permitted.layout === 'string' && permitted.layout !== t.layout)
    throw new HttpError(
      400,
      'STYLE_NOT_SUPPORTED',
      'That layout is not supported by this template.',
    );
  const styling = stylingSchema.parse({ ...r.styling, ...t.defaultStyling, ...permitted });
  const updated = await resumes.update(
    req.auth!.userId,
    r.id,
    { templateId: t.id as ResumeContent['templateId'], styling },
    false,
  );
  await resumes.createVersion(
    req.auth!.userId,
    r.id,
    'template-change',
    `Template changed to ${t.name}`,
  );
  res.json({ success: true, data: { resume: updated, template: t } });
};
