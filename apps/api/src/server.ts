import { app } from './app.js';
import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { kickExportWorker } from './services/export-job.service.js';
import { kickImportWorker } from './services/import-job.service.js';
async function start() {
  await connectDatabase();
  kickExportWorker();
  kickImportWorker();
  const server = app.listen(env.PORT, () =>
    logger.info({ port: env.PORT }, 'ResuMind API started'),
  );
  const shutdown = (signal: string) => {
    logger.info({ signal }, 'Shutting down');
    server.close(() => process.exit(0));
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}
start().catch((error) => {
  logger.fatal(error, 'API failed to start');
  process.exit(1);
});
