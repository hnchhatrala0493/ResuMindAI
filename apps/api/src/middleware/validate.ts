import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { HttpError } from '../utilities/http-error.js';
export const validateBody =
  (schema: ZodType): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success)
      return next(
        new HttpError(
          400,
          'VALIDATION_ERROR',
          'Please check the submitted fields.',
          result.error.flatten(),
        ),
      );
    req.body = result.data;
    next();
  };
