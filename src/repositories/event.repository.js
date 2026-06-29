const pool = require('../config/database');
const { parsePagination, buildPaginatedResponse, sanitizeSortBy } = require('../helpers/pagination');

const toDateOnly = (value) => {
  if (!value) return null;
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return String(value).slice(0, 10);
};

const formatEvent = (row) => ({
  id: String(row.id),
  uuid: row.uuid,
  clientName: row.client_name,
  clientMobile: row.client_mobile,
  venue: row.venue_name,
  venueName: row.venue_name,
  cityName: row.city_name,
  date: row.start_date,
  startDate: row.start_date,
  endDate: row.end_date,
  inquiryDate: row.inquiry_date,
  status: row.status,
  functionName: row.event_function_name,
  isLive: Boolean(row.is_live),
  packageId: row.package_id,
  packageName: row.package_name || null,
  assignedManagerId: row.assigned_manager_id,
  managerName: row.manager_name || null,
  createdAt: row.created_at,
});

const eventRepository = {
  formatEvent,

  async findAll(query) {
    const { page, limit, offset, sortOrder } = parsePagination(query);
    const sortBy = sanitizeSortBy('events', query.sortBy);
    const conditions = ['e.deleted_at IS NULL'];
    const params = [];

    if (query.status) {
      conditions.push('e.status = ?');
      params.push(query.status);
    }

    const startDate = toDateOnly(query.startDate);
    const endDate = toDateOnly(query.endDate);
    if (startDate && endDate && startDate === endDate) {
      conditions.push('e.start_date <= ? AND e.end_date >= ?');
      params.push(endDate, startDate);
    } else {
      if (startDate) {
        conditions.push('e.start_date >= ?');
        params.push(startDate);
      }
      if (endDate) {
        conditions.push('e.end_date <= ?');
        params.push(endDate);
      }
    }

    if (query.search) {
      conditions.push('(e.client_name LIKE ? OR e.venue_name LIKE ? OR e.city_name LIKE ?)');
      const s = `%${query.search}%`;
      params.push(s, s, s);
    }

    const where = conditions.join(' AND ');
    const safeLimit = Number(limit);
    const safeOffset = Number(offset);
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM events e WHERE ${where}`,
      params
    );
    const [rows] = await pool.execute(
      `SELECT e.*, mp.name AS package_name, s.name AS manager_name
       FROM events e
       LEFT JOIN menu_packages mp ON mp.id = e.package_id
       LEFT JOIN staff s ON s.id = e.assigned_manager_id
       WHERE ${where}
       ORDER BY e.${sortBy} ${sortOrder}
       LIMIT ${safeLimit} OFFSET ${safeOffset}`,
      params
    );
    return buildPaginatedResponse(rows.map(formatEvent), countRows[0].total, page, limit);
  },

  async findAllForExport(query) {
    const conditions = ['e.deleted_at IS NULL'];
    const params = [];
    if (query.status) {
      conditions.push('e.status = ?');
      params.push(query.status);
    }
    if (query.search) {
      conditions.push('(e.client_name LIKE ? OR e.venue_name LIKE ? OR e.city_name LIKE ?)');
      const s = `%${query.search}%`;
      params.push(s, s, s);
    }
    const sortBy = sanitizeSortBy('events', query.sortBy || 'start_date');
    const sortOrder = (query.sortOrder || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    const [rows] = await pool.execute(
      `SELECT e.*, mp.name AS package_name, s.name AS manager_name
       FROM events e
       LEFT JOIN menu_packages mp ON mp.id = e.package_id
       LEFT JOIN staff s ON s.id = e.assigned_manager_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY e.${sortBy} ${sortOrder}`,
      params
    );
    return rows.map(formatEvent);
  },

  async findByDateRange(startDate, endDate) {
    const [rows] = await pool.execute(
      `SELECT e.start_date AS date, e.status
       FROM events e
       WHERE e.deleted_at IS NULL AND e.start_date BETWEEN ? AND ?`,
      [startDate, endDate]
    );
    return rows;
  },

  async findToday() {
    const [rows] = await pool.execute(
      `SELECT e.*, mp.name AS package_name, s.name AS manager_name
       FROM events e
       LEFT JOIN menu_packages mp ON mp.id = e.package_id
       LEFT JOIN staff s ON s.id = e.assigned_manager_id
       WHERE e.deleted_at IS NULL AND e.start_date <= CURDATE() AND e.end_date >= CURDATE()
       ORDER BY e.is_live DESC, e.start_date ASC`
    );
    return rows.map(formatEvent);
  },

  async findUpcoming() {
    const [rows] = await pool.execute(
      `SELECT e.*, mp.name AS package_name, s.name AS manager_name
       FROM events e
       LEFT JOIN menu_packages mp ON mp.id = e.package_id
       LEFT JOIN staff s ON s.id = e.assigned_manager_id
       WHERE e.deleted_at IS NULL AND e.start_date > CURDATE()
       ORDER BY e.start_date ASC`
    );
    return rows.map(formatEvent);
  },

  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT e.*, mp.name AS package_name, s.name AS manager_name
       FROM events e
       LEFT JOIN menu_packages mp ON mp.id = e.package_id
       LEFT JOIN staff s ON s.id = e.assigned_manager_id
       WHERE e.id = ? AND e.deleted_at IS NULL`,
      [id]
    );
    return rows[0] || null;
  },

  async create(data, userId) {
    const [result] = await pool.execute(
      `INSERT INTO events (
        inquiry_id, client_name, client_mobile, venue_name, city_name, inquiry_date,
        start_date, end_date, event_function_name, status, package_id, assigned_manager_id,
        is_live, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.inquiry_id || null,
        data.client_name,
        data.client_mobile || null,
        data.venue_name,
        data.city_name,
        data.inquiry_date || null,
        data.start_date,
        data.end_date,
        data.event_function_name || null,
        data.status || 'inquiry',
        data.package_id || null,
        data.assigned_manager_id || null,
        data.is_live ? 1 : 0,
        userId,
      ]
    );
    return result.insertId;
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    const allowed = [
      'client_name', 'client_mobile', 'venue_name', 'city_name', 'inquiry_date',
      'start_date', 'end_date', 'event_function_name', 'status', 'package_id',
      'assigned_manager_id', 'is_live', 'inquiry_id',
    ];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(key === 'is_live' ? (data[key] ? 1 : 0) : data[key]);
      }
    }
    if (!fields.length) return;
    values.push(id);
    await pool.execute(
      `UPDATE events SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ? AND deleted_at IS NULL`,
      values
    );
  },

  async softDelete(id) {
    await pool.execute('UPDATE events SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL', [id]);
  },

  async bulkDelete(ids) {
    if (!ids.length) return 0;
    const placeholders = ids.map(() => '?').join(',');
    const [result] = await pool.execute(
      `UPDATE events SET deleted_at = NOW() WHERE id IN (${placeholders}) AND deleted_at IS NULL`,
      ids
    );
    return result.affectedRows;
  },

  async bulkUpdateStatus(ids, status) {
    if (!ids.length) return 0;
    const placeholders = ids.map(() => '?').join(',');
    const [result] = await pool.execute(
      `UPDATE events SET status = ?, updated_at = NOW() WHERE id IN (${placeholders}) AND deleted_at IS NULL`,
      [status, ...ids]
    );
    return result.affectedRows;
  },

  async getFunctions(eventId) {
    const [rows] = await pool.execute(
      `SELECT * FROM event_functions WHERE event_id = ? AND deleted_at IS NULL ORDER BY sort_order, id`,
      [eventId]
    );
    return rows.map((f) => ({
      id: f.id,
      name: f.name,
      venue: f.venue,
      date: f.function_date,
      startTime: f.start_time,
      endTime: f.end_time,
      pax: f.pax,
      rate: f.rate ? Number(f.rate) : null,
      sortOrder: f.sort_order,
    }));
  },

  async addFunction(eventId, data) {
    const [result] = await pool.execute(
      `INSERT INTO event_functions (event_id, name, venue, function_date, start_time, end_time, pax, rate, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        eventId,
        data.name,
        data.venue || null,
        data.function_date || null,
        data.start_time || null,
        data.end_time || null,
        data.pax || null,
        data.rate || null,
        data.sort_order || 0,
      ]
    );
    return result.insertId;
  },

  async updateFunction(eventId, functionId, data) {
    const fields = [];
    const values = [];
    const allowed = ['name', 'venue', 'function_date', 'start_time', 'end_time', 'pax', 'rate', 'sort_order'];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    }
    if (!fields.length) return;
    values.push(functionId, eventId);
    await pool.execute(
      `UPDATE event_functions SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = ? AND event_id = ? AND deleted_at IS NULL`,
      values
    );
  },

  async deleteFunction(eventId, functionId) {
    await pool.execute(
      'UPDATE event_functions SET deleted_at = NOW() WHERE id = ? AND event_id = ? AND deleted_at IS NULL',
      [functionId, eventId]
    );
  },

  async getMenuSelections(eventId) {
    const [rows] = await pool.execute(
      `SELECT mi.id, mi.name, mi.category_id, mc.name AS category, mi.price, mi.is_veg, mi.image_url
       FROM event_menu_selections ems
       JOIN menu_items mi ON mi.id = ems.menu_item_id
       JOIN menu_categories mc ON mc.id = mi.category_id
       WHERE ems.event_id = ? AND ems.deleted_at IS NULL AND mi.deleted_at IS NULL`,
      [eventId]
    );
    return rows;
  },

  async setMenuSelections(eventId, menuItemIds) {
    await pool.execute(
      'UPDATE event_menu_selections SET deleted_at = NOW() WHERE event_id = ? AND deleted_at IS NULL',
      [eventId]
    );
    for (const itemId of menuItemIds) {
      await pool.execute(
        `INSERT INTO event_menu_selections (event_id, menu_item_id) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE deleted_at = NULL, updated_at = NOW()`,
        [eventId, itemId]
      );
    }
  },
};

module.exports = eventRepository;
