import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
beforeAll(() => {
  process.env.MONGODB_URI = 'mongodb://localhost:27017/resumind-test';
  process.env.JWT_ACCESS_SECRET = 'test-access-secret-that-is-at-least-32-characters';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-that-is-at-least-32-characters';
});
describe('service endpoints', () => {
  it('returns health', async () => {
    const { app } = await import('./app.js');
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('ok');
  });
  it('returns standard 404', async () => {
    const { app } = await import('./app.js');
    const response = await request(app).get('/missing');
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});
