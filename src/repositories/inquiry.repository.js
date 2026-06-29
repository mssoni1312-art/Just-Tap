const pool = require('../config/database');
const { parsePagination, buildPaginatedResponse, sanitizeSortBy } = require('../helpers/pagination');

const formatInquiry = (row) => ({
  id: String(row.id),
  uuid: row.uuid,
  refNumber: row.ref_number,
  clientName: row.client_name,
  clientPhone: row.client_phone,
  date: row.event_date,
  timeSlot: row.time_slot,
  venue: row.venue,
  functionName: row.function_name,
  packageName: row.package_name,
  packageId: row.package_id,
  capacity: row.capacity,
  status: row.status,
  convertedEventId: row.converted_event_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const buildInquiryWhere = (query) => {
  const conditions = ['deleted_at IS NULL'];
  const params = [];
  if (query.status) {
    conditions.push('status = ?');
    params.push(query.status);
  }
  if (query.search) {
    conditions.push('(client_name LIKE ? OR ref_number LIKE ? OR venue LIKE ? OR client_phone LIKE ?)');
    const s = `%${query.search}%`;
    params.push(s, s, s, s);
  }
  if (query.startDate) {
    conditions.push('event_date >= ?');
    params.push(query.startDate);
  }
  if (query.endDate) {
    conditions.push('event_date <= ?');
    params.push(query.endDate);
  }
  return { where: conditions.join(' AND '), params };
};

const inquiryRepository = {
  formatInquiry,

  async getStats() {
    const [rows] = await pool.execute(
      `SELECT
         COUNT(*) AS pendingCount,
         SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) AS recentCount
       FROM inquiries WHERE status = 'pending' AND deleted_at IS NULL`
    );
    return {
      pendingCount: Number(rows[0].pendingCount) || 0,
      badgeCount: Number(rows[0].recentCount) || 0,
    };
  },

  async findAll(query) {
    const { page, limit, offset, sortOrder } = parsePagination(query);
    const sortBy = sanitizeSortBy('inquiries', query.sortBy);
    const { where, params } = buildInquiryWhere(query);

    const [countRows] = await pool.execute(`SELECT COUNT(*) AS total FROM inquiries WHERE ${where}`, params);
    const [rows] = await pool.execute(
      `SELECT * FROM inquiries WHERE ${where} ORDER BY ${sortBy} ${sortOrder} LIMIT ${limit} OFFSET ${offset}`,
      params
    );
    return buildPaginatedResponse(rows.map(formatInquiry), countRows[0].total, page, limit);
  },

  async findAllForExport(query) {
    const { where, params } = buildInquiryWhere(query);
    const sortBy = sanitizeSortBy('inquiries', query.sortBy || 'created_at');
    const sortOrder = (query.sortOrder || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    const [rows] = await pool.execute(
      `SELECT * FROM inquiries WHERE ${where} ORDER BY ${sortBy} ${sortOrder}`,
      params
    );
    return rows.map(formatInquiry);
  },

  async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM inquiries WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    return rows[0] || null;
  },

  async create(data) {
    const [result] = await pool.execute(
      `INSERT INTO inquiries (
        ref_number, client_name, client_phone, event_date, time_slot, venue,
        function_name, package_name, package_id, capacity, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        data.ref_number,
        data.client_name,
        data.client_phone || null,
        data.event_date,
        data.time_slot,
        data.venue,
        data.function_name,
        data.package_name,
        data.package_id || null,
        data.capacity,
      ]
    );
    return result.insertId;
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    const allowed = [
      'client_name', 'client_phone', 'event_date', 'time_slot', 'venue',
      'function_name', 'package_name', 'package_id', 'capacity', 'status',
    ];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    }
    if (!fields.length) return;
    values.push(id);
    await pool.execute(
      `UPDATE inquiries SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ? AND deleted_at IS NULL`,
      values
    );
  },

  async softDelete(id) {
    await pool.execute('UPDATE inquiries SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL', [id]);
  },

  async bulkDelete(ids) {
    if (!ids.length) return 0;
    const placeholders = ids.map(() => '?').join(',');
    const [result] = await pool.execute(
      `UPDATE inquiries SET deleted_at = NOW() WHERE id IN (${placeholders}) AND deleted_at IS NULL`,
      ids
    );
    return result.affectedRows;
  },

  async bulkUpdate(ids, data) {
    if (!ids.length) return 0;
    const fields = [];
    const values = [];
    if (data.status) {
      fields.push('status = ?');
      values.push(data.status);
    }
    if (!fields.length) return 0;
    const placeholders = ids.map(() => '?').join(',');
    const [result] = await pool.execute(
      `UPDATE inquiries SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id IN (${placeholders}) AND deleted_at IS NULL`,
      [...values, ...ids]
    );
    return result.affectedRows;
  },

  async markConverted(id, eventId) {
    await pool.execute(
      "UPDATE inquiries SET status = 'converted', converted_event_id = ?, updated_at = NOW() WHERE id = ?",
      [eventId, id]
    );
  },

  async generateRefNumber() {
    const [rows] = await pool.execute(
      `SELECT CONCAT('INQ-', LPAD(COALESCE(MAX(id), 0) + 1, 4, '0'), '-', YEAR(CURDATE())) AS ref_number
       FROM inquiries`
    );
    return rows[0].ref_number;
  },
};

module.exports = inquiryRepository;
