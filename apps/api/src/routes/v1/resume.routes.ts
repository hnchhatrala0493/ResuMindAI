import { Router } from 'express';
import { createResumeSchema, updateResumeSchema } from '@resumind/shared';
import * as c from '../../controllers/resume.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
export const resumeRouter = Router();
resumeRouter.use(authenticate);
resumeRouter.post('/', validateBody(createResumeSchema), c.create);
resumeRouter.get('/', c.list);
resumeRouter.get('/:resumeId', c.get);
resumeRouter.patch('/:resumeId', validateBody(updateResumeSchema), c.update);
resumeRouter.delete('/:resumeId', c.remove);
resumeRouter.post('/:resumeId/duplicate', c.duplicate);
resumeRouter.patch('/:resumeId/archive', c.archive);
resumeRouter.patch('/:resumeId/restore', c.restore);
resumeRouter.patch('/:resumeId/autosave', validateBody(updateResumeSchema), c.autosave);
resumeRouter.patch(
  '/:resumeId/sections/reorder',
  validateBody(updateResumeSchema.pick({ sectionOrder: true })),
  c.autosave,
);
resumeRouter.get('/:resumeId/completion', c.completion);
