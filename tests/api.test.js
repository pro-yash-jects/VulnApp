const request = require('supertest');
const app = require('../src/app');

describe('API v1 Routes', () => {
  it('GET /api/v1/info returns system features and info', async () => {
    const res = await request(app).get('/api/v1/info');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('project', 'Cloud-Native DevSecOps Pipeline');
    expect(Array.isArray(res.body.features)).toBe(true);
  });

  describe('POST /api/v1/ping (Input Validation & Injection Prevention)', () => {
    it('returns 400 when IP is missing', async () => {
      const res = await request(app).post('/api/v1/ping').send({});
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('returns 400 when an invalid or malicious IP is injected', async () => {
      const maliciousPayload = { ip: '8.8.8.8; cat /etc/passwd' };
      const res = await request(app).post('/api/v1/ping').send(maliciousPayload);
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain('Invalid IPv4 address format');
    });

    it('returns 200 for a valid IPv4 address', async () => {
      const res = await request(app).post('/api/v1/ping').send({ ip: '127.0.0.1' });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 'success');
      expect(res.body).toHaveProperty('target', '127.0.0.1');
    });
  });

  describe('GET /api/v1/greet (XSS Prevention)', () => {
    it('sanitizes malicious script tags in input', async () => {
      const xssPayload = '<script>alert("xss")</script>';
      const res = await request(app).get(`/api/v1/greet?name=${encodeURIComponent(xssPayload)}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.greeting).not.toContain('<script>');
      expect(res.body.greeting).toContain('&lt;script&gt;');
    });

    it('returns default greeting when no name provided', async () => {
      const res = await request(app).get('/api/v1/greet');
      expect(res.statusCode).toBe(200);
      expect(res.body.greeting).toBe('Hello, Guest!');
    });
  });

  describe('Simulation Endpoints (SRE Alert Testing)', () => {
    it('GET /api/v1/simulate/error triggers a controlled 500 error', async () => {
      const res = await request(app).get('/api/v1/simulate/error');
      expect(res.statusCode).toBe(500);
      expect(res.body).toHaveProperty('error');
    });

    it('GET /api/v1/simulate/latency delays response and returns 200', async () => {
      const res = await request(app).get('/api/v1/simulate/latency?ms=50');
      expect(res.statusCode).toBe(200);
      expect(res.body.delayed_by_ms).toBe(50);
    });
  });
});
