const pool = require('../config/database');

const formatProgressRow = (row) => ({
  id: row.id,
  eventId: row.event_id,
  status: row.status,
  actualArrivalTime: row.actual_arrival_time,
  followersAchievedCount: Number(row.followers_achieved_count) || 0,
  testimonialReelsAchievedCount: Number(row.testimonial_reels_achieved_count) || 0,
  activeSessionRecording: Boolean(row.active_session_recording),
  numberOfVideoShoots: Number(row.number_of_video_shoots) || 0,
  mainEventHighlights: Boolean(row.main_event_highlights),
  photosCaptured: Number(row.photos_captured) || 0,
  amountCollected: row.amount_collected != null ? Number(row.amount_collected) : 0,
  completedAt: row.completed_at,
  abandonedAt: row.abandoned_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const formatAttachment = (row) => ({
  id: row.id,
  uuid: row.uuid,
  eventId: row.event_id,
  uploadId: row.upload_id,
  fileUrl: row.file_url,
  originalName: row.original_name,
  mimeType: row.mime_type,
  sizeBytes: row.size_bytes,
  createdAt: row.created_at,
});

const allTaskRepository = {
  async findProgressByEventId(eventId) {
    const [rows] = await pool.execute(
      `SELECT * FROM event_all_tasks
       WHERE event_id = ? AND deleted_at IS NULL
       LIMIT 1`,
      [eventId]
    );
    return rows[0] ? formatProgressRow(rows[0]) : null;
  },

  async getReportingTime(eventId) {
    const [rows] = await pool.execute(
      `SELECT MIN(start_time) AS reporting_time
       FROM event_functions
       WHERE event_id = ? AND deleted_at IS NULL AND start_time IS NOT NULL`,
      [eventId]
    );
    return rows[0]?.reporting_time || null;
  },

  async ensureProgress(eventId) {
    const existing = await this.findProgressByEventId(eventId);
    if (existing) return existing;

    const [result] = await pool.execute(
      `INSERT INTO event_all_tasks (event_id) VALUES (?)`,
      [eventId]
    );
    const [rows] = await pool.execute(
      'SELECT * FROM event_all_tasks WHERE id = ?',
      [result.insertId]
    );
    return formatProgressRow(rows[0]);
  },

  async updateProgress(eventId, data) {
    const fields = [];
    const values = [];
    const map = {
      actual_arrival_time: 'actualArrivalTime',
      followers_achieved_count: 'followersAchievedCount',
      testimonial_reels_achieved_count: 'testimonialReelsAchievedCount',
      active_session_recording: 'activeSessionRecording',
      number_of_video_shoots: 'numberOfVideoShoots',
      main_event_highlights: 'mainEventHighlights',
      photos_captured: 'photosCaptured',
      amount_collected: 'amountCollected',
    };

    for (const [col, key] of Object.entries(map)) {
      if (data[key] !== undefined) {
        fields.push(`${col} = ?`);
        if (col === 'active_session_recording' || col === 'main_event_highlights') {
          values.push(data[key] ? 1 : 0);
        } else {
          values.push(data[key]);
        }
      }
    }

    if (!fields.length) return this.ensureProgress(eventId);

    await this.ensureProgress(eventId);
    values.push(eventId);
    await pool.execute(
      `UPDATE event_all_tasks SET ${fields.join(', ')}, updated_at = NOW()
       WHERE event_id = ? AND deleted_at IS NULL`,
      values
    );
    return this.findProgressByEventId(eventId);
  },

  async setStatus(eventId, status) {
    await this.ensureProgress(eventId);
    const completedAt = status === 'completed' ? new Date() : null;
    const abandonedAt = status === 'abandoned' ? new Date() : null;
    await pool.execute(
      `UPDATE event_all_tasks
       SET status = ?, completed_at = ?, abandoned_at = ?, updated_at = NOW()
       WHERE event_id = ? AND deleted_at IS NULL`,
      [status, completedAt, abandonedAt, eventId]
    );
    return this.findProgressByEventId(eventId);
  },

  async listAttachments(eventId) {
    const [rows] = await pool.execute(
      `SELECT * FROM event_all_task_attachments
       WHERE event_id = ? AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      [eventId]
    );
    return rows.map(formatAttachment);
  },

  async addAttachment(eventId, data) {
    const [result] = await pool.execute(
      `INSERT INTO event_all_task_attachments
         (event_id, upload_id, file_url, original_name, mime_type, size_bytes, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        eventId,
        data.uploadId || null,
        data.fileUrl,
        data.originalName,
        data.mimeType || null,
        data.sizeBytes || null,
        data.uploadedBy || null,
      ]
    );
    const [rows] = await pool.execute(
      'SELECT * FROM event_all_task_attachments WHERE id = ?',
      [result.insertId]
    );
    return formatAttachment(rows[0]);
  },

  async findAttachmentById(id) {
    const [rows] = await pool.execute(
      `SELECT * FROM event_all_task_attachments
       WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );
    return rows[0] ? formatAttachment(rows[0]) : null;
  },

  async softDeleteAttachment(id) {
    await pool.execute(
      'UPDATE event_all_task_attachments SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
  },
};

module.exports = allTaskRepository;
