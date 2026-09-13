import type { Role } from '@resumind/shared';
declare global {
  namespace Express {
    interface Request {
      auth?: { userId: string; sessionId: string; role: Role };
    }
  }
}
export {};
