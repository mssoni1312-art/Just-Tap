const pool = require('../../config/database');
const { MANAGER_EVENT_SCOPE_SQL, managerScopeParams } = require('../../helpers/managerScope');

const resolveStatusLabel = (status) =>
  status === 'completed' ? 'Complete Task' : 'Pending Task';

const managerEvaluateIncomeRepository = {
  async getTaskBreakdown(staffId) {
    const scopeParams = managerScopeParams(staffId);
    const [rows] = await pool.execute(
      `SELECT
         et.id,
         et.title,
         et.status,
         et.event_id,
         COALESCE(emc.assign_manager_cost, 0) AS assign_manager_cost
       FROM event_tasks et
       JOIN events e ON e.id = et.event_id AND e.deleted_at IS NULL
       LEFT JOIN event_manager_costs emc
         ON emc.event_id = e.id
         AND emc.deleted_at IS NULL
       WHERE et.deleted_at IS NULL
         AND et.assigned_to = ?
         AND ${MANAGER_EVENT_SCOPE_SQL}
       ORDER BY
         CASE WHEN et.status = 'completed' THEN 1 ELSE 0 END,
         et.updated_at DESC`,
      [staffId, ...scopeParams]
    );

    return rows.map((row) => {
      const isCompleted = row.status === 'completed';
      const eventIncome = Number(row.assign_manager_cost) || 0;
      return {
        id: String(row.id),
        name: row.title,
        status: row.status,
        statusLabel: resolveStatusLabel(row.status),
        eventId: String(row.event_id),
        income: isCompleted ? eventIncome : 0,
      };
    });
  },

  async getTotalIncome(staffId) {
    const [rows] = await pool.execute(
      `SELECT COALESCE(SUM(emc.assign_manager_cost), 0) AS total_income
       FROM events e
       LEFT JOIN event_manager_costs emc
         ON emc.event_id = e.id
         AND emc.deleted_at IS NULL
       WHERE e.deleted_at IS NULL
         AND ${MANAGER_EVENT_SCOPE_SQL}`,
      managerScopeParams(staffId)
    );

    return Number(rows[0]?.total_income) || 0;
  },
};

module.exports = managerEvaluateIncomeRepository;
