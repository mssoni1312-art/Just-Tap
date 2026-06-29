const { createClient } = require('redis');
const logger = require('../utils/logger');

let client = null;
let connecting = null;

const getRedisUrl = () => process.env.REDIS_URL || 'redis://localhost:6379';

async function connectRedis() {
  if (client?.isOpen) return client;
  if (connecting) return connecting;

  connecting = (async () => {
    const redis = createClient({ url: getRedisUrl() });

    redis.on('error', (err) => {
      logger.error('Redis client error', { error: err.message });
    });

    redis.on('connect', () => {
      logger.info('Redis connected');
    });

    await redis.connect();
    client = redis;
    connecting = null;
    return client;
  })();

  return connecting;
}

async function getRedis() {
  if (client?.isOpen) return client;
  if (process.env.SKIP_REDIS === 'true') return null;
  try {
    return await connectRedis();
  } catch (err) {
    logger.warn('Redis unavailable', { error: err.message });
    return null;
  }
}

async function pingRedis() {
  const redis = await getRedis();
  if (!redis) {
    return { status: 'down', error: 'Redis client not connected' };
  }
  const result = await redis.ping();
  return { status: result === 'PONG' ? 'up' : 'down', latencyMs: null };
}

async function disconnectRedis() {
  if (client?.isOpen) {
    await client.quit();
    client = null;
  }
}

module.exports = {
  connectRedis,
  getRedis,
  pingRedis,
  disconnectRedis,
};
