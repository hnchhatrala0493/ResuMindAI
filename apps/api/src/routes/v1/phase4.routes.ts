import { Router } from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { authenticate, requireTrustedOrigin } from '../../middleware/auth.js';
import * as c from '../../controllers/phase4.controller.js';
import { env } from '../../config/env.js';
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.IMPORT_MAX_FILE_BYTES, files: 1 },
});
export const importRouter = Router();
importRouter.use(authenticate, rateLimit({ windowMs: 60_000, limit: 10 }));
importRouter.post('/',requireTrustedOrigin, upload.single('file'), c.createImport);
importRouter.get('/:importId', c.getImport);
importRouter.patch('/:importId',requireTrustedOrigin, c.updateImport);
importRouter.post('/:importId/confirm',requireTrustedOrigin, c.confirmImport);
importRouter.delete('/:importId',requireTrustedOrigin, c.cancelImport);
export const phase4ResumeRouter = Router();
phase4ResumeRouter.use(authenticate);
phase4ResumeRouter.get('/:resumeId/versions', c.listVersions);
phase4ResumeRouter.get('/:resumeId/versions/:versionId', c.getVersion);
phase4ResumeRouter.post(
  '/:resumeId/versions/:versionId/restore',
  requireTrustedOrigin,
  c.restoreVersion,
);
phase4ResumeRouter.post('/:resumeId/share-links', requireTrustedOrigin, c.createShare);
phase4ResumeRouter.get('/:resumeId/share-links', c.listShares);
phase4ResumeRouter.patch('/:resumeId/share-links/:linkId', requireTrustedOrigin, c.updateShare);
phase4ResumeRouter.delete('/:resumeId/share-links/:linkId', requireTrustedOrigin, c.revokeShare);
phase4ResumeRouter.post('/:resumeId/exports/:format', requireTrustedOrigin, c.createExport);
phase4ResumeRouter.get('/:resumeId/exports/:exportId', c.getExport);
export const publicResumeRouter = Router();
publicResumeRouter.get('/:token', c.publicResume);
publicResumeRouter.post('/:token/unlock', rateLimit({ windowMs: 60_000, limit: 5 }), c.unlockShare);
publicResumeRouter.get('/:token/download', c.publicDownload);
