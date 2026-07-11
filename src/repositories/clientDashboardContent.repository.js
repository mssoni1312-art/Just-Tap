const pool = require('../config/database');
const { parsePagination, buildPaginatedResponse } = require('../helpers/pagination');

const formatRow = (row) => ({
  id: row.id,
  uuid: row.uuid,
  contentType: row.content_type,
  uploadId: row.upload_id,
  videoUrl: row.video_url,
  description: row.description,
  name: row.name,
  rating: row.rating !== null ? Number(row.rating) : null,
  sortOrder: Number(row.sort_order) || 0,
  createdBy: row.created_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const buildListByTypeQuery = (contentType, query = {}) => {
  const { page, limit, offset } = parsePagination(query);
  const conditions = ['content_type = ?', 'deleted_at IS NULL'];
  const params = [contentType];

  if (query.search) {
    if (contentType === 'testimonial') {
      conditions.push('(name LIKE ? OR description LIKE ?)');
      const term = `%${query.search}%`;
      params.push(term, term);
    } else {
      conditions.push('description LIKE ?');
      params.push(`%${query.search}%`);
    }
  }

  return { page, limit, offset, where: conditions.join(' AND '), params };
};

const clientDashboardContentRepository = {
  async listByType(contentType) {
    const [rows] = await pool.execute(
      `SELECT * FROM client_dashboard_content
       WHERE content_type = ? AND deleted_at IS NULL
       ORDER BY sort_order ASC, created_at DESC`,
      [contentType]
    );
    return rows.map(formatRow);
  },

  async listByTypePaginated(contentType, query = {}) {
    const { page, limit, offset, where, params } = buildListByTypeQuery(contentType, query);
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM client_dashboard_content WHERE ${where}`,
      params
    );

    const [rows] = await pool.execute(
      `SELECT * FROM client_dashboard_content
       WHERE ${where}
       ORDER BY sort_order ASC, created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    return buildPaginatedResponse(rows.map(formatRow), countRows[0].total, page, limit);
  },

  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT * FROM client_dashboard_content
       WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );
    return rows[0] ? formatRow(rows[0]) : null;
  },

  async create(data) {
    const [result] = await pool.execute(
      `INSERT INTO client_dashboard_content
         (content_type, upload_id, video_url, description, name, rating, sort_order, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.contentType,
        data.uploadId || null,
        data.videoUrl || null,
        data.description,
        data.name || null,
        data.rating ?? null,
        data.sortOrder ?? 0,
        data.createdBy || null,
      ]
    );
    return this.findById(result.insertId);
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    const map = {
      upload_id: 'uploadId',
      video_url: 'videoUrl',
      description: 'description',
      name: 'name',
      rating: 'rating',
      sort_order: 'sortOrder',
    };

    for (const [col, key] of Object.entries(map)) {
      if (data[key] !== undefined) {
        fields.push(`${col} = ?`);
        values.push(data[key]);
      }
    }

    if (!fields.length) return this.findById(id);

    values.push(id);
    await pool.execute(
      `UPDATE client_dashboard_content SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = ? AND deleted_at IS NULL`,
      values
    );
    return this.findById(id);
  },

  async softDelete(id) {
    await pool.execute(
      'UPDATE client_dashboard_content SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
  },
};

module.exports = clientDashboardContentRepository;
