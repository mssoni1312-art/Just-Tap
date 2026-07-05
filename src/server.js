require('dotenv').config();
const app = require('./app');
const logger = require('./utils/logger');
const pool = require('./config/database');
const { connectRedis, disconnectRedis } = require('./config/redis');

const PORT = Number(process.env.PORT) || 3000;

async function start() {
  if (process.env.SKIP_REDIS !== 'true') {
    try {
      await connectRedis();
    } catch (err) {
      logger.warn('Redis not available — continuing without Redis', { error: err.message });
    }
  }

  const HOST = process.env.HOST || '0.0.0.0';
  const server = app.listen(PORT, HOST, () => {
    logger.info(`Just Tap API running on ${HOST}:${PORT}`);
    logger.info(`Admin Swagger: http://localhost:${PORT}/api/docs`);
    logger.info(`Manager Swagger: http://localhost:${PORT}/api/manager/docs`);
    logger.info(`Health: http://localhost:${PORT}/health`);
    logger.info(`Readiness: http://localhost:${PORT}/health/ready`);
    logger.info(`Liveness: http://localhost:${PORT}/health/live`);
  });

  const shutdown = async (signal) => {
    logger.info(`${signal} received — shutting down gracefully`);
    server.close(async () => {
      try {
        await disconnectRedis();
        await pool.end();
        logger.info('Connections closed');
        process.exit(0);
      } catch (err) {
        logger.error('Shutdown error', { error: err.message });
        process.exit(1);
      }
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch((err) => {
  logger.error('Failed to start server', { error: err.message, stack: err.stack });
  process.exit(1);
});
