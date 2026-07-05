const pool = require('../config/database');
const { pingRedis } = require('../config/redis');

const startTime = Date.now();

async function checkDatabase() {
  const started = Date.now();
  const connection = await pool.getConnection();
  try {
    await connection.ping();
    return { status: 'up', latencyMs: Date.now() - started };
  } finally {
    connection.release();
  }
}

async function getLiveness() {
  return {
    status: 'alive',
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
  };
}

async function getReadiness() {
  const checks = {
    database: { status: 'down' },
    redis: { status: 'down' },
  };

  try {
    checks.database = await checkDatabase();
  } catch (err) {
    checks.database = { status: 'down', error: err.message };
  }

  try {
    checks.redis = await pingRedis();
  } catch (err) {
    checks.redis = { status: 'down', error: err.message };
  }

  const ready = checks.database.status === 'up';

  return {
    status: ready ? 'ready' : 'not_ready',
    checks,
    timestamp: new Date().toISOString(),
  };
}

async function getHealth() {
  const [liveness, readiness] = await Promise.all([getLiveness(), getReadiness()]);

  return {
    status: readiness.status === 'ready' ? 'healthy' : 'degraded',
    liveness,
    readiness,
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  };
}

module.exports = {
  getHealth,
  getLiveness,
  getReadiness,
};
