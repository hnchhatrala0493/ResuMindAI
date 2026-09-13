import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../../config/env.js';
import { summary } from '../../controllers/dashboard.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { authRouter } from './auth.routes.js';
import { resumeRouter } from './resume.routes.js';
import { atsRouter } from './ats.routes.js';
import { aiRouter } from './ai.routes.js';
import { jobMatchingRouter } from './job-matching.routes.js';
import { templateRouter, resumeTemplateRouter } from './template.routes.js';
import { importRouter, phase4ResumeRouter, publicResumeRouter } from './phase4.routes.js';
import { internalRender } from '../../controllers/phase4.controller.js';
export const v1Router = Router();
const authLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
});
v1Router.use('/auth', authLimiter, authRouter);
v1Router.use('/resumes', resumeRouter);
v1Router.use('/ats', atsRouter);
v1Router.use('/ai', aiRouter);
v1Router.use('/job-matching', jobMatchingRouter);
v1Router.use('/templates', templateRouter);
v1Router.use('/resumes', resumeTemplateRouter);
v1Router.use('/resume-imports', importRouter);
v1Router.use('/resumes', phase4ResumeRouter);
v1Router.use('/public/resumes', publicResumeRouter);
v1Router.post('/internal/exports/render', internalRender);
v1Router.get('/dashboard/summary', authenticate, summary);
