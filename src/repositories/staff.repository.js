const pool = require('../config/database');
const { parsePagination, buildPaginatedResponse, sanitizeSortBy } = require('../helpers/pagination');

const STAFF_USER_JOIN =
  'LEFT JOIN users u ON u.id = s.user_id AND u.deleted_at IS NULL';

const formatStaff = (row) => ({
  id: row.id,
  uuid: row.uuid,
  name: row.name,
  role: row.role,
  designation: row.designation || null,
  isActive: Boolean(row.is_active),
  userId: row.user_id || null,
  email: row.user_email || null,
  isRegistered: Boolean(row.user_id),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const buildStaffFilters = (query, alias = '') => {
  const prefix = alias ? `${alias}.` : '';
  const conditions = [`${prefix}deleted_at IS NULL`];
  const params = [];

  if (query.role) {
    conditions.push(`${prefix}role = ?`);
    params.push(query.role);
  }
  if (query.isActive !== undefined) {
    conditions.push(`${prefix}is_active = ?`);
    params.push(query.isActive ? 1 : 0);
  } else if (query.includeInactive !== 'true') {
    conditions.push(`${prefix}is_active = 1`);
  }
  if (query.search) {
    conditions.push(`${prefix}name LIKE ?`);
    params.push(`%${query.search}%`);
  }

  return { conditions, params };
};

const buildDedupedStaffQuery = (query) => {
  const inner = buildStaffFilters(query);
  const outer = buildStaffFilters(query, 's');
  const dedupSubquery = `
    SELECT MIN(id) AS id
    FROM staff
    WHERE ${inner.conditions.join(' AND ')}
    GROUP BY LOWER(TRIM(name)), role
  `;

  return {
    fromClause: `staff s`,
    whereClause: `s.id IN (${dedupSubquery}) AND ${outer.conditions.join(' AND ')}`,
    params: [...inner.params, ...outer.params],
  };
};

const staffRepository = {
  formatStaff,

  async findAll(query) {
    const { page, limit, offset, sortOrder } = parsePagination(query);
    const sortBy = sanitizeSortBy('staff', query.sortBy);
    const { whereClause, params } = buildDedupedStaffQuery(query);

    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM staff s WHERE ${whereClause}`,
      params
    );
    const [rows] = await pool.execute(
      `SELECT s.*, u.email AS user_email
       FROM staff s
       ${STAFF_USER_JOIN}
       WHERE ${whereClause}
       ORDER BY s.${sortBy} ${sortOrder}
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );
    return buildPaginatedResponse(rows.map(formatStaff), countRows[0].total, page, limit);
  },

  async findAllForExport(query) {
    const { whereClause, params } = buildDedupedStaffQuery(query);
    const sortBy = sanitizeSortBy('staff', query.sortBy || 'name');
    const sortOrder = (query.sortOrder || 'asc').toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    const [rows] = await pool.execute(
      `SELECT s.*, u.email AS user_email
       FROM staff s
       ${STAFF_USER_JOIN}
       WHERE ${whereClause}
       ORDER BY s.${sortBy} ${sortOrder}`,
      params
    );
    return rows.map(formatStaff);
  },

  async findByNameAndRole(name, role) {
    const [rows] = await pool.execute(
      `SELECT * FROM staff
       WHERE deleted_at IS NULL
         AND role = ?
         AND LOWER(TRIM(name)) = LOWER(TRIM(?))
       ORDER BY id ASC
       LIMIT 1`,
      [role, name]
    );
    return rows[0] || null;
  },

  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT s.*, u.email AS user_email
       FROM staff s
       ${STAFF_USER_JOIN}
       WHERE s.id = ? AND s.deleted_at IS NULL`,
      [id]
    );
    return rows[0] || null;
  },

  async linkUserId(staffId, userId) {
    await pool.execute(
      'UPDATE staff SET user_id = ?, updated_at = NOW() WHERE id = ? AND deleted_at IS NULL',
      [userId, staffId]
    );
  },

  async findByUserId(userId) {
    const [rows] = await pool.execute(
      `SELECT * FROM staff
       WHERE user_id = ? AND deleted_at IS NULL AND role = 'event_manager' AND is_active = 1
       LIMIT 1`,
      [userId]
    );
    return rows[0] || null;
  },

  async create(data) {
    const [result] = await pool.execute(
      'INSERT INTO staff (name, role, designation, is_active) VALUES (?, ?, ?, ?)',
      [
        data.name,
        data.role || 'event_manager',
        data.designation || null,
        data.is_active !== false ? 1 : 0,
      ]
    );
    return result.insertId;
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    for (const key of ['name', 'role', 'designation', 'is_active']) {
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
