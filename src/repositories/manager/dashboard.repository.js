const pool = require('../../config/database');
const { MANAGER_EVENT_SCOPE_SQL, managerScopeParams } = require('../../helpers/managerScope');

const managerDashboardRepository = {
  async getHomeStats(staffId) {
    const eventParams = [...managerScopeParams(staffId)];

    const [eventStats] = await pool.execute(
      `SELECT
         SUM(CASE WHEN e.start_date <= CURDATE() AND e.end_date >= CURDATE() THEN 1 ELSE 0 END) AS todayCount,
         SUM(CASE WHEN e.start_date > CURDATE() THEN 1 ELSE 0 END) AS upcomingCount,
         SUM(CASE WHEN e.is_live = 1 THEN 1 ELSE 0 END) AS liveCount,
         SUM(CASE WHEN e.status = 'confirmed' THEN 1 ELSE 0 END) AS confirmedCount,
         SUM(CASE WHEN e.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelledCount,
         SUM(CASE WHEN e.end_date < CURDATE() THEN 1 ELSE 0 END) AS completedCount
       FROM events e
       WHERE e.deleted_at IS NULL AND ${MANAGER_EVENT_SCOPE_SQL}`,
      eventParams
    );

    const [taskStats] = await pool.execute(
      `SELECT COUNT(*) AS overdueCount FROM event_tasks et
       JOIN events e ON e.id = et.event_id AND e.deleted_at IS NULL
       WHERE et.deleted_at IS NULL
         AND ${MANAGER_EVENT_SCOPE_SQL}
         AND (et.status = 'overdue' OR (et.due_date < CURDATE() AND et.status NOT IN ('completed')))`,
      [...managerScopeParams(staffId)]
    );

    return {
      todayEvents: Number(eventStats[0].todayCount) || 0,
      upcomingEvents: Number(eventStats[0].upcomingCount) || 0,
      liveEvents: Number(eventStats[0].liveCount) || 0,
      confirmedEvents: Number(eventStats[0].confirmedCount) || 0,
      cancelledEvents: Number(eventStats[0].cancelledCount) || 0,
      completedEvents: Number(eventStats[0].completedCount) || 0,
      overdueTasks: Number(taskStats[0].overdueCount) || 0,
    };
  },
};

module.exports = managerDashboardRepository;
