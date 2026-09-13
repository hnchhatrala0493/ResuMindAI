import type { RequestHandler } from 'express';
import { HttpError } from '../utilities/http-error.js';

function hasUnsafeKey(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  if (Array.isArray(value)) return value.some(hasUnsafeKey);
  return Object.entries(value).some(
    ([key, child]) => key.startsWith('$') || key.includes('.') || hasUnsafeKey(child),
  );
}

export const rejectUnsafeMongoKeys: RequestHandler = (req, _res, next) => {
  if (hasUnsafeKey(req.body) || hasUnsafeKey(req.query) || hasUnsafeKey(req.params)) {
    return next(new HttpError(400, 'UNSAFE_INPUT', 'Request contains unsupported field names.'));
  }
  next();
};
