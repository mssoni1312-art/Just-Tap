const pool = require('../config/database');

const toNumber = (value) => (value != null ? Number(value) : null);

const formatRow = (row) => ({
  id: String(row.id),
  eventId: String(row.event_id),
  clientCost: toNumber(row.client_cost),
  tabletCost: toNumber(row.tablet_cost),
  transportationCost: toNumber(row.transportation_cost),
  assignManagerCost: toNumber(row.assign_manager_cost),
  photographyVideographyCost: toNumber(row.photography_videography_cost),
  otherCharges: toNumber(row.other_charges),
  totalCost: toNumber(row.total_cost) || 0,
  filled: true,
  updatedAt: row.updated_at,
});

const managerCostRepository = {
  async findByEventId(eventId) {
    const [rows] = await pool.execute(
      `SELECT * FROM event_manager_costs
       WHERE event_id = ? AND deleted_at IS NULL
       LIMIT 1`,
      [eventId]
    );
    if (!rows.length) return null;
    return formatRow(rows[0]);
  },

  async save(eventId, data) {
    const values = [
      data.clientCost ?? null,
      data.tabletCost ?? null,
      data.transportationCost ?? null,
      data.assignManagerCost ?? null,
      data.photographyVideographyCost ?? null,
      data.otherCharges ?? null,
      data.totalCost ?? 0,
    ];

    const [existing] = await pool.execute(
      `SELECT id, deleted_at FROM event_manager_costs WHERE event_id = ? LIMIT 1`,
      [eventId]
    );

    if (existing.length) {
      if (existing[0].deleted_at) {
        await pool.execute(
          'UPDATE event_manager_costs SET deleted_at = NULL WHERE id = ?',
          [existing[0].id]
        );
      }
      await pool.execute(
        `UPDATE event_manager_costs SET
          client_cost = ?,
          tablet_cost = ?,
          transportation_cost = ?,
          assign_manager_cost = ?,
          photography_videography_cost = ?,
          other_charges = ?,
          total_cost = ?,
          updated_at = NOW()
         WHERE id = ?`,
        [...values, existing[0].id]
      );
      return existing[0].id;
    }

    const [result] = await pool.execute(
      `INSERT INTO event_manager_costs (
        event_id, client_cost, tablet_cost, transportation_cost,
        assign_manager_cost, photography_videography_cost, other_charges, total_cost
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [eventId, ...values]
    );
    return result.insertId;
  },
};

module.exports = managerCostRepository;
