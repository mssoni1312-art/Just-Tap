const pool = require('../config/database');
const AppError = require('../utils/AppError');

const MANAGER_EVENT_SCOPE_SQL = `(
  e.assigned_manager_id = ?
  OR EXISTS (
    SELECT 1 FROM event_manager_allocations ema
    WHERE ema.event_id = e.id
      AND ema.staff_id = ?
      AND ema.deleted_at IS NULL
  )
)`;

const managerScopeParams = (staffId) => [staffId, staffId];

const assertManagerOwnsEvent = async (staffId, eventId) => {
  const [rows] = await pool.execute(
    `SELECT e.id FROM events e
     WHERE e.id = ? AND e.deleted_at IS NULL AND ${MANAGER_EVENT_SCOPE_SQL}`,
    [eventId, ...managerScopeParams(staffId)]
  );
  if (!rows.length) {
    throw new AppError('Event not found or access denied', 404);
  }
  return rows[0].id;
};

module.exports = {
  MANAGER_EVENT_SCOPE_SQL,
  managerScopeParams,
  assertManagerOwnsEvent,
};
