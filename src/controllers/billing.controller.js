const { sendSuccess } = require('../helpers/response');
const billingService = require('../services/billing.service');

module.exports = {
  get: async (req, res) => sendSuccess(res, await billingService.get(req.params.eventId)),
  getClientPreview: async (req, res) => sendSuccess(res, await billingService.getClientPreview(req.params.eventId)),
  savePreview: async (req, res) =>
    sendSuccess(
      res,
      await billingService.savePreview(req.params.eventId, req.body, req.user.id),
      req.body.showToClient ? 'Billing saved and published to client app' : 'Billing saved',
    ),
};
