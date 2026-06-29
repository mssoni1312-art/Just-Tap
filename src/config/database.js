const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
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
