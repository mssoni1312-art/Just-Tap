const pool = require('../config/database');

const formatRow = (row) => ({
  id: row.id,
  uuid: row.uuid,
  eventId: row.event_id || null,
  name: row.name,
  sortOrder: Number(row.sort_order) || 0,
  isActive: Boolean(row.is_active),
  createdBy: row.created_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const buildWhere = (query = {}) => {
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

const clientEventTitleRepository = {
  formatRow,

  async listAll(query = {}) {
    const { where, params } = buildWhere(query);
    const [rows] = await pool.execute(
      `SELECT * FROM client_event_titles
       WHERE ${where}
       ORDER BY sort_order ASC, name ASC`,
      params
    );
    return rows.map(formatRow);
  },

  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT * FROM client_event_titles
       WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );
    return rows[0] ? formatRow(rows[0]) : null;
  },

  async findByName(name, excludeId = null) {
    const params = [name.trim()];
    let sql = `SELECT id FROM client_event_titles
               WHERE LOWER(name) = LOWER(?) AND deleted_at IS NULL`;
    if (excludeId) {
      sql += ' AND id <> ?';
      params.push(excludeId);
    }
    const [rows] = await pool.execute(sql, params);
    return rows[0] || null;
  },

  async create(data) {
    const [result] = await pool.execute(
      `INSERT INTO client_event_titles (event_id, name, sort_order, is_active, created_by)
       VALUES (?, ?, ?, ?, ?)`,
      [
        data.eventId || null,
        data.name,
        data.sortOrder ?? 0,
        data.isActive !== false ? 1 : 0,
        data.createdBy || null,
      ]
    );
    return this.findById(result.insertId);
  },

  async softDelete(id) {
    await pool.execute(
      'UPDATE client_event_titles SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
  },

  async listCategoriesForClientFeed() {
    const [rows] = await pool.execute(
      `SELECT DISTINCT cet.id, cet.uuid, cet.name, cet.sort_order
       FROM client_event_titles cet
       WHERE cet.deleted_at IS NULL AND cet.is_active = 1
       ORDER BY cet.sort_order ASC, cet.name ASC`
    );
    return rows.map((row) => ({
      id: row.id,
      uuid: row.uuid,
      name: row.name,
      sortOrder: Number(row.sort_order) || 0,
    }));
  },
};

module.exports = clientEventTitleRepository;
