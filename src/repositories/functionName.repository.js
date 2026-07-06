const pool = require('../config/database');
const { parsePagination, buildPaginatedResponse, sanitizeSortBy } = require('../helpers/pagination');

const formatFunctionName = (row) => ({
  id: row.id,
  uuid: row.uuid,
  name: row.name,
  sortOrder: Number(row.sort_order),
  isActive: Boolean(row.is_active),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const buildWhere = (query) => {
  const conditions = ['deleted_at IS NULL'];
  const params = [];

  if (query.includeInactive !== 'true') {
    conditions.push('is_active = 1');
  }
  if (query.search) {
    conditions.push('name LIKE ?');
    params.push(`%${query.search}%`);
  }

  return { where: conditions.join(' AND '), params };
};

const functionNameRepository = {
  formatFunctionName,

  async findAll(query) {
    const { page, limit, offset, sortOrder } = parsePagination(query);
    const sortBy = sanitizeSortBy('function_names', query.sortBy);
    const { where, params } = buildWhere(query);

    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM function_names WHERE ${where}`,
      params
    );
    const [rows] = await pool.execute(
      `SELECT * FROM function_names WHERE ${where}
       ORDER BY ${sortBy} ${sortOrder}, name ASC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );
    return buildPaginatedResponse(rows.map(formatFunctionName), countRows[0].total, page, limit);
  },

  async findAllForSelect(query) {
    const { where, params } = buildWhere(query);
    const [rows] = await pool.execute(
      `SELECT * FROM function_names WHERE ${where}
       ORDER BY sort_order ASC, name ASC`,
      params
    );
    return rows.map(formatFunctionName);
  },

  async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM function_names WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    return rows[0] || null;
  },

  async findByName(name, excludeId = null) {
    const params = [name.trim()];
    let sql = 'SELECT id FROM function_names WHERE LOWER(name) = LOWER(?) AND deleted_at IS NULL';
    if (excludeId) {
      sql += ' AND id <> ?';
      params.push(excludeId);
    }
    const [rows] = await pool.execute(sql, params);
    return rows[0] || null;
  },

  async create(data) {
    const [result] = await pool.execute(
      `INSERT INTO function_names (name, sort_order, is_active)
       VALUES (?, ?, ?)`,
      [data.name, data.sort_order ?? 0, data.is_active ? 1 : 0]
    );
    return result.insertId;
  },

  async update(id, data) {
    const fields = [];
    const params = [];

    if (data.name !== undefined) {
      fields.push('name = ?');
      params.push(data.name);
    }
    if (data.sort_order !== undefined) {
      fields.push('sort_order = ?');
      params.push(data.sort_order);
    }
    if (data.is_active !== undefined) {
      fields.push('is_active = ?');
      params.push(data.is_active ? 1 : 0);
    }

    if (!fields.length) return false;

    params.push(id);
    const [result] = await pool.execute(
      `UPDATE function_names SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = ? AND deleted_at IS NULL`,
      params
    );
    return result.affectedRows > 0;
  },

  async softDelete(id) {
    const [result] = await pool.execute(
      'UPDATE function_names SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    return result.affectedRows > 0;
  },
};

module.exports = functionNameRepository;
