const dashboardRepository = require('../repositories/dashboard.repository');

const dashboardService = {
  getHomeStats: () => dashboardRepository.getHomeStats(),
};

module.exports = dashboardService;
