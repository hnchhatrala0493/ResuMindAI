import type { RequestHandler } from 'express';
import { listResumesSchema } from '@resumind/shared';
import * as service from '../services/resume.service.js';
const resumeId = (req: Parameters<RequestHandler>[0]) => String(req.params.resumeId);
export const create: RequestHandler = async (req, res) =>
  res.status(201).json({ success: true, data: await service.create(req.auth!.userId, req.body) });
export const list: RequestHandler = async (req, res) => {
  const q = listResumesSchema.parse(req.query);
  const r = await service.list(req.auth!.userId, q);
  res.json({ success: true, ...r });
};
export const get: RequestHandler = async (req, res) =>
  res.json({ success: true, data: await service.get(req.auth!.userId, resumeId(req)) });
export const update: RequestHandler = async (req, res) =>
  res.json({
    success: true,
    data: await service.update(req.auth!.userId, resumeId(req), req.body, true),
  });
export const autosave: RequestHandler = async (req, res) =>
  res.json({
    success: true,
    data: await service.update(req.auth!.userId, resumeId(req), req.body, false),
  });
export const remove: RequestHandler = async (req, res) => {
  await service.remove(req.auth!.userId, resumeId(req));
  res.status(204).send();
};
export const duplicate: RequestHandler = async (req, res) =>
  res
    .status(201)
    .json({ success: true, data: await service.duplicate(req.auth!.userId, resumeId(req)) });
export const archive: RequestHandler = async (req, res) =>
  res.json({
    success: true,
    data: await service.status(req.auth!.userId, resumeId(req), 'archived'),
  });
export const restore: RequestHandler = async (req, res) =>
  res.json({
    success: true,
    data: await service.status(req.auth!.userId, resumeId(req), 'draft'),
  });
export const completion: RequestHandler = async (req, res) =>
  res.json({
    success: true,
    data: await service.getCompletion(req.auth!.userId, resumeId(req)),
  });
