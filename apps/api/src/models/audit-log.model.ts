import { Schema, model, Types } from 'mongoose';
interface AuditLogDocument {
  actorId?: Types.ObjectId;
  action: string;
  targetType?: string;
  targetId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}
const schema = new Schema<AuditLogDocument>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    action: { type: String, required: true, index: true },
    targetType: String,
    targetId: String,
    ipAddress: String,
    userAgent: String,
    metadata: Schema.Types.Mixed,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
schema.index({ createdAt: -1 });
export const AuditLog = model<AuditLogDocument>('AuditLog', schema);
