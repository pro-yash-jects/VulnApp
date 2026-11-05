require('dotenv').config();
const app = require('./app');

const PORT = parseInt(process.env.PORT, 10) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log(`[INFO] Server listening on http://${HOST}:${PORT}`);
  console.log(`[INFO] Metrics available at http://${HOST}:${PORT}/metrics`);
  console.log(`[INFO] Health check at http://${HOST}:${PORT}/health`);
  console.log(`[INFO] Environment: ${process.env.NODE_ENV || 'production'}`);
});

// SRE Graceful Shutdown Handlers
function gracefulShutdown(signal) {
  console.log(`[INFO] Received ${signal}. Starting graceful shutdown...`);

  server.close(() => {
    console.log('[INFO] HTTP server closed gracefully. Exiting process.');
    process.exit(0);
  });

  // Force shutdown if connections do not close in 10 seconds
  setTimeout(() => {
    console.error('[ERROR] Forceful shutdown initiated due to timeout.');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = server;
