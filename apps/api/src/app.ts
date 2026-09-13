import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { randomUUID } from 'node:crypto';
import { databaseReady } from './config/database.js';
import { env, isAllowedWebOrigin } from './config/env.js';
import { logger } from './config/logger.js';
import { errorHandler, notFound } from './middleware/error.js';
import { rejectUnsafeMongoKeys } from './middleware/sanitize.js';
import { v1Router } from './routes/v1/index.js';
import swaggerUi from 'swagger-ui-express';
import { openapi } from './config/openapi.js';
export const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(
  pinoHttp({
    logger,
    genReqId: (req, res) => {
      const id = req.headers['x-request-id']?.toString() ?? randomUUID();
      res.setHeader('x-request-id', id);
      return id;
    },
  }),
);
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) =>
      !origin || isAllowedWebOrigin(origin)
        ? callback(null, true)
        : callback(new Error('Origin is not allowed by CORS.')),
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(cookieParser());
app.use(rejectUnsafeMongoKeys);
app.use(
  rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    limit: env.RATE_LIMIT_MAX,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  }),
);
app.get('/health', (_req, res) => res.json({ success: true, data: { status: 'ok' } }));
app.get('/ready', (_req, res) =>
  databaseReady()
    ? res.json({ success: true, data: { status: 'ready' } })
    : res.status(503).json({
        success: false,
        error: { code: 'NOT_READY', message: 'Database is not connected.' },
      }),
);
app.get('/openapi.json', (_req, res) => res.json(openapi));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapi));
app.use('/api/v1', v1Router);
app.use(notFound);
app.use(errorHandler);
