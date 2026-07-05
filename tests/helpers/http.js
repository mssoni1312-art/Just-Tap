process.env.SKIP_REDIS = 'true';
require('dotenv').config();

const request = require('supertest');
const app = require('../../src/app');
const pool = require('../../src/config/database');

async function isDatabaseReady() {
  try {
    await pool.execute('SELECT 1');
    const [rows] = await pool.execute(
      `SELECT id FROM users WHERE email = 'manager@justtap.com' AND role = 'manager' AND deleted_at IS NULL LIMIT 1`
    );
    return rows.length > 0;
  } catch {
    return false;
  }
}

async function loginManager() {
  const res = await request(app)
    .post('/api/manager/auth/login')
    .send({ identifier: 'manager@justtap.com', password: 'manager123' });
  return res;
}

async function loginAdmin() {
  return request(app)
    .post('/api/v1/auth/login')
    .send({ identifier: 'admin@justtap.com', password: 'admin123' });
}

module.exports = { request, app, isDatabaseReady, loginManager, loginAdmin, pool };
