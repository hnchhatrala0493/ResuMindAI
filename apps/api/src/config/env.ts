import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_NAME: z.string().default('ResuMind AI'),
  PORT: z.coerce.number().int().positive().default(5000),
  WEB_URL: z.url().default('http://localhost:5173'),
  MONGODB_URI: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL_DAYS: z.coerce.number().positive().default(30),
  COOKIE_NAME: z.string().default('resumind_refresh'),
  COOKIE_SECURE: z.stringbool().default(false),
  COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  COOKIE_DOMAIN: z.string().optional(),
  PASSWORD_BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
  ACCOUNT_LOCK_MAX_ATTEMPTS: z.coerce.number().int().min(3).default(5),
  ACCOUNT_LOCK_DURATION_MINUTES: z.coerce.number().positive().default(15),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z.stringbool().default(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  EMAIL_FROM_NAME: z.string().default('ResuMind AI'),
  EMAIL_FROM_ADDRESS: z.email().default('no-reply@example.com'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.url().optional(),
  LOG_LEVEL: z.string().default('info'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().positive().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().positive().default(200),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().positive().default(20),
  AI_PROVIDER: z.enum(['openai', 'gemini', 'mock']).default('mock'),
  AI_MODEL: z.string().default('mock-v1'),
  AI_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  AI_TIMEOUT_MS: z.coerce.number().int().min(1000).max(120000).default(30000),
  AI_MAX_RETRIES: z.coerce.number().int().min(0).max(5).default(2),
  AI_DAILY_FREE_CREDITS: z.coerce.number().int().min(0).default(10),
  AI_MONTHLY_PRO_CREDITS: z.coerce.number().int().min(0).default(500),
  AI_FEATURES_ENABLED: z.stringbool().default(true),
  ATS_AI_ANALYSIS_ENABLED: z.stringbool().default(true),
  IMPORT_MAX_FILE_BYTES: z.coerce.number().int().min(1024).max(20_000_000).default(5_242_880),
  IMPORT_PARSE_TIMEOUT_MS: z.coerce.number().int().min(1000).max(120_000).default(15_000),
  EXPORT_RENDER_TIMEOUT_MS: z.coerce.number().int().min(5000).max(120_000).default(30_000),
  EXPORT_MAX_CONCURRENT: z.coerce.number().int().min(1).max(10).default(2),
  EXPORT_IDEMPOTENCY_TTL_HOURS: z.coerce.number().int().min(1).max(168).default(24),
  MALWARE_SCAN_ENABLED: z.stringbool().default(false),
  MALWARE_SCANNER_PROVIDER: z.enum(['clamav', 'mock']).default('clamav'),
  CLAMAV_HOST: z.string().default('127.0.0.1'),
  CLAMAV_PORT: z.coerce.number().int().positive().default(3310),
  MALWARE_SCAN_TIMEOUT_MS: z.coerce.number().int().min(1000).max(60000).default(10000),
  MALWARE_SCAN_FAIL_MODE: z.enum(['open', 'closed']).default('closed'),
  PUBLIC_VIEW_DEDUPE_MINUTES: z.coerce.number().int().min(1).max(1440).default(30),
  SHARE_UNLOCK_TTL_MINUTES: z.coerce.number().int().min(1).max(120).default(15),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment configuration', z.treeifyError(parsed.error));
  throw new Error('Invalid environment configuration');
}
export const env = parsed.data;
export function isAllowedWebOrigin(origin: string | undefined) {
  if (!origin) return false;
  if (origin === env.WEB_URL) return true;
  if (env.NODE_ENV !== 'development') return false;
  try {
    const url = new URL(origin);
    return (
      url.protocol === 'http:' && (url.hostname === 'localhost' || url.hostname === '127.0.0.1')
    );
  } catch {
    return false;
  }
}
if (env.AI_FEATURES_ENABLED && env.AI_PROVIDER !== 'mock') {
  const key =
    env.AI_API_KEY ?? (env.AI_PROVIDER === 'openai' ? env.OPENAI_API_KEY : env.GEMINI_API_KEY);
  if (!key)
    throw new Error(`AI provider ${env.AI_PROVIDER} is enabled but no API key is configured.`);
}
