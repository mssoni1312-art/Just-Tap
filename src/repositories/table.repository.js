const pool = require('../config/database');

const tableRepository = {
  async findByEvent(eventId) {
    const [rows] = await pool.execute(
      `SELECT * FROM event_table_assignments
       WHERE event_id = ? AND deleted_at IS NULL
       ORDER BY allocation_type, table_number`,
      [eventId]
    );
    return rows.map((r) => ({
      id: r.id,
      tableNumber: r.table_number,
      allocationType: r.allocation_type,
      userCode: r.user_code,
      description: r.description,
      eventLabel: r.event_label,
      isAssigned: Boolean(r.user_code),
    }));
  },

  async bulkSave(eventId, assignments) {
    for (const a of assignments) {
      await pool.execute(
        `INSERT INTO event_table_assignments (event_id, table_number, allocation_type, user_code, description, event_label)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           user_code = VALUES(user_code),
           description = VALUES(description),
           event_label = VALUES(event_label),
           deleted_at = NULL,
           updated_at = NOW()`,
        [
          eventId,
          a.table_number,
          a.allocation_type || 'dining',
          a.user_code || null,
          a.description || null,
          a.event_label || null,
        ]
      );
    }
  },

  async assignSingle(eventId, tableNumber, data) {
    await pool.execute(
      `INSERT INTO event_table_assignments (event_id, table_number, allocation_type, user_code, description, event_label)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         user_code = VALUES(user_code),
         description = VALUES(description),
         event_label = VALUES(event_label),
         deleted_at = NULL,
         updated_at = NOW()`,
      [
        eventId,
        tableNumber,
        data.allocation_type || 'dining',
        data.user_code || null,
        data.description || null,
        data.event_label || null,
      ]
    );
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
