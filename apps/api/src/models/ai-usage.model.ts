import { Schema, model } from 'mongoose';
const schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    feature: { type: String, required: true },
    provider: String,
    model: String,
    requestId: { type: String, required: true },
    idempotencyKey: { type: String, required: true },
    inputTokens: { type: Number, default: 0 },
    outputTokens: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },
    creditCost: { type: Number, required: true },
    status: { type: String, enum: ['reserved', 'succeeded', 'refunded', 'failed'], required: true },
    errorCategory: String,
  },
  { timestamps: true },
);
schema.index({ userId: 1, idempotencyKey: 1 }, { unique: true });
schema.index({ userId: 1, createdAt: -1 });
export const AIUsage = model('AIUsage', schema);
