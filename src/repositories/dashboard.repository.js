const pool = require('../config/database');
const { MANAGER_EVENT_SCOPE_SQL, managerScopeParams } = require('../helpers/managerScope');

const managerScopeNoAlias = MANAGER_EVENT_SCOPE_SQL.replace(/e\./g, '');

const dashboardRepository = {
  async getHomeStats(staffId = null) {
    const eventParams = staffId ? [...managerScopeParams(staffId)] : [];
    const eventScope = staffId ? ` AND ${managerScopeNoAlias}` : '';

    const [eventStats] = await pool.execute(
      `SELECT
         SUM(CASE WHEN start_date <= CURDATE() AND end_date >= CURDATE() THEN 1 ELSE 0 END) AS todayCount,
         SUM(CASE WHEN start_date > CURDATE() THEN 1 ELSE 0 END) AS upcomingCount,
         SUM(CASE WHEN is_live = 1 THEN 1 ELSE 0 END) AS liveCount,
         SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) AS confirmedCount,
         SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelledCount,
         SUM(CASE WHEN end_date < CURDATE() THEN 1 ELSE 0 END) AS completedCount
       FROM events
       WHERE deleted_at IS NULL${eventScope}`,
      eventParams
    );

    let overdueCount = 0;
    if (staffId) {
      const [taskStats] = await pool.execute(
        `SELECT COUNT(*) AS overdueCount FROM event_tasks et
         JOIN events e ON e.id = et.event_id AND e.deleted_at IS NULL
         WHERE et.deleted_at IS NULL
           AND ${MANAGER_EVENT_SCOPE_SQL}
           AND (et.status = 'overdue' OR (et.due_date < CURDATE() AND et.status NOT IN ('completed')))`,
        [...managerScopeParams(staffId)]
      );
      overdueCount = taskStats[0].overdueCount || 0;
    } else {
      const [taskStats] = await pool.execute(
        `SELECT COUNT(*) AS overdueCount FROM event_tasks
         WHERE deleted_at IS NULL
           AND (status = 'overdue' OR (due_date < CURDATE() AND status NOT IN ('completed')))`
      );
      overdueCount = taskStats[0].overdueCount || 0;
    }

    const stats = {
      todayEvents: Number(eventStats[0].todayCount) || 0,
      upcomingEvents: Number(eventStats[0].upcomingCount) || 0,
      liveEvents: Number(eventStats[0].liveCount) || 0,
      confirmedEvents: Number(eventStats[0].confirmedCount) || 0,
      cancelledEvents: Number(eventStats[0].cancelledCount) || 0,
      completedEvents: Number(eventStats[0].completedCount) || 0,
      overdueTasks: Number(overdueCount) || 0,
    };

    if (!staffId) {
      const [inquiryStats] = await pool.execute(
        `SELECT COUNT(*) AS pendingCount FROM inquiries WHERE status = 'pending' AND deleted_at IS NULL`
      );
      stats.pendingInquiries = Number(inquiryStats[0].pendingCount) || 0;
    }

    return stats;
  },
};

module.exports = dashboardRepository;
