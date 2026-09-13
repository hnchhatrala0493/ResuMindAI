import { AuditLog } from '../models/audit-log.model.js';
export const recordAudit = async (
  action: string,
  data: {
    actorId?: string | undefined;
    targetType?: string | undefined;
    targetId?: string | undefined;
    ipAddress?: string | undefined;
    userAgent?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
  },
) => {
  await AuditLog.create({ action, ...data });
};
