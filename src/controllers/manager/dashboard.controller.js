const { sendSuccess } = require('../../helpers/response');
const managerDashboardService = require('../../services/manager/dashboard.service');

module.exports = {
  home: async (req, res) =>
    sendSuccess(res, await managerDashboardService.getHomeStats(req.managerStaffId)),
};
