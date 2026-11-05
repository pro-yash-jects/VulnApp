const request = require('supertest');
const app = require('../src/app');

describe('Prometheus Metrics Endpoint', () => {
  it('GET /metrics returns 200 with Prometheus format text', async () => {
    // Generate some traffic first to populate metrics
    await request(app).get('/api/v1/info');

    const res = await request(app).get('/metrics');
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('nodejs_');
    expect(res.text).toContain('http_requests_total');
    expect(res.text).toContain('http_request_duration_seconds');
    expect(res.text).toContain('app_build_info');
  });
});
