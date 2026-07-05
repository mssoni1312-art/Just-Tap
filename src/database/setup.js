require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');
const SEEDERS_DIR = path.join(__dirname, 'seeders');
const DB_NAME = process.env.DB_NAME || 'justtap';

async function getConnection() {
  return mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_MIGRATE_USER || process.env.DB_USER || 'root',
    password: process.env.DB_MIGRATE_PASSWORD || process.env.MYSQL_ROOT_PASSWORD || process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });
}

async function ensureDatabase(connection) {
  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  await connection.query(`USE \`${DB_NAME}\``);
  await connection.query('SET NAMES utf8mb4');
  await connection.query('SET FOREIGN_KEY_CHECKS = 0');
}

async function tableExists(connection, tableName) {
  const [rows] = await connection.query(
    `SELECT COUNT(*) AS count FROM information_schema.tables
     WHERE table_schema = ? AND table_name = ?`,
    [DB_NAME, tableName],
  );
  return Number(rows[0].count) > 0;
}

async function reconcileSchemaState(connection) {
  await connection.query(`USE \`${DB_NAME}\``);

  const hasMigrationsTable = await tableExists(connection, 'schema_migrations');
  if (!hasMigrationsTable) {
    return;
  }

  const applied = await getAppliedFiles(connection, 'schema_migrations');
  if (applied.size === 0) {
    return;
  }

  const hasUsers = await tableExists(connection, 'users');
  if (hasUsers) {
    return;
  }

  console.warn(
    `Schema drift detected: ${applied.size} migrations recorded in \`${DB_NAME}\` but core tables are missing.`,
  );
  console.warn('Resetting migration and seeder tracking, then reapplying...');
  await connection.query('DROP TABLE IF EXISTS schema_seeders');
  await connection.query('DROP TABLE IF EXISTS schema_migrations');
}

async function ensureTrackingTable(connection, tableName) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS ${tableName} (
      filename VARCHAR(255) NOT NULL,
      applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (filename)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

async function getAppliedFiles(connection, tableName) {
  const [rows] = await connection.query(`SELECT filename FROM ${tableName}`);
  return new Set(rows.map((row) => row.filename));
}

async function recordApplied(connection, tableName, filename) {
  await connection.query(`INSERT INTO ${tableName} (filename) VALUES (?)`, [filename]);
}

function stripUseDatabase(sql) {
  return sql.replace(/USE\s+[`']?[\w]+[`']?\s*;/gi, '').trim();
}

function parseTriggerStatements(sql) {
  const cleaned = sql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')
    .replace(/DELIMITER\s+\$\$\s*/gi, '')
    .replace(/DELIMITER\s+;\s*/gi, '')
    .replace(/\$\$/g, ';')
    .replace(/USE\s+[`']?[\w]+[`']?\s*;/gi, '')
    .trim();

  const blocks = cleaned.split(/(?=DROP TRIGGER IF EXISTS)/i).map((s) => s.trim()).filter(Boolean);
  const statements = [];

  for (const block of blocks) {
    const dropEnd = block.indexOf(';');
    if (dropEnd === -1) continue;
    statements.push(block.slice(0, dropEnd + 1).trim());
    const createBlock = block.slice(dropEnd + 1).trim();
    if (createBlock) statements.push(createBlock);
  }

  return statements;
}

async function executeSqlFile(connection, file, sql) {
  if (file.includes('triggers')) {
    const statements = parseTriggerStatements(sql);
    for (const statement of statements) {
      await connection.query(statement);
    }
    return;
  }

  await connection.query(sql);
}

async function runSqlFiles(connection, { dir, tableName, label, transform }) {
  await ensureTrackingTable(connection, tableName);
  const applied = await getAppliedFiles(connection, tableName);
  const files = fs.readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  console.log(`Running ${files.length} ${label} (${applied.size} already applied)...`);

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`  ⊘ ${file} (skipped)`);
      continue;
    }

    let sql = fs.readFileSync(path.join(dir, file), 'utf8');
    if (transform) {
      sql = await transform(file, sql);
    }

    if (sql.trim()) {
      await executeSqlFile(connection, file, sql);
    }
    await connection.query(`USE \`${DB_NAME}\``);
    await recordApplied(connection, tableName, file);
    console.log(`  ✓ ${file}`);
  }
}

async function runMigrations(connection) {
  await reconcileSchemaState(connection);
  await runSqlFiles(connection, {
    dir: MIGRATIONS_DIR,
    tableName: 'schema_migrations',
    label: 'migrations',
    transform: async (file, sql) => {
      if (file.startsWith('000_')) {
        return '';
      }
      return stripUseDatabase(sql);
    },
  });
}

async function runSeeders(connection) {
  await runSqlFiles(connection, {
    dir: SEEDERS_DIR,
    tableName: 'schema_seeders',
    label: 'seeders',
    transform: async (file, sql) => {
      let transformed = stripUseDatabase(sql);
      if (file.includes('super_admin')) {
        const hash = await bcrypt.hash('admin123', 12);
        transformed = transformed.replace(/__BCRYPT_HASH__/g, hash);
      }
      if (file.includes('manager_users')) {
        const hash = await bcrypt.hash('manager123', 12);
        transformed = transformed.replace(/__BCRYPT_HASH__/g, hash);
      }
      if (file.includes('auth_tokens')) {
        const [resetActive, resetUsed, otpPending, otpVerified] = await Promise.all([
          bcrypt.hash('sample-reset-token-active', 12),
          bcrypt.hash('sample-reset-token-used', 12),
          bcrypt.hash('123456', 12),
          bcrypt.hash('654321', 12),
        ]);
        transformed = transformed
          .replace(/__RESET_TOKEN_HASH_ACTIVE__/g, resetActive)
          .replace(/__RESET_TOKEN_HASH_USED__/g, resetUsed)
          .replace(/__OTP_CODE_HASH_PENDING__/g, otpPending)
          .replace(/__OTP_CODE_HASH_VERIFIED__/g, otpVerified);
      }
      return transformed;
    },
  });
}

async function setup({ seed = true } = {}) {
  const connection = await getConnection();
  try {
    console.log(`Using database: ${DB_NAME}`);
    await ensureDatabase(connection);
    await runMigrations(connection);
    if (seed) {
      await runSeeders(connection);
    }
    console.log('\nDatabase setup complete.');
  } finally {
    await connection.end();
  }
}

async function migrate() {
  const connection = await getConnection();
  try {
    await ensureDatabase(connection);
    await runMigrations(connection);
    console.log(`Migrations complete (database: ${DB_NAME}).`);
  } finally {
    await connection.end();
  }
}

async function seed() {
  const connection = await getConnection();
  try {
    await ensureDatabase(connection);
    const hasUsers = await tableExists(connection, 'users');
    if (!hasUsers) {
      throw new Error(
        `Cannot seed: \`${DB_NAME}.users\` does not exist. Run migrations first (RUN_MIGRATIONS=true).`,
      );
    }
    await runSeeders(connection);
    console.log(`Seeders complete (database: ${DB_NAME}).`);
  } finally {
    await connection.end();
  }
}

const command = process.argv[2] || 'setup';

const runners = { setup, migrate, seed };

if (!runners[command]) {
  console.error(`Unknown command: ${command}. Use: setup | migrate | seed`);
  process.exit(1);
}

runners[command]().catch((err) => {
  console.error('Database command failed:', err.message || err);
  if (err.code === 'ECONNREFUSED') {
    console.error('Hint: Ensure MySQL 8 is running and DB_* env vars in .env are correct.');
  }
  if (err.code === 'ER_TABLE_EXISTS_ERROR') {
    console.error('Hint: Tables already exist. Drop database `justtap` or run on a fresh instance.');
  }
  if (err.code === 'ER_DUP_ENTRY' && err.message?.includes('schema_migrations')) {
    console.error('Hint: Migration tracking conflict — contact support or reset schema_migrations table.');
  }
  process.exit(1);
});

module.exports = { setup, migrate, seed };
