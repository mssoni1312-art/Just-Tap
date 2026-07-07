const pool = require('../../config/database');
const { parsePagination, buildPaginatedResponse, sanitizeSortBy } = require('../../helpers/pagination');
const { MANAGER_EVENT_SCOPE_SQL, managerScopeParams } = require('../../helpers/managerScope');
const { formatEvent, EVENT_LIST_SELECT } = require('../event.repository');

const toDateOnly = (value) => {
  if (!value) return null;
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return String(value).slice(0, 10);
};

const buildScopedConditions = (staffId, query = {}) => {
  const conditions = ['e.deleted_at IS NULL', MANAGER_EVENT_SCOPE_SQL];
  const params = [...managerScopeParams(staffId)];

  if (query.status) {
    conditions.push('e.status = ?');
    params.push(query.status);
  }

  if (query.completed === 'true') {
    conditions.push('e.end_date < CURDATE()');
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

  return { conditions, params };
};

const managerEventRepository = {
  async findAll(staffId, query) {
    const { page, limit, offset, sortOrder } = parsePagination(query);
    const sortBy = sanitizeSortBy('events', query.sortBy);
    const { conditions, params } = buildScopedConditions(staffId, query);

    const where = conditions.join(' AND ');
    const safeLimit = Number(limit);
    const safeOffset = Number(offset);
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM events e WHERE ${where}`,
      params
    );
    const [rows] = await pool.execute(
      `SELECT ${EVENT_LIST_SELECT}
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

  async findByDateRange(staffId, startDate, endDate) {
    const conditions = [
      'e.deleted_at IS NULL',
      'e.start_date <= ?',
      'e.end_date >= ?',
      MANAGER_EVENT_SCOPE_SQL,
    ];
    const params = [endDate, startDate, ...managerScopeParams(staffId)];
    const [rows] = await pool.execute(
      `SELECT e.start_date, e.end_date, e.status, e.id, e.uuid, e.client_name, e.venue_name
       FROM events e
       WHERE ${conditions.join(' AND ')}`,
      params
    );
    return rows;
  },

  async findToday(staffId) {
    const conditions = [
      'e.deleted_at IS NULL',
      'e.start_date <= CURDATE()',
      'e.end_date >= CURDATE()',
      MANAGER_EVENT_SCOPE_SQL,
    ];
    const params = [...managerScopeParams(staffId)];
    const [rows] = await pool.execute(
      `SELECT ${EVENT_LIST_SELECT}
       FROM events e
       LEFT JOIN menu_packages mp ON mp.id = e.package_id
       LEFT JOIN staff s ON s.id = e.assigned_manager_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY e.is_live DESC, e.start_date ASC`,
      params
    );
    return rows.map(formatEvent);
  },

  async findUpcoming(staffId) {
    const conditions = ['e.deleted_at IS NULL', 'e.start_date > CURDATE()', MANAGER_EVENT_SCOPE_SQL];
    const params = [...managerScopeParams(staffId)];
    const [rows] = await pool.execute(
      `SELECT ${EVENT_LIST_SELECT}
       FROM events e
       LEFT JOIN menu_packages mp ON mp.id = e.package_id
       LEFT JOIN staff s ON s.id = e.assigned_manager_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY e.start_date ASC`,
      params
    );
    return rows.map(formatEvent);
  },
};

module.exports = managerEventRepository;
