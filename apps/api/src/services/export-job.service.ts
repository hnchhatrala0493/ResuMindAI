import jwt from 'jsonwebtoken';
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';
import { chromium } from 'playwright';
import { env } from '../config/env.js';
import { ExportSlot } from '../models/export-slot.model.js';
import { ResumeExport } from '../models/resume-export.model.js';
import { ResumeModel } from '../models/resume.model.js';

const leaseMs = () => env.EXPORT_RENDER_TIMEOUT_MS + 15_000;
let scheduled = false;

async function renderPdf(
  resume: InstanceType<typeof ResumeModel>,
  job: InstanceType<typeof ResumeExport>,
) {
  if (env.NODE_ENV === 'test')
    return Buffer.from('%PDF-1.4\n% ResuMind isolated renderer stub\n%%EOF');
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const credential = jwt.sign(
      { scope: 'resume-pdf-render', resumeId: resume.id, userId: String(job.userId) },
      env.JWT_REFRESH_SECRET,
      { subject: job.id, expiresIn: '2m' },
    );
    const allowed = new Set([new URL(env.WEB_URL).origin, `http://localhost:${env.PORT}`]);
    await page.route('**/*', async (route) => {
      const url = route.request().url();
      if (url.startsWith('data:') || allowed.has(new URL(url).origin)) await route.continue();
      else await route.abort();
    });
    await page.goto(`${env.WEB_URL}/internal/resumes/${resume.id}/print#${credential}`, {
      waitUntil: 'domcontentloaded',
      timeout: env.EXPORT_RENDER_TIMEOUT_MS,
    });
    await page.waitForFunction(() => document.documentElement.dataset.renderReady === 'true', {
      timeout: env.EXPORT_RENDER_TIMEOUT_MS,
    });
    return await page.pdf({
      format: resume.styling.pageSize === 'LETTER' ? 'Letter' : 'A4',
      printBackground: true,
      preferCSSPageSize: true,
    });
  } finally {
    await browser.close();
  }
}

async function renderDocx(resume: InstanceType<typeof ResumeModel>) {
  const p = resume.personalDetails as Record<string, string>;
  const children = [
    new Paragraph({
      text: `${p.firstName || ''} ${p.lastName || ''}`,
      heading: HeadingLevel.TITLE,
    }),
    new Paragraph({ children: [new TextRun(p.email || '')] }),
    new Paragraph({ text: 'Professional Summary', heading: HeadingLevel.HEADING_1 }),
    new Paragraph(String(resume.professionalSummary || '')),
  ];
  for (const key of resume.sectionOrder) {
    const values = (resume as unknown as Record<string, unknown>)[key];
    if (!Array.isArray(values) || !values.length) continue;
    children.push(
      new Paragraph({ text: key.replace(/([A-Z])/g, ' $1'), heading: HeadingLevel.HEADING_1 }),
    );
    for (const item of values as Record<string, unknown>[]) {
      if (item.visible === false) continue;
      children.push(
        new Paragraph({
          text: String(
            item.name ||
              item.title ||
              item.jobTitle ||
              item.degree ||
              item.role ||
              item.content ||
              '',
          ),
          bullet: { level: 0 },
        }),
      );
    }
  }
  return Packer.toBuffer(new Document({ sections: [{ properties: {}, children }] }));
}

async function complete(job: InstanceType<typeof ResumeExport>) {
  const resume = await ResumeModel.findOne({
    _id: job.resumeId,
    userId: job.userId,
    deletedAt: null,
  });
  if (!resume) throw new Error('resume unavailable');
  const data = job.format === 'pdf' ? await renderPdf(resume, job) : await renderDocx(resume);
  job.data = data;
  job.mimeType =
    job.format === 'pdf'
      ? 'application/pdf'
      : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  job.status = 'ready';
  job.progress = 100;
  job.currentStep = 'completed';
  job.completedAt = new Date();
  job.leaseUntil = null;
  await job.save();
}

async function drain(slotNumber: number) {
  const now = new Date();
  const slot = await ExportSlot.findOneAndUpdate(
    {
      slot: slotNumber,
      $or: [
        { leaseUntil: { $lte: now } },
        { leaseUntil: null },
        { leaseUntil: { $exists: false } },
      ],
    },
    { $set: { leaseUntil: new Date(Date.now() + leaseMs()) } },
    { new: true },
  );
  if (!slot) return;
  const job = await ResumeExport.findOneAndUpdate(
    { $or: [{ status: 'queued' }, { status: 'processing', leaseUntil: { $lte: now } }] },
    {
      $set: {
        status: 'processing',
        currentStep: 'rendering',
        progress: 10,
        leaseUntil: new Date(Date.now() + leaseMs()),
        startedAt: now,
      },
      $inc: { attempts: 1 },
    },
    { new: true, sort: { createdAt: 1 } },
  );
  if (!job) {
    await ExportSlot.updateOne({ _id: slot._id }, { $unset: { jobId: 1, leaseUntil: 1 } });
    return;
  }
  slot.jobId = job._id;
  await slot.save();
  try {
    await complete(job);
  } catch {
    job.status = 'failed';
    job.currentStep = 'failed';
    job.errorCode = 'RENDER_FAILED';
    job.safeErrorMessage = 'The document renderer is temporarily unavailable.';
    job.completedAt = new Date();
    job.leaseUntil = null;
    await job.save();
  } finally {
    await ExportSlot.updateOne({ _id: slot._id }, { $unset: { jobId: 1, leaseUntil: 1 } });
  }
  await drain(slotNumber);
}

export function kickExportWorker() {
  if (scheduled) return;
  scheduled = true;
  setImmediate(async () => {
    try {
      await Promise.all(
        Array.from({ length: env.EXPORT_MAX_CONCURRENT }, (_, slot) =>
          ExportSlot.updateOne({ slot }, { $setOnInsert: { slot } }, { upsert: true }),
        ),
      );
      await Promise.all(
        Array.from({ length: env.EXPORT_MAX_CONCURRENT }, (_, slot) => drain(slot)),
      );
    } finally {
      scheduled = false;
    }
  });
}

export async function waitForExport(
  jobId: string,
  timeoutMs = env.EXPORT_RENDER_TIMEOUT_MS + 20_000,
) {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    const job = await ResumeExport.findById(jobId);
    if (job?.status === 'ready' || job?.status === 'failed') return job;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return ResumeExport.findById(jobId);
}
