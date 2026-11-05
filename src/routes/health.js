const express = require('express');
const router = express.Router();
const pkg = require('../../package.json');

const startTime = Date.now();

/**
 * @route   GET /health
 * @desc    Comprehensive health check endpoint for Kubernetes / AWS EC2 / SRE monitoring
 * @access  Public
 */
router.get('/', (req, res) => {
  const uptimeSeconds = Math.floor(process.uptime());
  const memUsage = process.memoryUsage();

  // Basic memory threshold check (e.g. > 1GB heap considered degraded)
  const isHealthy = memUsage.heapUsed < 1024 * 1024 * 1024;

  const healthData = {
    status: isHealthy ? 'UP' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    service: pkg.name,
    version: pkg.version,
    uptime_seconds: uptimeSeconds,
    started_at: new Date(startTime).toISOString(),
    environment: process.env.NODE_ENV || 'production',
    system: {
      node_version: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid
    },
    resources: {
      memory_heap_used_mb: Math.round((memUsage.heapUsed / 1024 / 1024) * 100) / 100,
      memory_heap_total_mb: Math.round((memUsage.heapTotal / 1024 / 1024) * 100) / 100,
      memory_rss_mb: Math.round((memUsage.rss / 1024 / 1024) * 100) / 100
    },
    checks: {
      liveness: 'PASSED',
      readiness: isHealthy ? 'PASSED' : 'FAILED'
    }
  };

  const statusCode = isHealthy ? 200 : 503;
  res.status(statusCode).json(healthData);
});

/**
 * @route   GET /health/live
 * @desc    Lightweight liveness probe
 */
router.get('/live', (req, res) => {
  res.status(200).json({ status: 'alive' });
});

/**
 * @route   GET /health/ready
 * @desc    Readiness probe
 */
router.get('/ready', (req, res) => {
  res.status(200).json({ status: 'ready' });
});

module.exports = router;
