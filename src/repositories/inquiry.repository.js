const pool = require('../config/database');
const { parsePagination, buildPaginatedResponse, sanitizeSortBy } = require('../helpers/pagination');

const formatInquiryDay = (row) => ({
  id: String(row.id),
  dayNumber: row.day_number,
  date: row.event_date,
  venueName: row.venue_name,
  functionName: row.function_name,
  city: row.city,
  tabletsCount: row.tablets_count,
  timeSlot: row.time_slot,
});

const formatInquiry = (row, eventDays = []) => ({
  id: String(row.id),
  uuid: row.uuid,
  refNumber: row.ref_number,
  clientName: row.client_name,
  clientPhone: row.client_phone,
  dateType: row.date_type || 'single',
  date: row.event_date,
  timeSlot: row.time_slot,
  venue: row.venue,
  functionName: row.function_name,
  packageName: row.package_name,
  packageId: row.package_id,
  capacity: row.capacity,
  totalEstimate: row.total_estimate != null ? Number(row.total_estimate) : null,
  source: row.source || 'admin',
  status: row.status,
  convertedEventId: row.converted_event_id,
  eventDays: eventDays.map(formatInquiryDay),
  selectedDaysCount: eventDays.length || (row.event_date ? 1 : 0),
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
  if (query.source) {
    conditions.push('source = ?');
    params.push(query.source);
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
  formatInquiryDay,

  async findDaysByInquiryId(inquiryId) {
    const [rows] = await pool.execute(
      `SELECT * FROM inquiry_days
       WHERE inquiry_id = ?
       ORDER BY day_number ASC, event_date ASC`,
      [inquiryId]
    );
    return rows;
  },

  async findDaysByInquiryIds(inquiryIds) {
    if (!inquiryIds.length) return new Map();
    const placeholders = inquiryIds.map(() => '?').join(',');
    const [rows] = await pool.execute(
      `SELECT * FROM inquiry_days
       WHERE inquiry_id IN (${placeholders})
       ORDER BY inquiry_id ASC, day_number ASC, event_date ASC`,
      inquiryIds
    );
    const grouped = new Map();
    for (const row of rows) {
      const key = row.inquiry_id;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(row);
    }
    return grouped;
  },

  async formatInquiryWithDays(row, daysByInquiryId) {
    const days = daysByInquiryId
      ? (daysByInquiryId.get(row.id) || [])
      : await this.findDaysByInquiryId(row.id);
    return formatInquiry(row, days);
  },

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
    const inquiryIds = rows.map((row) => row.id);
    const daysByInquiryId = await this.findDaysByInquiryIds(inquiryIds);
    return buildPaginatedResponse(
      rows.map((row) => formatInquiry(row, daysByInquiryId.get(row.id) || [])),
      countRows[0].total,
      page,
      limit
    );
  },

  async findAllForExport(query) {
    const { where, params } = buildInquiryWhere(query);
    const sortBy = sanitizeSortBy('inquiries', query.sortBy || 'created_at');
    const sortOrder = (query.sortOrder || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    const [rows] = await pool.execute(
      `SELECT * FROM inquiries WHERE ${where} ORDER BY ${sortBy} ${sortOrder}`,
      params
    );
    const inquiryIds = rows.map((row) => row.id);
    const daysByInquiryId = await this.findDaysByInquiryIds(inquiryIds);
    return rows.map((row) => formatInquiry(row, daysByInquiryId.get(row.id) || []));
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
        ref_number, client_name, client_phone, date_type, event_date, time_slot, venue,
        function_name, package_name, package_id, capacity, total_estimate, source, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        data.ref_number,
        data.client_name,
        data.client_phone || null,
        data.date_type || 'single',
        data.event_date || null,
        data.time_slot || null,
        data.venue || null,
        data.function_name || null,
        data.package_name || null,
        data.package_id || null,
        data.capacity || null,
        data.total_estimate ?? null,
        data.source || 'admin',
      ]
    );
    return result.insertId;
  },

  async createWithDays(inquiryData, days) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [result] = await conn.execute(
        `INSERT INTO inquiries (
          ref_number, client_name, client_phone, date_type, event_date, time_slot, venue,
          function_name, package_name, package_id, capacity, total_estimate, source, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [
          inquiryData.ref_number,
          inquiryData.client_name,
          inquiryData.client_phone || null,
          inquiryData.date_type,
          inquiryData.event_date || null,
          inquiryData.time_slot || null,
          inquiryData.venue || null,
          inquiryData.function_name || null,
          inquiryData.package_name || null,
          inquiryData.package_id || null,
          inquiryData.capacity || null,
          inquiryData.total_estimate ?? null,
          inquiryData.source || 'client',
        ]
      );

      const inquiryId = result.insertId;

      for (const day of days) {
        await conn.execute(
          `INSERT INTO inquiry_days (
            inquiry_id, day_number, event_date, venue_name, function_name, city, tablets_count, time_slot
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            inquiryId,
            day.day_number,
            day.event_date,
            day.venue_name,
            day.function_name,
            day.city,
            day.tablets_count,
            day.time_slot,
          ]
        );
      }

      await conn.commit();
      return inquiryId;
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
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
