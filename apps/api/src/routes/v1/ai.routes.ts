import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../../middleware/auth.js';
import * as c from '../../controllers/ai.controller.js';
export const aiRouter = Router();
aiRouter.use(
  authenticate,
  rateLimit({ windowMs: 60000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false }),
);
aiRouter.post('/resumes/:resumeId/summary/generate', c.summaryGenerate);
aiRouter.post('/resumes/:resumeId/summary/improve', c.summaryImprove);
aiRouter.post('/resumes/:resumeId/experience/:experienceId/generate', c.experienceGenerate);
aiRouter.post('/resumes/:resumeId/experience/:experienceId/improve', c.experienceImprove);
aiRouter.post('/resumes/:resumeId/projects/:projectId/improve', c.projectImprove);
aiRouter.post('/resumes/:resumeId/skills/recommend', c.skillsRecommend);
aiRouter.post('/resumes/:resumeId/content/rewrite', c.rewrite);
