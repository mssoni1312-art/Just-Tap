const pool = require('../config/database');
const { parsePagination, buildPaginatedResponse, sanitizeSortBy } = require('../helpers/pagination');
const { MANAGER_EVENT_SCOPE_SQL, managerScopeParams } = require('../helpers/managerScope');

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
  clientId: row.client_id || null,
  clientName: row.client_name,
  clientMobile: row.client_mobile,
  catererName: row.caterer_name || null,
  clientAddress: row.client_address || null,
  reference: row.reference || null,
  isHighPriority: Boolean(row.is_high_priority),
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
  justTapInformation: {
    noOfTablets: row.no_of_tablets ?? null,
    noOfCaptains: row.no_of_captains ?? null,
    noOfManagers: row.no_of_managers ?? null,
    rate: row.just_tap_rate != null ? Number(row.just_tap_rate) : null,
  },
  tabletMedia: {
    service: row.tablet_service || null,
    number: row.no_of_tablets ?? null,
    clientAddress: row.media_client_address || null,
    hasPhotographyVideography: Boolean(row.has_photography_videography),
  },
  photographyVideography: {
    enabled: Boolean(row.has_photography_videography),
    name: row.photography_name || null,
    number: row.photography_number || null,
    city: row.photography_city || null,
    description: row.photography_description || null,
    rate: row.photography_rate != null ? Number(row.photography_rate) : null,
  },
  justSocialInformation: {
    clientInstagramId: row.client_instagram_id || null,
    noOfFollowers: row.no_of_followers ?? null,
    noOfFoodReels: row.no_of_food_reels ?? null,
    noOfTestimonialReels: row.no_of_testimonial_reels ?? null,
  },
  brideGroomInformation: {
    brideName: row.bride_name || null,
    brideInstagramId: row.bride_instagram_id || null,
    groomName: row.groom_name || null,
    groomInstagramId: row.groom_instagram_id || null,
    foodNotes: row.food_notes || null,
    eventRemarks: row.event_remarks || null,
    venueName: row.venue_name || null,
  },
  pricing: {
    totalRate: row.total_rate != null ? Number(row.total_rate) : null,
    discountRate: row.discount_rate != null ? Number(row.discount_rate) : null,
    finalRate: row.final_rate != null ? Number(row.final_rate) : null,
  },
  createdAt: row.created_at,
});

const mapTabFourFields = (data) => {
  const justTap = data.justTapInformation || {};
  const photo = data.photographyVideography || {};
  const social = data.justSocialInformation || {};
  const brideGroom = data.brideGroomInformation || {};
  const pricing = data.pricing || {};

  return {
    no_of_tablets: justTap.noOfTablets,
    no_of_captains: justTap.noOfCaptains,
    no_of_managers: justTap.noOfManagers,
    tablet_service: data.tabletService ?? data.tablet_service,
    media_client_address: data.mediaClientAddress ?? data.media_client_address,
    just_tap_rate: justTap.rate,
    has_photography_videography: photo.enabled,
    photography_name: photo.name,
    photography_number: photo.number,
    photography_city: photo.city,
    photography_description: photo.description,
    photography_rate: photo.rate,
    client_instagram_id: social.clientInstagramId,
    no_of_followers: social.noOfFollowers,
    no_of_food_reels: social.noOfFoodReels,
    no_of_testimonial_reels: social.noOfTestimonialReels,
    bride_name: brideGroom.brideName,
    bride_instagram_id: brideGroom.brideInstagramId,
    groom_name: brideGroom.groomName,
    groom_instagram_id: brideGroom.groomInstagramId,
    food_notes: brideGroom.foodNotes,
    event_remarks: brideGroom.eventRemarks,
    total_rate: pricing.totalRate,
    discount_rate: pricing.discountRate,
    final_rate: pricing.finalRate,
  };
};

const eventRepository = {
  formatEvent,

  _buildListConditions(query, staffId = null) {
    const conditions = ['e.deleted_at IS NULL'];
    const params = [];

    if (staffId) {
      conditions.push(MANAGER_EVENT_SCOPE_SQL);
      params.push(...managerScopeParams(staffId));
    }

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
  },

  async findAll(query, staffId = null) {
    const { page, limit, offset, sortOrder } = parsePagination(query);
    const sortBy = sanitizeSortBy('events', query.sortBy);
    const { conditions, params } = this._buildListConditions(query, staffId);

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

  async findAllForExport(query, staffId = null) {
    const { conditions, params } = this._buildListConditions(query, staffId);
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

  async findByDateRange(startDate, endDate, staffId = null) {
    const conditions = ['e.deleted_at IS NULL', 'e.start_date BETWEEN ? AND ?'];
    const params = [startDate, endDate];
    if (staffId) {
      conditions.push(MANAGER_EVENT_SCOPE_SQL);
      params.push(...managerScopeParams(staffId));
    }
    const [rows] = await pool.execute(
      `SELECT e.start_date AS date, e.status, e.id, e.uuid, e.client_name, e.venue_name
       FROM events e
       WHERE ${conditions.join(' AND ')}`,
      params
    );
    return rows;
  },

  async findToday(staffId = null) {
    const conditions = ['e.deleted_at IS NULL', 'e.start_date <= CURDATE()', 'e.end_date >= CURDATE()'];
    const params = [];
    if (staffId) {
      conditions.push(MANAGER_EVENT_SCOPE_SQL);
      params.push(...managerScopeParams(staffId));
    }
    const [rows] = await pool.execute(
      `SELECT e.*, mp.name AS package_name, s.name AS manager_name
       FROM events e
       LEFT JOIN menu_packages mp ON mp.id = e.package_id
       LEFT JOIN staff s ON s.id = e.assigned_manager_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY e.is_live DESC, e.start_date ASC`,
      params
    );
    return rows.map(formatEvent);
  },

  async findUpcoming(staffId = null) {
    const conditions = ['e.deleted_at IS NULL', 'e.start_date > CURDATE()'];
    const params = [];
    if (staffId) {
      conditions.push(MANAGER_EVENT_SCOPE_SQL);
      params.push(...managerScopeParams(staffId));
    }
    const [rows] = await pool.execute(
      `SELECT e.*, mp.name AS package_name, s.name AS manager_name
       FROM events e
       LEFT JOIN menu_packages mp ON mp.id = e.package_id
       LEFT JOIN staff s ON s.id = e.assigned_manager_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY e.start_date ASC`,
      params
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
    const tabFour = mapTabFourFields(data);
    const [result] = await pool.execute(
      `INSERT INTO events (
        inquiry_id, client_id, client_name, client_mobile, caterer_name, client_address, reference, is_high_priority,
        venue_name, city_name, inquiry_date,
        start_date, end_date, event_function_name, status, package_id, assigned_manager_id,
        is_live, no_of_tablets, no_of_captains, no_of_managers, tablet_service, media_client_address, just_tap_rate,
        has_photography_videography, photography_name, photography_number, photography_city,
        photography_description, photography_rate, client_instagram_id, no_of_followers,
        no_of_food_reels, no_of_testimonial_reels, bride_name, bride_instagram_id,
        groom_name, groom_instagram_id, food_notes, event_remarks, total_rate, discount_rate, final_rate, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.inquiry_id || null,
        data.client_id || null,
        data.client_name,
        data.client_mobile || null,
        data.caterer_name || null,
        data.client_address || null,
        data.reference || null,
        data.is_high_priority ? 1 : 0,
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
        tabFour.no_of_tablets ?? null,
        tabFour.no_of_captains ?? null,
        tabFour.no_of_managers ?? null,
        tabFour.tablet_service ?? null,
        tabFour.media_client_address ?? null,
        tabFour.just_tap_rate ?? null,
        tabFour.has_photography_videography ? 1 : 0,
        tabFour.photography_name || null,
        tabFour.photography_number || null,
        tabFour.photography_city || null,
        tabFour.photography_description || null,
        tabFour.photography_rate ?? null,
        tabFour.client_instagram_id || null,
        tabFour.no_of_followers ?? null,
        tabFour.no_of_food_reels ?? null,
        tabFour.no_of_testimonial_reels ?? null,
        tabFour.bride_name || null,
        tabFour.bride_instagram_id || null,
        tabFour.groom_name || null,
        tabFour.groom_instagram_id || null,
        tabFour.food_notes || null,
        tabFour.event_remarks || null,
        tabFour.total_rate ?? null,
        tabFour.discount_rate ?? null,
        tabFour.final_rate ?? null,
        userId,
      ]
    );
    return result.insertId;
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    const allowed = [
      'client_id', 'client_name', 'client_mobile', 'caterer_name', 'client_address', 'reference', 'is_high_priority',
      'venue_name', 'city_name', 'inquiry_date',
      'start_date', 'end_date', 'event_function_name', 'status', 'package_id',
      'assigned_manager_id', 'is_live', 'inquiry_id',
      'no_of_tablets', 'no_of_captains', 'no_of_managers', 'tablet_service', 'media_client_address', 'just_tap_rate',
      'has_photography_videography', 'photography_name', 'photography_number', 'photography_city',
      'photography_description', 'photography_rate', 'client_instagram_id', 'no_of_followers',
      'no_of_food_reels', 'no_of_testimonial_reels', 'bride_name', 'bride_instagram_id',
      'groom_name', 'groom_instagram_id', 'food_notes', 'event_remarks', 'total_rate', 'discount_rate', 'final_rate',
    ];
    const booleanFields = new Set(['is_live', 'is_high_priority', 'has_photography_videography']);
    const tabFour = mapTabFourFields(data);
    const merged = { ...data, ...tabFour };

    for (const key of allowed) {
      if (merged[key] !== undefined) {
        fields.push(`${key} = ?`);
        if (booleanFields.has(key)) {
          values.push(merged[key] ? 1 : 0);
        } else {
          values.push(merged[key]);
        }
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
      subVenueRemarks: f.sub_venue_remarks || null,
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
      `INSERT INTO event_functions (event_id, name, venue, sub_venue_remarks, function_date, start_time, end_time, pax, rate, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        eventId,
        data.name,
        data.venue || null,
        data.sub_venue_remarks || null,
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
    const allowed = ['name', 'venue', 'sub_venue_remarks', 'function_date', 'start_time', 'end_time', 'pax', 'rate', 'sort_order'];
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

  async getManagerAllocations(eventId) {
    const [rows] = await pool.execute(
      `SELECT s.id, s.name
       FROM event_manager_allocations ema
       JOIN staff s ON s.id = ema.staff_id
       WHERE ema.event_id = ?
         AND ema.deleted_at IS NULL
         AND s.deleted_at IS NULL
       ORDER BY ema.id`,
      [eventId]
    );
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
    }));
  },

  async setManagerAllocations(eventId, staffIds) {
    await pool.execute(
      'UPDATE event_manager_allocations SET deleted_at = NOW() WHERE event_id = ? AND deleted_at IS NULL',
      [eventId]
    );
    for (const staffId of staffIds) {
      await pool.execute(
        `INSERT INTO event_manager_allocations (event_id, staff_id) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE deleted_at = NULL, updated_at = NOW()`,
        [eventId, staffId]
      );
    }
  },

  async getCaptainAllocations(eventId) {
    const [rows] = await pool.execute(
      `SELECT s.id, s.name
       FROM event_captain_allocations eca
       JOIN staff s ON s.id = eca.staff_id
       WHERE eca.event_id = ?
         AND eca.deleted_at IS NULL
         AND s.deleted_at IS NULL
       ORDER BY eca.id`,
      [eventId]
    );
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
    }));
  },

  async setCaptainAllocations(eventId, staffIds) {
    await pool.execute(
      'UPDATE event_captain_allocations SET deleted_at = NOW() WHERE event_id = ? AND deleted_at IS NULL',
      [eventId]
    );
    for (const staffId of staffIds) {
      await pool.execute(
        `INSERT INTO event_captain_allocations (event_id, staff_id) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE deleted_at = NULL, updated_at = NOW()`,
        [eventId, staffId]
      );
    }
  },

  async getBrideGroomImages(eventId) {
    const [rows] = await pool.execute(
      `SELECT image_url FROM event_bride_groom_images
       WHERE event_id = ? AND deleted_at IS NULL
       ORDER BY sort_order, id`,
      [eventId]
    );
    return rows.map((row) => row.image_url);
  },

  async setBrideGroomImages(eventId, imageUrls) {
    await pool.execute(
      'UPDATE event_bride_groom_images SET deleted_at = NOW() WHERE event_id = ? AND deleted_at IS NULL',
      [eventId]
    );
    for (const [i, imageUrl] of (imageUrls || []).entries()) {
      await pool.execute(
        'INSERT INTO event_bride_groom_images (event_id, image_url, sort_order) VALUES (?, ?, ?)',
        [eventId, imageUrl, i]
      );
    }
  },
};

module.exports = eventRepository;
