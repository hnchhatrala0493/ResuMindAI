import type { ErrorRequestHandler, RequestHandler } from 'express';
import { logger } from '../config/logger.js';
import { HttpError } from '../utilities/http-error.js';
import mongoose from 'mongoose';
import multer from 'multer';
export const notFound: RequestHandler = (req, _res, next) =>
  next(new HttpError(404, 'NOT_FOUND', `Route ${req.method} ${req.path} was not found.`));
export const errorHandler: ErrorRequestHandler = (error: unknown, req, res, _next) => {
  void _next;
  const known = error instanceof HttpError;
  const castError = error instanceof mongoose.Error.CastError;
  const uploadError = error instanceof multer.MulterError;
  const status = known ? error.status : castError ? 400 : uploadError ? 413 : 500;
  if (!known) logger.error({ err: error, requestId: req.id }, 'Unhandled request error');
  res.status(status).json({
    success: false,
    error: {
      code: known
        ? error.code
        : castError
          ? 'INVALID_IDENTIFIER'
          : uploadError
            ? 'FILE_TOO_LARGE'
            : 'INTERNAL_ERROR',
      message: known
        ? error.message
        : castError
          ? 'The supplied resource identifier is invalid.'
          : uploadError
            ? 'The uploaded file exceeds the allowed size.'
            : 'An unexpected error occurred.',
      ...(known && error.details ? { details: error.details } : {}),
    },
    requestId: req.id,
  });
};
