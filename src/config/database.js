const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

const dbHost = process.env.DB_HOST || '127.0.0.1';
const pool = mysql.createPool({
  // Docker MySQL on macOS often binds IPv4 only; `localhost` may resolve to ::1.
  host: dbHost === 'localhost' ? '127.0.0.1' : dbHost,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'justtap',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
});

pool.getConnection()
  .then((conn) => {
    conn.release();
    logger.info('MySQL pool connected');
  })
  .catch((err) => {
    logger.error('MySQL pool connection failed', { error: err.message });
  });

module.exports = pool;
