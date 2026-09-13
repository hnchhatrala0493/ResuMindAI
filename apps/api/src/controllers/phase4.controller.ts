import type { RequestHandler } from 'express';
import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { ResumeImport } from '../models/resume-import.model.js';
import { ResumeShareLink } from '../models/resume-share-link.model.js';
import { ResumeExport } from '../models/resume-export.model.js';
import { ResumeVersion } from '../models/resume-version.model.js';
import { ResumeModel } from '../models/resume.model.js';
import * as resumes from '../services/resume.service.js';
import { updateResumeSchema } from '@resumind/shared';
import { findTemplate, assertAccess } from '../services/template.service.js';
import { HttpError } from '../utilities/http-error.js';
import { scanUpload } from '../services/malware-scanner.service.js';
import { kickExportWorker, waitForExport } from '../services/export-job.service.js';
import { kickImportWorker } from '../services/import-job.service.js';
import { ResumeShareView } from '../models/resume-share-view.model.js';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
const hash = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
const safeName = (v: string, ext: string) =>
  `${
    v
      .replace(/[^a-z0-9_-]+/gi, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 80) || 'Resume'
  }.${ext}`;
const ownedImport = async (userId: string, id: string) => {
  const x = await ResumeImport.findOne({ _id: id, userId });
  if (!x) throw new HttpError(404, 'IMPORT_NOT_FOUND', 'Resume import was not found.');
  return x;
};
export const createImport: RequestHandler = async (req, res) => {
  if (!req.file) throw new HttpError(400, 'FILE_REQUIRED', 'Choose a PDF or DOCX file.');
  const ext = req.file.originalname.toLowerCase().endsWith('.pdf')
    ? 'pdf'
    : req.file.originalname.toLowerCase().endsWith('.docx')
      ? 'docx'
      : null;
  if (!ext) throw new HttpError(415, 'UNSUPPORTED_FILE', 'Only PDF and DOCX files are supported.');
  const pdf = req.file.buffer.subarray(0, 5).toString() === '%PDF-';
  const docx = req.file.buffer[0] === 0x50 && req.file.buffer[1] === 0x4b;
  if (
    (ext === 'pdf' && (!pdf || req.file.mimetype !== 'application/pdf')) ||
    (ext === 'docx' &&
      (!docx ||
        ![
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/octet-stream',
        ].includes(req.file.mimetype)))
  )
    throw new HttpError(
      415,
      'FILE_SIGNATURE_MISMATCH',
      'The file content does not match its extension and MIME type.',
    );
  await scanUpload(req.file.buffer, { extension: ext, size: req.file.size });
  const idempotencyKey = String(req.get('idempotency-key') || hash(req.file.buffer)).slice(0, 200);
  let x = await ResumeImport.findOne({ userId: req.auth!.userId, idempotencyKey });
  if (!x)
    x = await ResumeImport.create({
      userId: req.auth!.userId,
      status: 'queued',
      originalName: safeName(req.file.originalname.replace(/\.(pdf|docx)$/i, ''), ext),
      fileType: ext,
      extractedText: '',
      parsedData: {},
      confidence: {},
      rawFile: req.file.buffer,
      idempotencyKey,
      expiresAt: new Date(Date.now() + 24 * 3600_000),
    });
  kickImportWorker();
  res.status(x.status === 'queued' ? 202 : 200).json({ success: true, data: x });
};
export const getImport: RequestHandler = async (req, res) => {
  const item = await ownedImport(req.auth!.userId, String(req.params.importId));
  if (
    item.status === 'queued' ||
    (item.status === 'processing' && item.leaseUntil && item.leaseUntil <= new Date())
  )
    kickImportWorker();
  res.json({ success: true, data: item });
};
export const updateImport: RequestHandler = async (req, res) => {
  const x = await ownedImport(req.auth!.userId, String(req.params.importId));
  if (x.status !== 'review_required')
    throw new HttpError(409, 'IMPORT_NOT_REVIEWABLE', 'This import can no longer be changed.');
  x.parsedData = updateResumeSchema.parse(req.body);
  await x.save();
  res.json({ success: true, data: x });
};
export const confirmImport: RequestHandler = async (req, res) => {
  const x = await ownedImport(req.auth!.userId, String(req.params.importId));
  if (x.resumeId)
    return res.json({
      success: true,
      data: { resume: await resumes.get(req.auth!.userId, String(x.resumeId)), idempotent: true },
    });
  const d = x.parsedData as Record<string, unknown>;
  const r = await resumes.create(req.auth!.userId, {
    title: String(d.title || 'Imported Resume'),
    templateId: String(d.templateId || 'modern-classic') as 'modern-classic',
  });
  await resumes.update(req.auth!.userId, r.id, updateResumeSchema.parse(d), false);
  x.resumeId = r._id;
  x.status = 'confirmed';
  x.confirmedAt = new Date();
  await x.save();
  await ResumeVersion.create({
    resumeId: r._id,
    userId: req.auth!.userId,
    versionNumber: 1,
    snapshot: (await resumes.get(req.auth!.userId, r.id)).toObject(),
    changeSource: 'import',
    changeSummary: 'Resume imported and confirmed',
    schemaVersion: 1,
    actorId: req.auth!.userId,
  });
  res.status(201).json({
    success: true,
    data: { resume: await resumes.get(req.auth!.userId, r.id), idempotent: false },
  });
};
export const cancelImport: RequestHandler = async (req, res) => {
  const x = await ownedImport(req.auth!.userId, String(req.params.importId));
  x.status = 'cancelled';
  x.extractedText = '';
  x.rawFile = null;
  x.completedAt = new Date();
  x.leaseUntil = null;
  await x.save();
  res.status(204).send();
};
export const listVersions: RequestHandler = async (req, res) => {
  await resumes.get(req.auth!.userId, String(req.params.resumeId));
  const data = await ResumeVersion.find({ resumeId: req.params.resumeId, userId: req.auth!.userId })
    .select('-snapshot')
    .sort({ versionNumber: -1 })
    .limit(50)
    .lean();
  res.json({ success: true, data });
};
export const getVersion: RequestHandler = async (req, res) => {
  await resumes.get(req.auth!.userId, String(req.params.resumeId));
  const x = await ResumeVersion.findOne({
    _id: req.params.versionId,
    resumeId: req.params.resumeId,
    userId: req.auth!.userId,
  });
  if (!x) throw new HttpError(404, 'VERSION_NOT_FOUND', 'Resume version was not found.');
  res.json({ success: true, data: x });
};
export const restoreVersion: RequestHandler = async (req, res) => {
  const current = await resumes.get(req.auth!.userId, String(req.params.resumeId));
  const target = await ResumeVersion.findOne({
    _id: req.params.versionId,
    resumeId: current._id,
    userId: req.auth!.userId,
  });
  if (!target) throw new HttpError(404, 'VERSION_NOT_FOUND', 'Resume version was not found.');
  const n = await ResumeVersion.countDocuments({ resumeId: current._id });
  await ResumeVersion.create({
    resumeId: current._id,
    userId: req.auth!.userId,
    versionNumber: n + 1,
    snapshot: current.toObject(),
    changeSource: 'restore-safety',
    changeSummary: 'Safety snapshot before restore',
    actorId: req.auth!.userId,
  });
  const snapshot = updateResumeSchema.parse(target.snapshot);
  const restored = await resumes.update(req.auth!.userId, current.id, snapshot, false);
  res.json({ success: true, data: restored });
};
export const createShare: RequestHandler = async (req, res) => {
  const r = await resumes.get(req.auth!.userId, String(req.params.resumeId));
  const body = z
    .object({
      confirmed: z.literal(true),
      password: z.string().min(8).max(100).optional(),
      expiresAt: z.coerce
        .date()
        .refine((x) => x > new Date())
        .optional(),
      downloadAllowed: z.boolean().default(false),
      searchIndexing: z.boolean().default(false),
    })
    .parse(req.body);
  const token = randomBytes(32).toString('base64url');
  const x = await ResumeShareLink.create({
    userId: req.auth!.userId,
    resumeId: r._id,
    tokenHash: hash(token),
    passwordHash: body.password ? await bcrypt.hash(body.password, 12) : null,
    expiresAt: body.expiresAt,
    downloadAllowed: body.downloadAllowed,
    searchIndexing: body.searchIndexing,
  });
  res.status(201).json({
    success: true,
    data: {
      ...x.toObject(),
      token,
      url: `/r/${token}`,
      passwordHash: undefined,
      tokenHash: undefined,
    },
  });
};
export const listShares: RequestHandler = async (req, res) => {
  await resumes.get(req.auth!.userId, String(req.params.resumeId));
  const data = await ResumeShareLink.find({
    userId: req.auth!.userId,
    resumeId: req.params.resumeId,
  })
    .select('-tokenHash -passwordHash')
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  res.json({ success: true, data });
};
export const updateShare: RequestHandler = async (req, res) => {
  await resumes.get(req.auth!.userId, String(req.params.resumeId));
  const body = z
    .object({
      active: z.boolean().optional(),
      password: z.union([z.string().min(8).max(100), z.literal('')]).optional(),
      expiresAt: z.coerce.date().nullable().optional(),
      downloadAllowed: z.boolean().optional(),
      searchIndexing: z.boolean().optional(),
    })
    .parse(req.body);
  const x = await ResumeShareLink.findOne({
    _id: req.params.linkId,
    userId: req.auth!.userId,
    resumeId: req.params.resumeId,
  });
  if (!x) throw new HttpError(404, 'SHARE_NOT_FOUND', 'Share link was not found.');
  if (body.password !== undefined)
    x.passwordHash = body.password ? await bcrypt.hash(body.password, 12) : null;
  Object.assign(x, { ...body, password: undefined });
  x.credentialVersion = (x.credentialVersion ?? 1) + 1;
  await x.save();
  res.json({
    success: true,
    data: { ...x.toObject(), passwordHash: undefined, tokenHash: undefined },
  });
};
export const revokeShare: RequestHandler = async (req, res) => {
  const x = await ResumeShareLink.findOne({
    _id: req.params.linkId,
    userId: req.auth!.userId,
    resumeId: req.params.resumeId,
  });
  if (!x) throw new HttpError(404, 'SHARE_NOT_FOUND', 'Share link was not found.');
  x.active = false;
  x.revokedAt = new Date();
  x.credentialVersion = (x.credentialVersion ?? 1) + 1;
  await x.save();
  res.status(204).send();
};
async function publicLink(token: string) {
  const x = await ResumeShareLink.findOne({ tokenHash: hash(token) });
  if (!x) throw new HttpError(404, 'SHARE_NOT_FOUND', 'This resume link is invalid.');
  if (!x.active || x.revokedAt)
    throw new HttpError(410, 'SHARE_REVOKED', 'This resume link has been revoked.');
  if (x.expiresAt && x.expiresAt <= new Date())
    throw new HttpError(410, 'SHARE_EXPIRED', 'This resume link has expired.');
  return x;
}
async function countView(
  x: InstanceType<typeof ResumeShareLink>,
  req: Parameters<RequestHandler>[0],
  res: Parameters<RequestHandler>[1],
) {
  let visitor = req.cookies.resumind_visitor as string | undefined;
  if (!visitor) {
    visitor = randomBytes(18).toString('base64url');
    res.cookie('resumind_visitor', visitor, {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.COOKIE_SECURE,
      maxAge: 365 * 86400_000,
    });
  }
  const windowMs = env.PUBLIC_VIEW_DEDUPE_MINUTES * 60_000,
    bucket = Math.floor(Date.now() / windowMs);
  try {
    await ResumeShareView.create({
      shareLinkId: x._id,
      visitorHash: hash(`${visitor}:${env.JWT_REFRESH_SECRET}`),
      bucket,
      expiresAt: new Date(Date.now() + windowMs * 2),
    });
    x.viewCount += 1;
    x.lastViewedAt = new Date();
    await x.save();
  } catch (error) {
    if (!(error instanceof Error && 'code' in error && (error as { code?: number }).code === 11000))
      throw error;
  }
}
function unlockClaims(req: Parameters<RequestHandler>[0], x: InstanceType<typeof ResumeShareLink>) {
  const raw = req.cookies[`resumind_share_${x.id}`] as string | undefined;
  if (!raw) return false;
  try {
    const c = jwt.verify(raw, env.JWT_REFRESH_SECRET) as {
      sub: string;
      scope: string;
      version: number;
    };
    return (
      c.sub === x.id && c.scope === 'share-download' && c.version === (x.credentialVersion ?? 1)
    );
  } catch {
    return false;
  }
}
export const publicResume: RequestHandler = async (req, res) => {
  const x = await publicLink(String(req.params.token));
  if (x.passwordHash && !unlockClaims(req, x))
    throw new HttpError(401, 'SHARE_PASSWORD_REQUIRED', 'Enter the password to view this resume.');
  const resume = await ResumeModel.findOne({ _id: x.resumeId, deletedAt: null }).select(
    '-userId -deletedAt -__v',
  );
  if (!resume) throw new HttpError(404, 'RESUME_NOT_FOUND', 'Resume was not found.');
  await countView(x, req, res);
  res.json({
    success: true,
    data: { resume, downloadAllowed: x.downloadAllowed, searchIndexing: x.searchIndexing },
  });
};
export const unlockShare: RequestHandler = async (req, res) => {
  const x = await publicLink(String(req.params.token));
  const password = z.object({ password: z.string().max(100) }).parse(req.body).password;
  if (!x.passwordHash || !(await bcrypt.compare(password, x.passwordHash)))
    throw new HttpError(401, 'SHARE_PASSWORD_INVALID', 'The credentials are incorrect.');
  const credential = jwt.sign(
    { scope: 'share-download', version: x.credentialVersion ?? 1 },
    env.JWT_REFRESH_SECRET,
    { subject: x.id, expiresIn: `${env.SHARE_UNLOCK_TTL_MINUTES}m` },
  );
  res.cookie(`resumind_share_${x.id}`, credential, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.COOKIE_SECURE,
    maxAge: env.SHARE_UNLOCK_TTL_MINUTES * 60_000,
    path: '/api/v1/public/resumes',
  });
  const resume = await ResumeModel.findOne({ _id: x.resumeId, deletedAt: null }).select(
    '-userId -deletedAt -__v',
  );
  await countView(x, req, res);
  res.json({
    success: true,
    data: { resume, downloadAllowed: x.downloadAllowed, searchIndexing: x.searchIndexing },
  });
};
export function legacyTestHtml(r: InstanceType<typeof ResumeModel>) {
  const p = r.personalDetails as Record<string, string>;
  const esc = (s: unknown) =>
    String(s ?? '').replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
    );
  const section = (title: string, value: unknown) =>
    value ? `<section><h2>${title}</h2><p>${esc(value)}</p></section>` : '';
  return `<!doctype html><style>@page{size:${r.styling.pageSize === 'LETTER' ? 'Letter' : 'A4'};margin:${Number(r.styling.pageMargin) || 18}mm}body{font-family:${esc(r.styling.fontFamily)},Arial;color:${esc(r.styling.textColor)};font-size:${Number(r.styling.fontSize) || 10}pt;line-height:${Number(r.styling.lineHeight) || 1.45}}h1,h2{color:${esc(r.styling.headingColor || r.styling.primaryColor)}}h2{border-bottom:1px solid ${esc(r.styling.primaryColor)}}a{color:inherit}</style><h1>${esc(p.firstName)} ${esc(p.lastName)}</h1><p>${esc(p.email)} · ${esc(p.phone)}</p>${section('Profile', r.professionalSummary)}${r.sectionOrder
    .map((k) => {
      const v = (r as unknown as Record<string, unknown>)[k];
      return Array.isArray(v) && v.length
        ? `<section><h2>${esc(k.replace(/([A-Z])/g, ' $1'))}</h2>${v
            .filter((x: { visible?: boolean }) => x.visible !== false)
            .map(
              (x: Record<string, unknown>) =>
                `<div><strong>${esc(x.jobTitle || x.degree || x.name || x.title || x.role)}</strong><p>${esc(x.company || x.institution || x.organization || x.description || x.content)}</p></div>`,
            )
            .join('')}</section>`
        : '';
    })
    .join('')}`;
}
export const publicDownload: RequestHandler = async (req, res) => {
  const x = await publicLink(String(req.params.token));
  if (!x.downloadAllowed)
    throw new HttpError(403, 'DOWNLOAD_DISABLED', 'Downloads are disabled for this share link.');
  if (x.passwordHash && !unlockClaims(req, x))
    throw new HttpError(401, 'SHARE_PASSWORD_REQUIRED', 'Unlock the resume before downloading.');
  const r = await ResumeModel.findOne({ _id: x.resumeId, deletedAt: null });
  if (!r) throw new HttpError(404, 'RESUME_NOT_FOUND', 'Resume was not found.');
  const t = findTemplate(r.templateId);
  if (!t) throw new HttpError(404, 'TEMPLATE_NOT_FOUND', 'Template was not found.');
  await assertAccess(String(x.userId), t);
  const job = await ResumeExport.create({
    userId: x.userId,
    resumeId: r._id,
    format: 'pdf',
    status: 'queued',
    filename: safeName(r.title, 'pdf'),
    idempotencyKey: `public-${randomBytes(16).toString('hex')}`,
    payloadHash: hash(`${r.id}:${r.updatedAt.getTime()}:pdf`),
  });
  kickExportWorker();
  const completed = await waitForExport(job.id);
  if (!completed || completed.status !== 'ready' || !completed.data)
    throw new HttpError(503, 'EXPORT_FAILED', 'The document renderer is temporarily unavailable.');
  const pdf = completed.data;
  x.downloadCount += 1;
  x.lastDownloadedAt = new Date();
  await x.save();
  res.setHeader('content-type', 'application/pdf');
  res.setHeader('content-disposition', `attachment; filename="${safeName(r.title, 'pdf')}"`);
  res.send(pdf);
};
export const createExport: RequestHandler = async (req, res) => {
  const format = String(req.params.format);
  if (!['pdf', 'docx'].includes(format))
    throw new HttpError(415, 'EXPORT_FORMAT_INVALID', 'Unsupported export format.');
  const r = await resumes.get(req.auth!.userId, String(req.params.resumeId));
  const t = findTemplate(r.templateId);
  if (!t) throw new HttpError(404, 'TEMPLATE_NOT_FOUND', 'Template was not found.');
  await assertAccess(req.auth!.userId, t);
  const filename = safeName(
    `${(r.personalDetails as Record<string, string>).firstName || r.title}_Resume`,
    format,
  );
  const idempotencyKey = String(
    req.get('idempotency-key') || randomBytes(16).toString('hex'),
  ).slice(0, 200);
  const payloadHash = hash(
    JSON.stringify({
      format,
      resumeId: r.id,
      templateId: r.templateId,
      styling: r.styling,
      updatedAt: r.updatedAt,
    }),
  );
  const existing = await ResumeExport.findOne({
    userId: req.auth!.userId,
    resumeId: r._id,
    format,
    idempotencyKey,
  });
  if (existing) {
    if (existing.payloadHash !== payloadHash)
      throw new HttpError(
        409,
        'IDEMPOTENCY_CONFLICT',
        'This idempotency key was already used for different export settings.',
      );
    return res.json({
      success: true,
      data: {
        _id: existing._id,
        status: existing.status,
        format,
        filename: existing.filename,
        idempotent: true,
      },
    });
  }
  let job;
  try {
    job = await ResumeExport.create({
      userId: req.auth!.userId,
      resumeId: r._id,
      format,
      status: 'queued',
      filename,
      idempotencyKey,
      payloadHash,
      progress: 0,
      currentStep: 'queued',
      attempts: 0,
    });
  } catch (error) {
    if (!(error instanceof Error && 'code' in error && (error as { code?: number }).code === 11000))
      throw error;
    job = await ResumeExport.findOne({
      userId: req.auth!.userId,
      resumeId: r._id,
      format,
      idempotencyKey,
    });
    if (!job) throw error;
    if (job.payloadHash !== payloadHash)
      throw new HttpError(
        409,
        'IDEMPOTENCY_CONFLICT',
        'This idempotency key was already used for different export settings.',
      );
  }
  kickExportWorker();
  res.status(202).json({
    success: true,
    data: {
      _id: job._id,
      status: job.status,
      format,
      filename: job.filename,
      idempotent: job.createdAt.getTime() !== job.updatedAt.getTime(),
    },
  });
};
export const getExport: RequestHandler = async (req, res) => {
  const x = await ResumeExport.findOne({
    _id: req.params.exportId,
    userId: req.auth!.userId,
    resumeId: req.params.resumeId,
  });
  if (!x) throw new HttpError(404, 'EXPORT_NOT_FOUND', 'Export was not found.');
  if (
    x.status === 'queued' ||
    (x.status === 'processing' && x.leaseUntil && x.leaseUntil <= new Date())
  )
    kickExportWorker();
  if (req.query.download === 'true' && x.status === 'ready' && x.data) {
    res.setHeader('content-type', x.mimeType!);
    res.setHeader('content-disposition', `attachment; filename="${x.filename}"`);
    return res.send(x.data);
  }
  res.json({
    success: true,
    data: {
      _id: x._id,
      status: x.status,
      format: x.format,
      filename: x.filename,
      errorCode: x.errorCode,
      safeErrorMessage: x.safeErrorMessage,
      progress: x.progress,
      currentStep: x.currentStep,
      attempts: x.attempts,
    },
  });
};

type RenderClaims = { sub: string; scope: string; resumeId: string; userId: string };
export const internalRender: RequestHandler = async (req, res) => {
  const body = z
    .object({ resumeId: z.string(), token: z.string().min(20).max(2000) })
    .parse(req.body);
  let claims: RenderClaims;
  try {
    claims = jwt.verify(body.token, env.JWT_REFRESH_SECRET) as RenderClaims;
  } catch {
    throw new HttpError(
      401,
      'RENDER_CREDENTIAL_INVALID',
      'The render credential is invalid or expired.',
    );
  }
  if (claims.scope !== 'resume-pdf-render' || claims.resumeId !== body.resumeId)
    throw new HttpError(
      403,
      'RENDER_CREDENTIAL_FORBIDDEN',
      'The render credential cannot access this document.',
    );
  const job = await ResumeExport.findOne({
    _id: claims.sub,
    resumeId: body.resumeId,
    userId: claims.userId,
    status: 'processing',
  });
  if (!job)
    throw new HttpError(
      401,
      'RENDER_CREDENTIAL_INVALID',
      'The render credential is invalid or expired.',
    );
  const resume = await ResumeModel.findOne({
    _id: body.resumeId,
    userId: claims.userId,
    deletedAt: null,
  });
  if (!resume) throw new HttpError(404, 'RESUME_NOT_FOUND', 'Resume was not found.');
  res.setHeader('cache-control', 'no-store');
  res.json({ success: true, data: resume });
};

export async function legacyRenderPdf(
  r: InstanceType<typeof ResumeModel>,
  job: InstanceType<typeof ResumeExport>,
) {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    if (env.NODE_ENV === 'test')
      await page.setContent(legacyTestHtml(r), {
        waitUntil: 'load',
        timeout: env.EXPORT_RENDER_TIMEOUT_MS,
      });
    else {
      const credential = jwt.sign(
        { scope: 'resume-pdf-render', resumeId: r.id, userId: String(job.userId) },
        env.JWT_REFRESH_SECRET,
        { subject: job.id, expiresIn: '2m' },
      );
      const webOrigin = new URL(env.WEB_URL).origin,
        apiOrigin = `http://localhost:${env.PORT}`;
      await page.route('**/*', (route) => {
        const url = route.request().url(),
          origin = new URL(url).origin;
        if (origin === webOrigin || origin === apiOrigin || url.startsWith('data:'))
          void route.continue();
        else void route.abort();
      });
      await page.goto(`${env.WEB_URL}/internal/resumes/${r.id}/print#${credential}`, {
        waitUntil: 'domcontentloaded',
        timeout: env.EXPORT_RENDER_TIMEOUT_MS,
      });
      await page.waitForFunction(() => document.documentElement.dataset.renderReady === 'true', {
        timeout: env.EXPORT_RENDER_TIMEOUT_MS,
      });
    }
    return await page.pdf({
      format: r.styling.pageSize === 'LETTER' ? 'Letter' : 'A4',
      printBackground: true,
      preferCSSPageSize: true,
    });
  } finally {
    await browser.close();
  }
}
