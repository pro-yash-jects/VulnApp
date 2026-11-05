const request = require('supertest');
const app = require('../src/app');

describe('Health Check Endpoints', () => {
  it('GET /health returns 200 and healthy status metadata', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'UP');
    expect(res.body).toHaveProperty('uptime_seconds');
    expect(res.body).toHaveProperty('system');
    expect(res.body).toHaveProperty('resources');
    expect(res.body.checks).toHaveProperty('liveness', 'PASSED');
    expect(res.body.checks).toHaveProperty('readiness', 'PASSED');
  });

  it('GET /health/live returns liveness status', async () => {
    const res = await request(app).get('/health/live');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: 'alive' });
  });

  it('GET /health/ready returns readiness status', async () => {
    const res = await request(app).get('/health/ready');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: 'ready' });
  });
});
