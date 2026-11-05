const express = require('express');
const router = express.Router();

/**
 * Helper to escape HTML characters and prevent Cross-Site Scripting (XSS)
 */
function sanitizeInput(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Validates IPv4 format safely to prevent command injection
 */
function isValidIPv4(ip) {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
  return ipv4Regex.test(ip);
}

// GET /api/v1/info
router.get('/info', (req, res) => {
  res.json({
    project: 'Cloud-Native DevSecOps Pipeline',
    description: 'Automated CI/CD, Container Security Guardrails, and Observability Stack',
    features: [
      'GitHub Actions CI/CD Pipeline',
      'SonarQube Static Code Analysis (SAST)',
      'Trivy Container & Vulnerability Scanning',
      'AWS EC2 Automated Deployment',
      'Prometheus & Grafana Observability',
      'SRE Golden Signals Monitoring'
    ],
    timestamp: new Date().toISOString()
  });
});

// POST /api/v1/ping - Safe Ping Implementation (Parameterized, No Command Injection)
router.post('/ping', (req, res) => {
  const { ip } = req.body;

  if (!ip) {
    return res.status(400).json({ error: 'Missing "ip" field in request body.' });
  }

  if (!isValidIPv4(ip.trim())) {
    return res.status(400).json({
      error: 'Invalid IPv4 address format. Input rejected by security validation.'
    });
  }

  // Safe simulated response without executing shell commands
  return res.json({
    status: 'success',
    target: ip.trim(),
    message: `Host ${ip.trim()} reachable (simulated secure ping)`,
    round_trip_ms: Math.floor(Math.random() * 20) + 5
  });
});

// GET /api/v1/greet - Safe Greet Implementation (Escaped against XSS)
router.get('/greet', (req, res) => {
  const rawName = req.query.name || 'Guest';
  const sanitized = sanitizeInput(rawName);

  res.json({
    greeting: `Hello, ${sanitized}!`,
    sanitized: true,
    input_received: sanitized
  });
});

// GET /api/v1/simulate/error - SRE observability test endpoint for 500 alert testing
router.get('/simulate/error', (req, res, next) => {
  const error = new Error('Simulated internal server error for SRE alert testing');
  error.statusCode = 500;
  next(error);
});

// GET /api/v1/simulate/latency - SRE observability test endpoint for latency alert testing
router.get('/simulate/latency', async (req, res) => {
  const ms = Math.min(Math.max(parseInt(req.query.ms, 10) || 500, 10), 5000);
  await new Promise((resolve) => setTimeout(resolve, ms));
  res.json({
    message: 'Simulated latency response completed',
    delayed_by_ms: ms
  });
});

module.exports = router;
