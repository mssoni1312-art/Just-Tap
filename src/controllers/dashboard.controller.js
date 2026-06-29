const { sendSuccess } = require('../helpers/response');
const dashboardService = require('../services/dashboard.service');

module.exports = {
  home: async (_req, res) => sendSuccess(res, await dashboardService.getHomeStats()),
};
