const pool = require('../config/database');

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
