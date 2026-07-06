const { sendSuccess } = require('../helpers/response');
const managerCostService = require('../services/managerCost.service');

module.exports = {
  get: async (req, res) =>
    sendSuccess(res, await managerCostService.get(req.params.eventId)),

  save: async (req, res) =>
    sendSuccess(
      res,
      await managerCostService.save(req.params.eventId, req.body, req.user.id),
      'Manager cost saved',
    ),
};
