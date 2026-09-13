import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../../middleware/auth.js';
import * as c from '../../controllers/ats.controller.js';
export const atsRouter = Router();
atsRouter.use(
  authenticate,
  rateLimit({ windowMs: 60000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false }),
);
atsRouter.post('/resumes/:resumeId/analyze', c.analyze);
atsRouter.get('/resumes/:resumeId/latest', c.latest);
atsRouter.get('/resumes/:resumeId/history', c.history);
atsRouter.get('/analyses/:analysisId', c.getAnalysis);
atsRouter.delete('/analyses/:analysisId', c.removeAnalysis);
atsRouter.post('/suggestions/:suggestionId/apply', c.applySuggestion);
atsRouter.post('/suggestions/:suggestionId/reject', c.rejectSuggestion);
