import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../../middleware/auth.js';
import * as c from '../../controllers/job-matching.controller.js';
export const jobMatchingRouter = Router();
jobMatchingRouter.use(
  authenticate,
  rateLimit({ windowMs: 60000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false }),
);
jobMatchingRouter.post('/resumes/:resumeId/analyze', c.analyze);
jobMatchingRouter.get('/resumes/:resumeId/history', c.history);
jobMatchingRouter.get('/analyses/:analysisId', c.get);
