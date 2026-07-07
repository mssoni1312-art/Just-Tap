const pool = require('../config/database');
const AppError = require('../utils/AppError');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isUuid = (value) => typeof value === 'string' && UUID_REGEX.test(value);

const isNumericId = (value) => /^\d+$/.test(String(value));

/**
 * Resolve a route param to internal BIGINT id.
 * @param {string} table - Table name
 * @param {string|number} idOrUuid
 * @param {{ softDelete?: boolean }} options
 */
async function resolveId(table, idOrUuid, { softDelete = true } = {}) {
  if (idOrUuid === undefined || idOrUuid === null || idOrUuid === '') {
    throw new AppError('Invalid id', 400);
  }

  const deletedClause = softDelete ? 'AND deleted_at IS NULL' : '';

  try {
    if (isNumericId(idOrUuid)) {
      const id = Number(idOrUuid);
      const [rows] = await pool.execute(
        `SELECT id FROM ${table} WHERE id = ? ${deletedClause}`,
        [id]
      );
      if (!rows[0]) throw new AppError('Resource not found', 404);
      return rows[0].id;
    }

    if (isUuid(idOrUuid)) {
      const [rows] = await pool.execute(
        `SELECT id FROM ${table} WHERE uuid = ? ${deletedClause}`,
        [idOrUuid]
      );
      if (!rows[0]) throw new AppError('Resource not found', 404);
      return rows[0].id;
    }
  } catch (err) {
    if (err instanceof AppError) throw err;
    if (err.code === 'ECONNREFUSED' || err.name === 'AggregateError') {
      throw new AppError('Database unavailable', 503);
    }
    throw err;
  }

  throw new AppError('Invalid id format', 400);
}

async function resolveIds(table, idsOrUuids, options) {
  const resolved = [];
  for (const value of idsOrUuids) {
    resolved.push(await resolveId(table, value, options));
  }
  return resolved;
}

module.exports = { resolveId, resolveIds, isUuid, isNumericId };
