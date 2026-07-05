const pool = require('../config/database');

const formatRow = (r) => ({
  id: r.id,
  tableNumber: r.table_number,
  allocationType: r.allocation_type,
  staffId: r.staff_id ? String(r.staff_id) : null,
  staffName: r.staff_name || null,
  userCode: r.user_code,
  description: r.description,
  eventLabel: r.event_label,
  isAssigned: Boolean(r.user_code) || Boolean(r.staff_id),
});

const tableRepository = {
  async findByEvent(eventId) {
    const [rows] = await pool.execute(
      `SELECT eta.*, s.name AS staff_name
       FROM event_table_assignments eta
       LEFT JOIN staff s ON s.id = eta.staff_id AND s.deleted_at IS NULL
       WHERE eta.event_id = ? AND eta.deleted_at IS NULL
       ORDER BY eta.allocation_type, eta.table_number`,
      [eventId]
    );
    return rows.map(formatRow);
  },

  async findByStaff(staffId) {
    const [rows] = await pool.execute(
      `SELECT eta.*, s.name AS staff_name
       FROM event_table_assignments eta
       LEFT JOIN staff s ON s.id = eta.staff_id AND s.deleted_at IS NULL
       JOIN events e ON e.id = eta.event_id AND e.deleted_at IS NULL
       WHERE eta.staff_id = ? AND eta.deleted_at IS NULL
       ORDER BY eta.event_id, eta.allocation_type, eta.table_number`,
      [staffId]
    );
    return rows.map(formatRow);
  },

  async findForManagerReport(staffId, staffName, eventId) {
    const params = [staffId];
    let nameMatchClause = '';
    if (eventId) {
      nameMatchClause =
        ' OR (eta.event_id = ? AND TRIM(COALESCE(eta.user_code, \'\')) = ?)';
      params.push(eventId, String(staffName || '').trim());
    }

    const [rows] = await pool.execute(
      `SELECT DISTINCT eta.table_number, eta.allocation_type
       FROM event_table_assignments eta
       WHERE eta.deleted_at IS NULL
         AND (eta.staff_id = ?${nameMatchClause})
       ORDER BY
         CASE eta.allocation_type WHEN 'dining' THEN 0 ELSE 1 END,
         eta.table_number`,
      params
    );

    return rows.map((row) => ({
      tableNumber: row.table_number,
      allocationType: row.allocation_type || 'dining',
    }));
  },

  async bulkSave(eventId, assignments) {
    for (const a of assignments) {
      await pool.execute(
        `INSERT INTO event_table_assignments (event_id, table_number, allocation_type, staff_id, user_code, description, event_label)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           staff_id = VALUES(staff_id),
           user_code = VALUES(user_code),
           description = VALUES(description),
           event_label = VALUES(event_label),
           deleted_at = NULL,
           updated_at = NOW()`,
        [
          eventId,
          a.table_number,
          a.allocation_type || 'dining',
          a.staff_id || null,
          a.user_code || null,
          a.description || null,
          a.event_label || null,
        ]
      );
    }
  },

  async assignSingle(eventId, tableNumber, data) {
    await pool.execute(
      `INSERT INTO event_table_assignments (event_id, table_number, allocation_type, staff_id, user_code, description, event_label)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         staff_id = VALUES(staff_id),
         user_code = VALUES(user_code),
         description = VALUES(description),
         event_label = VALUES(event_label),
         deleted_at = NULL,
         updated_at = NOW()`,
      [
        eventId,
        tableNumber,
        data.allocation_type || 'dining',
        data.staff_id || null,
        data.user_code || null,
        data.description || null,
        data.event_label || null,
      ]
    );
  },

  async findOneByEventTable(eventId, tableNumber, allocationType = 'dining') {
    const [rows] = await pool.execute(
      `SELECT eta.*, s.name AS staff_name
       FROM event_table_assignments eta
       LEFT JOIN staff s ON s.id = eta.staff_id AND s.deleted_at IS NULL
       WHERE eta.event_id = ?
         AND eta.table_number = ?
         AND eta.allocation_type = ?
         AND eta.deleted_at IS NULL
       LIMIT 1`,
      [eventId, tableNumber, allocationType]
    );
    return rows[0] ? formatRow(rows[0]) : null;
  },

  async assignTableManager(eventId, tableNumber, staffId, allocationType = 'dining') {
    await pool.execute(
      `INSERT INTO event_table_assignments (event_id, table_number, allocation_type, staff_id)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         staff_id = VALUES(staff_id),
         deleted_at = NULL,
         updated_at = NOW()`,
      [eventId, tableNumber, allocationType, staffId]
    );
    return this.findOneByEventTable(eventId, tableNumber, allocationType);
  },

  async assignManagerTables(eventId, staffId, tableNumbers, allocationType = 'dining') {
    for (const tableNumber of tableNumbers) {
      await this.assignTableManager(eventId, tableNumber, staffId, allocationType);
    }
  },

  async saveAllocation(eventId, diningTables, captainTables) {
    for (const t of diningTables || []) {
      await this.assignSingle(eventId, t, { allocation_type: 'dining' });
    }
    for (const t of captainTables || []) {
      await pool.execute(
        `INSERT INTO event_table_assignments (event_id, table_number, allocation_type)
         VALUES (?, ?, 'captain')
         ON DUPLICATE KEY UPDATE deleted_at = NULL, updated_at = NOW()`,
        [eventId, t]
      );
    }
  },
};

module.exports = tableRepository;
