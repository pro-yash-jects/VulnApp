const client = require('prom-client');

// Initialize Prometheus registry
const register = new client.Registry();

// Enable default Node.js runtime metrics (CPU, Memory, Event Loop, GC)
client.collectDefaultMetrics({
  register,
  prefix: 'nodejs_',
  labels: { app: 'cloud-native-devsecops-app' }
});

// HTTP Request Duration Histogram (Latency)
const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5]
});
register.registerMetric(httpRequestDurationSeconds);

// HTTP Requests Total Counter (Traffic & Error Rate)
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests processed',
  labelNames: ['method', 'route', 'status_code']
});
register.registerMetric(httpRequestsTotal);

// Active In-Flight Requests Gauge
const httpActiveRequests = new client.Gauge({
  name: 'http_active_requests',
  help: 'Number of active HTTP requests currently being handled',
  labelNames: ['method']
});
register.registerMetric(httpActiveRequests);

// Application Build / Version Info Gauge
const appInfo = new client.Gauge({
  name: 'app_build_info',
  help: 'Application build metadata and version information',
  labelNames: ['version', 'environment', 'node_version']
});
register.registerMetric(appInfo);

appInfo.labels({
  version: process.env.APP_VERSION || '1.0.0',
  environment: process.env.NODE_ENV || 'production',
  node_version: process.version
}).set(1);

// Express Middleware for automatic HTTP metrics collection
function metricsMiddleware(req, res, next) {
  // Exclude /metrics and /health from request duration to avoid skewing telemetry
  if (req.path === '/metrics' || req.path === '/health') {
    return next();
  }

  const start = process.hrtime();
  const method = req.method;
  httpActiveRequests.inc({ method });

  res.on('finish', () => {
    httpActiveRequests.dec({ method });

    const diff = process.hrtime(start);
    const durationInSeconds = diff[0] + diff[1] / 1e9;
    const route = req.route ? req.route.path : req.baseUrl + req.path;
    const statusCode = res.statusCode.toString();

    httpRequestsTotal.inc({
      method,
      route: route || req.path,
      status_code: statusCode
    });

    httpRequestDurationSeconds.observe(
      {
        method,
        route: route || req.path,
        status_code: statusCode
      },
      durationInSeconds
    );
  });

  next();
}

module.exports = {
  register,
  httpRequestDurationSeconds,
  httpRequestsTotal,
  httpActiveRequests,
  appInfo,
  metricsMiddleware
};
