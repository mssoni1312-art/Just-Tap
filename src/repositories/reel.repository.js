const pool = require('../config/database');
const { parsePagination, buildPaginatedResponse } = require('../helpers/pagination');

const formatReelRow = (row) => ({
  id: row.id,
  uuid: row.uuid,
  eventId: row.event_id || null,
  ourEventId: row.client_event_title_id,
  ourEventUuid: row.our_event_uuid || null,
  ourEventName: row.our_event_name || null,
  uploadId: row.upload_id,
  videoUrl: row.video_url,
  name: row.name,
  venueName: row.venue_name,
  guestCount: Number(row.guest_count),
  uploadedBy: row.uploaded_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const formatClientFeedRow = (row) => ({
  ...formatReelRow(row),
  providerName: row.caterer_name || row.client_name || 'Just Tap',
  catererName: row.caterer_name || null,
  clientName: row.client_name || null,
  cityName: row.event_city_name || row.venue_name || null,
});

const reelSelect = `er.*, cet.uuid AS our_event_uuid, cet.name AS our_event_name`;

const reelFrom = `event_reels er
  LEFT JOIN client_event_titles cet
    ON cet.id = er.client_event_title_id AND cet.deleted_at IS NULL`;

const buildListQuery = (query = {}) => {
  const { page, limit, offset } = parsePagination(query);
  const conditions = ['er.deleted_at IS NULL'];
  const params = [];

  if (query.ourEventId) {
    conditions.push('er.client_event_title_id = ?');
    params.push(query.ourEventId);
  }
  if (query.search) {
    conditions.push('(er.name LIKE ? OR er.venue_name LIKE ?)');
    const term = `%${query.search}%`;
    params.push(term, term);
  }

  return { page, limit, offset, where: conditions.join(' AND '), params };
};

const reelRepository = {
  async list(query = {}) {
    const { page, limit, offset, where, params } = buildListQuery(query);
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM event_reels er WHERE ${where}`,
      params
    );

    const [rows] = await pool.execute(
      `SELECT ${reelSelect}
       FROM ${reelFrom}
       WHERE ${where}
       ORDER BY er.created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    return buildPaginatedResponse(rows.map(formatReelRow), countRows[0].total, page, limit);
  },

  async listForClientFeed(query = {}) {
    const { page, limit, offset, where, params } = buildListQuery(query);
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM event_reels er WHERE ${where}`,
      params
    );

    const [rows] = await pool.execute(
      `SELECT ${reelSelect}
       FROM ${reelFrom}
       WHERE ${where}
       ORDER BY er.created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    return buildPaginatedResponse(rows.map(formatClientFeedRow), countRows[0].total, page, limit);
  },

  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT ${reelSelect}
       FROM ${reelFrom}
       WHERE er.id = ? AND er.deleted_at IS NULL`,
      [id]
    );
    return rows[0] ? formatReelRow(rows[0]) : null;
  },

  async create(data) {
    const [result] = await pool.execute(
      `INSERT INTO event_reels
         (event_id, client_event_title_id, upload_id, video_url, name, venue_name, guest_count, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.eventId || null,
        data.ourEventId || null,
        data.uploadId || null,
        data.videoUrl,
        data.name,
        data.venueName,
        data.guestCount,
        data.uploadedBy || null,
      ]
    );
    return this.findById(result.insertId);
  },

  async softDelete(id) {
    await pool.execute(
      'UPDATE event_reels SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
  },
};

module.exports = reelRepository;
