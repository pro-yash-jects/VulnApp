const request = require('supertest');
const app = require('../src/app');

describe('App Core Middleware & Landing Page', () => {
  it('GET / returns HTML landing page', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('Cloud-Native DevSecOps');
    expect(res.text).toContain('/metrics');
  });

  it('GET /unknown-route returns 404 JSON', async () => {
    const res = await request(app).get('/unknown-route-test');
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('error', 'Not Found');
  });

  it('sets security headers with Helmet', async () => {
    const res = await request(app).get('/');
    expect(res.headers).toHaveProperty('x-dns-prefetch-control');
    expect(res.headers).toHaveProperty('x-frame-options');
  });
});
