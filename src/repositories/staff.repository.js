const pool = require('../config/database');
const { parsePagination, buildPaginatedResponse, sanitizeSortBy } = require('../helpers/pagination');

const formatStaff = (row) => ({
  id: row.id,
  uuid: row.uuid,
  name: row.name,
  role: row.role,
  isActive: Boolean(row.is_active),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const buildStaffWhere = (query) => {
  const conditions = ['deleted_at IS NULL'];
  const params = [];
  if (query.role) {
    conditions.push('role = ?');
    params.push(query.role);
  }
  if (query.isActive !== undefined) {
    conditions.push('is_active = ?');
    params.push(query.isActive ? 1 : 0);
  } else if (query.includeInactive !== 'true') {
    conditions.push('is_active = 1');
  }
  if (query.search) {
    conditions.push('name LIKE ?');
    params.push(`%${query.search}%`);
  }
  return { where: conditions.join(' AND '), params };
};

const staffRepository = {
  formatStaff,

  async findAll(query) {
    const { page, limit, offset, sortOrder } = parsePagination(query);
    const sortBy = sanitizeSortBy('staff', query.sortBy);
    const { where, params } = buildStaffWhere(query);

    const [countRows] = await pool.execute(`SELECT COUNT(*) AS total FROM staff WHERE ${where}`, params);
    const [rows] = await pool.execute(
      `SELECT * FROM staff WHERE ${where} ORDER BY ${sortBy} ${sortOrder} LIMIT ${limit} OFFSET ${offset}`,
      params
    );
    return buildPaginatedResponse(rows.map(formatStaff), countRows[0].total, page, limit);
  },

  async findAllForExport(query) {
    const { where, params } = buildStaffWhere(query);
    const sortBy = sanitizeSortBy('staff', query.sortBy || 'name');
    const sortOrder = (query.sortOrder || 'asc').toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    const [rows] = await pool.execute(
      `SELECT * FROM staff WHERE ${where} ORDER BY ${sortBy} ${sortOrder}`,
      params
    );
    return rows.map(formatStaff);
  },

  async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM staff WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    return rows[0] || null;
  },

  async create(data) {
    const [result] = await pool.execute(
      'INSERT INTO staff (name, role, is_active) VALUES (?, ?, ?)',
      [data.name, data.role || 'event_manager', data.is_active !== false ? 1 : 0]
    );
    return result.insertId;
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    for (const key of ['name', 'role', 'is_active']) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(key === 'is_active' ? (data[key] ? 1 : 0) : data[key]);
      }
    }
    if (!fields.length) return;
    values.push(id);
    await pool.execute(
      `UPDATE staff SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ? AND deleted_at IS NULL`,
      values
    );
  },

  async softDelete(id) {
    await pool.execute('UPDATE staff SET deleted_at = NOW(), is_active = 0 WHERE id = ? AND deleted_at IS NULL', [id]);
  },

  async bulkDelete(ids) {
    if (!ids.length) return 0;
    const placeholders = ids.map(() => '?').join(',');
    const [result] = await pool.execute(
      `UPDATE staff SET deleted_at = NOW(), is_active = 0 WHERE id IN (${placeholders}) AND deleted_at IS NULL`,
      ids
    );
    return result.affectedRows;
  },

  async bulkUpdate(ids, data) {
    if (!ids.length) return 0;
    const fields = [];
    const values = [];
    if (data.is_active !== undefined) {
      fields.push('is_active = ?');
      values.push(data.is_active ? 1 : 0);
    }
    if (data.role) {
      fields.push('role = ?');
      values.push(data.role);
    }
    if (!fields.length) return 0;
    const placeholders = ids.map(() => '?').join(',');
    const [result] = await pool.execute(
      `UPDATE staff SET ${fields.join(', ')}, updated_at = NOW() WHERE id IN (${placeholders}) AND deleted_at IS NULL`,
      [...values, ...ids]
    );
    return result.affectedRows;
  },
};

module.exports = staffRepository;
