const { sendSuccess } = require('../../helpers/response');
const clientFlowClientDashboardContentService = require('../../services/clientFlow/clientDashboardContent.service');

module.exports = {
  getDashboard: async (_req, res) =>
    sendSuccess(res, await clientFlowClientDashboardContentService.getDashboard()),

  listDiscoverExperiences: async (_req, res) =>
    sendSuccess(res, await clientFlowClientDashboardContentService.listDiscoverExperiences()),

  listTestimonials: async (_req, res) =>
    sendSuccess(res, await clientFlowClientDashboardContentService.listTestimonials()),
};
