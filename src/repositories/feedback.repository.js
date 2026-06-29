const pool = require('../config/database');
const { parsePagination, buildPaginatedResponse, sanitizeSortBy } = require('../helpers/pagination');

const formatFeedback = (r) => ({
  id: String(r.id),
  uuid: r.uuid,
  eventId: r.event_id,
  clientName: r.client_name,
  rating: Number(r.rating),
  comment: r.comment,
  tableNo: r.table_no,
  time: r.created_at,
  sentiment: r.sentiment,
  replyText: r.reply_text,
  isFlagged: Boolean(r.is_flagged),
  createdAt: r.created_at,
});

const feedbackRepository = {
  async getSummary(eventId) {
    const [rows] = await pool.execute(
      `SELECT AVG(rating) AS avgRating, COUNT(*) AS reviewCount
       FROM feedback_reviews WHERE event_id = ? AND deleted_at IS NULL`,
      [eventId]
    );
    return {
      avgRating: rows[0].avgRating ? Number(Number(rows[0].avgRating).toFixed(1)) : 0,
      reviewCount: rows[0].reviewCount || 0,
    };
  },

  async findByEvent(eventId, query) {
    const { page, limit, offset, sortOrder } = parsePagination(query);
    const sortBy = sanitizeSortBy('feedback', query.sortBy);
    const conditions = ['event_id = ?', 'deleted_at IS NULL'];
    const params = [eventId];
    if (query.stars) {
      conditions.push('FLOOR(rating) = ?');
      params.push(Number(query.stars));
    }
    if (query.sentiment) {
      conditions.push('sentiment = ?');
      params.push(query.sentiment);
    }
    if (query.search) {
      conditions.push('(client_name LIKE ? OR comment LIKE ?)');
      const s = `%${query.search}%`;
      params.push(s, s);
    }
    const where = conditions.join(' AND ');
    const [countRows] = await pool.execute(`SELECT COUNT(*) AS total FROM feedback_reviews WHERE ${where}`, params);
    const [rows] = await pool.execute(
      `SELECT * FROM feedback_reviews WHERE ${where} ORDER BY ${sortBy} ${sortOrder} LIMIT ${limit} OFFSET ${offset}`,
      params
    );
    return buildPaginatedResponse(rows.map(formatFeedback), countRows[0].total, page, limit);
  },

  async findByEventForExport(eventId, query) {
    const conditions = ['event_id = ?', 'deleted_at IS NULL'];
    const params = [eventId];
    if (query.stars) {
      conditions.push('FLOOR(rating) = ?');
      params.push(Number(query.stars));
    }
    const [rows] = await pool.execute(
      `SELECT * FROM feedback_reviews WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`,
      params
    );
    return rows.map(formatFeedback);
  },

  async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM feedback_reviews WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    return rows[0] || null;
  },

  async reply(id, replyText) {
    await pool.execute(
      'UPDATE feedback_reviews SET reply_text = ?, replied_at = NOW(), updated_at = NOW() WHERE id = ?',
      [replyText, id]
    );
  },

  async flag(id) {
    await pool.execute(
      'UPDATE feedback_reviews SET is_flagged = 1, updated_at = NOW() WHERE id = ?',
      [id]
    );
  },

  async bulkFlag(ids) {
    if (!ids.length) return 0;
    const placeholders = ids.map(() => '?').join(',');
    const [result] = await pool.execute(
      `UPDATE feedback_reviews SET is_flagged = 1, updated_at = NOW() WHERE id IN (${placeholders}) AND deleted_at IS NULL`,
      ids
    );
    return result.affectedRows;
  },

  async bulkDelete(ids) {
    if (!ids.length) return 0;
    const placeholders = ids.map(() => '?').join(',');
    const [result] = await pool.execute(
      `UPDATE feedback_reviews SET deleted_at = NOW() WHERE id IN (${placeholders}) AND deleted_at IS NULL`,
      ids
    );
    return result.affectedRows;
  },
};

module.exports = feedbackRepository;
