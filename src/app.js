const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { register, metricsMiddleware } = require('./metrics');
const healthRoutes = require('./routes/health');
const apiRoutes = require('./routes/api');
const pkg = require('../package.json');

const app = express();

// Security Headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:']
      }
    },
    crossOriginEmbedderPolicy: false
  })
);

// Cross-Origin Resource Sharing
app.use(cors());

// Rate Limiting to prevent brute force / DoS
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// Request parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Prometheus Metrics Middleware
app.use(metricsMiddleware);

// Prometheus Scrape Endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.setHeader('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.send(metrics);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Health Checks
app.use('/health', healthRoutes);

// API Routes
app.use('/api/v1', apiRoutes);

// Interactive Landing Page with System Status & SRE telemetry links
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cloud-Native DevSecOps Deployment Pipeline</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0f172a;
      --card-bg: #1e293b;
      --card-border: #334155;
      --text: #f8fafc;
      --muted: #94a3b8;
      --accent: #38bdf8;
      --success: #10b981;
      --warning: #f59e0b;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', sans-serif;
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.6;
      padding: 2rem 1rem;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
    }
    header {
      text-align: center;
      margin-bottom: 2.5rem;
    }
    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 600;
      background: rgba(16, 185, 129, 0.2);
      color: var(--success);
      border: 1px solid rgba(16, 185, 129, 0.4);
      margin-bottom: 0.75rem;
    }
    h1 {
      font-size: 2.2rem;
      font-weight: 700;
      color: #fff;
      margin-bottom: 0.5rem;
    }
    p.lead {
      color: var(--muted);
      font-size: 1.1rem;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 1.25rem;
      margin-bottom: 2rem;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 0.75rem;
      padding: 1.5rem;
      transition: transform 0.2s, border-color 0.2s;
    }
    .card:hover {
      border-color: var(--accent);
      transform: translateY(-2px);
    }
    .card h3 {
      font-size: 1.2rem;
      margin-bottom: 0.5rem;
      color: var(--accent);
    }
    .card p {
      font-size: 0.9rem;
      color: var(--muted);
      margin-bottom: 1rem;
    }
    .btn {
      display: inline-block;
      background: #0284c7;
      color: #fff;
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      text-decoration: none;
      font-weight: 500;
      font-size: 0.85rem;
    }
    .btn:hover { background: #0369a1; }
    .features {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 0.75rem;
      padding: 1.75rem;
    }
    .features h2 {
      font-size: 1.4rem;
      margin-bottom: 1rem;
    }
    ul { list-style-position: inside; color: var(--muted); }
    li { margin-bottom: 0.5rem; }
    footer {
      text-align: center;
      margin-top: 3rem;
      font-size: 0.85rem;
      color: var(--muted);
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="badge">● PRODUCTION DEPLOYMENT ACTIVE</div>
      <h1>Cloud-Native DevSecOps Pipeline</h1>
      <p class="lead">Containerized Application with SonarQube SAST, Trivy Vulnerability Scanning, and Prometheus/Grafana SRE Stack</p>
    </header>

    <div class="grid">
      <div class="card">
        <h3>🔍 Prometheus Metrics</h3>
        <p>Real-time HTTP traffic, duration histograms, and runtime telemetry scraped by Prometheus.</p>
        <a class="btn" href="/metrics" target="_blank">View /metrics</a>
      </div>
      <div class="card">
        <h3>💓 Health Check</h3>
        <p>Liveness and readiness probes checking memory thresholds, uptime, and system health.</p>
        <a class="btn" href="/health" target="_blank">Check /health</a>
      </div>
      <div class="card">
        <h3>📡 API Information</h3>
        <p>RESTful metadata endpoint exposing pipeline features, active version, and architecture info.</p>
        <a class="btn" href="/api/v1/info" target="_blank">Explore API</a>
      </div>
    </div>

    <div class="features">
      <h2>🛡️ DevSecOps & SRE Highlights</h2>
      <ul>
        <li><strong>Automated CI/CD:</strong> GitHub Actions pipeline to test, build, scan, and deploy onto AWS EC2 with zero manual toil.</li>
        <li><strong>Static Code Analysis (SAST):</strong> SonarQube Quality Gate embedded directly to block code smells and vulnerabilities.</li>
        <li><strong>Container Vulnerability Scanning:</strong> Trivy scans filesystems and Docker images to block CVEs before production.</li>
        <li><strong>SRE Observability:</strong> Full stack with Prometheus, Grafana, Node Exporter, and cAdvisor monitoring CPU, Memory, and Golden Signals.</li>
      </ul>
    </div>

    <footer>
      <p>DevSecOps Deployment Pipeline • Version ${pkg.version} • Environment: ${process.env.NODE_ENV || 'production'}</p>
    </footer>
  </div>
</body>
</html>`);
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    status: 404,
    error: 'Not Found',
    path: req.originalUrl
  });
});

// Centralized Error Handler
app.use((err, req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    status: statusCode,
    error: message,
    timestamp: new Date().toISOString()
  });
});

module.exports = app;
