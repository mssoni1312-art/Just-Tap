const pool = require('../config/database');

const dashboardRepository = {
  async getHomeStats() {
    const [eventStats] = await pool.execute(
      `SELECT
         SUM(CASE WHEN start_date <= CURDATE() AND end_date >= CURDATE() THEN 1 ELSE 0 END) AS todayCount,
         SUM(CASE WHEN start_date > CURDATE() THEN 1 ELSE 0 END) AS upcomingCount,
         SUM(CASE WHEN is_live = 1 THEN 1 ELSE 0 END) AS liveCount,
         SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) AS confirmedCount
       FROM events WHERE deleted_at IS NULL`
    );
    const [inquiryStats] = await pool.execute(
      `SELECT COUNT(*) AS pendingCount FROM inquiries WHERE status = 'pending' AND deleted_at IS NULL`
    );
    const [taskStats] = await pool.execute(
      `SELECT COUNT(*) AS overdueCount FROM event_tasks
       WHERE deleted_at IS NULL AND (status = 'overdue' OR (due_date < CURDATE() AND status NOT IN ('completed')))`
    );
    return {
      todayEvents: eventStats[0].todayCount || 0,
      upcomingEvents: eventStats[0].upcomingCount || 0,
      liveEvents: eventStats[0].liveCount || 0,
      confirmedEvents: eventStats[0].confirmedCount || 0,
      pendingInquiries: inquiryStats[0].pendingCount || 0,
      overdueTasks: taskStats[0].overdueCount || 0,
    };
  },
};

module.exports = dashboardRepository;
