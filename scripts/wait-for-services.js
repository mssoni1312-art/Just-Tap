#!/usr/bin/env node
/**
 * Waits for MySQL and Redis to accept connections before starting the API.
 * Used by Docker entrypoint and local scripts.
 */
require('dotenv').config();
const net = require('net');

const MAX_ATTEMPTS = Number(process.env.WAIT_MAX_ATTEMPTS) || 60;
const INTERVAL_MS = Number(process.env.WAIT_INTERVAL_MS) || 2000;

const parseRedisHost = (url) => {
  try {
    const parsed = new URL(url);
    return { host: parsed.hostname, port: Number(parsed.port) || 6379 };
  } catch {
    return { host: 'localhost', port: 6379 };
  }
};

const waitForPort = (host, port, label) => new Promise((resolve, reject) => {
  let attempts = 0;

  const tryConnect = () => {
    attempts += 1;
    const socket = net.createConnection({ host, port }, () => {
      socket.end();
      console.log(`  ✓ ${label} is ready (${host}:${port})`);
      resolve();
    });

    socket.on('error', () => {
      socket.destroy();
      if (attempts >= MAX_ATTEMPTS) {
        reject(new Error(`${label} not ready after ${MAX_ATTEMPTS} attempts (${host}:${port})`));
        return;
      }
      if (attempts === 1 || attempts % 5 === 0) {
        console.log(`  … waiting for ${label} (${attempts}/${MAX_ATTEMPTS})`);
      }
      setTimeout(tryConnect, INTERVAL_MS);
    });
  };

  tryConnect();
});

async function main() {
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = Number(process.env.DB_PORT) || 3306;
  const redis = parseRedisHost(process.env.REDIS_URL || 'redis://localhost:6379');

  console.log('Waiting for dependent services...');
  await waitForPort(dbHost, dbPort, 'MySQL');
  if (process.env.SKIP_REDIS !== 'true' && process.env.REDIS_URL) {
    await waitForPort(redis.host, redis.port, 'Redis');
  } else if (process.env.SKIP_REDIS === 'true' || !process.env.REDIS_URL) {
    console.log('  ⊘ Redis wait skipped (optional dependency)');
  }
  console.log('All services are reachable.');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
