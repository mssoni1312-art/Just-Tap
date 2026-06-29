const pool = require('../config/database');

const activityRepository = {
  async log({ eventId, userId, action, description, metadata }) {
    await pool.execute(
      'INSERT INTO activity_logs (event_id, user_id, action, description, metadata) VALUES (?, ?, ?, ?, ?)',
      [eventId || null, userId || null, action, description || null, metadata ? JSON.stringify(metadata) : null]
    );
  },

  async findRecent(limit = 20) {
    const [rows] = await pool.execute(
      `SELECT al.*, u.first_name, u.last_name
       FROM activity_logs al
       LEFT JOIN users u ON u.id = al.user_id
       ORDER BY al.created_at DESC LIMIT ${Number(limit)}`
    );
    return rows;
  },

  async findByEvent(eventId, limit = 20) {
    const [rows] = await pool.execute(
      `SELECT al.*, u.first_name, u.last_name
       FROM activity_logs al
       LEFT JOIN users u ON u.id = al.user_id
       WHERE al.event_id = ?
       ORDER BY al.created_at DESC LIMIT ${Number(limit)}`,
      [eventId]
    );
    return rows.map((r) => ({
      id: r.id,
      action: r.action,
      description: r.description,
      metadata: r.metadata,
      userName: r.first_name ? `${r.first_name} ${r.last_name}` : null,
      createdAt: r.created_at,
    }));
  },
};

module.exports = activityRepository;
