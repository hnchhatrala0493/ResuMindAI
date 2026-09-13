import { describe, expect, it } from 'vitest';
import { registerSchema } from './auth.js';

describe('registerSchema', () => {
  it('accepts a strong password', () => {
    expect(
      registerSchema.safeParse({
        name: 'Ada Lovelace',
        email: 'ADA@example.com',
        password: 'Strong!Pass123',
      }).success,
    ).toBe(true);
  });
  it('rejects weak passwords', () => {
    expect(
      registerSchema.safeParse({ name: 'Ada', email: 'ada@example.com', password: 'password' })
        .success,
    ).toBe(false);
  });
});
