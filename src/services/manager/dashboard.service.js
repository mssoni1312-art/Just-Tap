const managerDashboardRepository = require('../../repositories/manager/dashboard.repository');

const managerDashboardService = {
  getHomeStats: (staffId) => managerDashboardRepository.getHomeStats(staffId),
};

module.exports = managerDashboardService;
