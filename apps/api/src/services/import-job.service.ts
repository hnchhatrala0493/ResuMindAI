import { env } from '../config/env.js';
import { ResumeImport } from '../models/resume-import.model.js';
import { extractAndParse } from './resume-parser.service.js';
let scheduled = false;
export function kickImportWorker() {
  if (scheduled) return;
  scheduled = true;
  setImmediate(async () => {
    try {
      for (;;) {
        const now = new Date();
        const job = await ResumeImport.findOneAndUpdate(
          {
            $or: [{ status: 'queued' }, { status: 'processing', leaseUntil: { $lte: now } }],
            rawFile: { $exists: true, $ne: null },
          },
          {
            $set: {
              status: 'processing',
              progress: 20,
              currentStep: 'extracting',
              leaseUntil: new Date(Date.now() + env.IMPORT_PARSE_TIMEOUT_MS + 5000),
              startedAt: now,
            },
            $inc: { attempts: 1 },
          },
          { new: true, sort: { createdAt: 1 } },
        );
        if (!job) break;
        try {
          const parsed = await extractAndParse({
            buffer: job.rawFile!,
            metadata: {
              extension: job.fileType as 'pdf' | 'docx',
              mime:
                job.fileType === 'pdf'
                  ? 'application/pdf'
                  : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              size: job.rawFile!.length,
            },
          });
          job.extractedText = parsed.text;
          job.parsedData = parsed.data;
          job.confidence = parsed.confidence;
          job.status = 'review_required';
          job.progress = 100;
          job.currentStep = 'review_required';
          job.completedAt = new Date();
          job.rawFile = null;
          job.leaseUntil = null;
          await job.save();
        } catch {
          job.status = 'failed';
          job.errorCode = 'IMPORT_PARSE_FAILED';
          job.safeErrorMessage = 'The document could not be parsed.';
          job.currentStep = 'failed';
          job.completedAt = new Date();
          job.rawFile = null;
          job.leaseUntil = null;
          await job.save();
        }
      }
    } finally {
      scheduled = false;
    }
  });
}
