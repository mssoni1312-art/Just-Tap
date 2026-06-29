const pool = require('../config/database');

/**
 * Shared query helpers for repositories.
 */
const baseRepository = {
  async exists(table, id, softDelete = true) {
    const deletedClause = softDelete ? 'AND deleted_at IS NULL' : '';
    const [rows] = await pool.execute(
      `SELECT id FROM ${table} WHERE id = ? ${deletedClause}`,
      [id]
    );
    return Boolean(rows[0]);
  },
};

module.exports = baseRepository;
