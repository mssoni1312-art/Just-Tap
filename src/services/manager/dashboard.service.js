const dashboardRepository = require('../../repositories/dashboard.repository');

const managerDashboardService = {
  getHomeStats: (staffId) => dashboardRepository.getHomeStats(staffId),
};

module.exports = managerDashboardService;
