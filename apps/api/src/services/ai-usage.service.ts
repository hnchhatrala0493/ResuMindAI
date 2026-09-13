import { randomUUID } from 'node:crypto';
import { AIUsage } from '../models/ai-usage.model.js';
import { env } from '../config/env.js';
import { HttpError } from '../utilities/http-error.js';
export const CREDIT_COSTS = {
  summary_generate: 1,
  summary_improve: 1,
  experience_generate: 2,
  experience_improve: 1,
  project_improve: 1,
  skills_recommend: 1,
  content_rewrite: 1,
  ats_ai: 2,
  job_semantic: 2,
} as const;
export async function remaining(userId: string) {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  const rows = await AIUsage.aggregate([
    {
      $match: {
        userId: new (await import('mongoose')).Types.ObjectId(userId),
        createdAt: { $gte: since },
        status: 'succeeded',
      },
    },
    { $group: { _id: null, total: { $sum: '$creditCost' } } },
  ]);
  return Math.max(0, env.AI_DAILY_FREE_CREDITS - (rows[0]?.total ?? 0));
}
export async function reserve(userId: string, feature: keyof typeof CREDIT_COSTS, key: string) {
  const existing = await AIUsage.findOne({ userId, idempotencyKey: key });
  if (existing) return { usage: existing, duplicate: true };
  const cost = CREDIT_COSTS[feature];
  if ((await remaining(userId)) < cost)
    throw new HttpError(
      402,
      'INSUFFICIENT_CREDITS',
      'You do not have enough AI credits for this action.',
    );
  try {
    return {
      usage: await AIUsage.create({
        userId,
        feature,
        provider: env.AI_PROVIDER,
        model: env.AI_MODEL,
        requestId: randomUUID(),
        idempotencyKey: key,
        creditCost: cost,
        status: 'reserved',
      }),
      duplicate: false,
    };
  } catch {
    const duplicate = await AIUsage.findOne({ userId, idempotencyKey: key });
    if (duplicate) return { usage: duplicate, duplicate: true };
    throw new HttpError(409, 'DUPLICATE_REQUEST', 'This request is already being processed.');
  }
}
