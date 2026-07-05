const { sendSuccess } = require('../../helpers/response');
const managerBillingService = require('../../services/manager/billing.service');

module.exports = {
  get: async (req, res) =>
    sendSuccess(
      res,
      await managerBillingService.get(req.managerStaffId, req.params.eventId),
    ),

  savePreview: async (req, res) =>
    sendSuccess(
      res,
      await managerBillingService.savePreview(
        req.managerStaffId,
        req.params.eventId,
        req.body,
        req.user.id,
      ),
      req.body.showToClient ? 'Billing saved and published to client app' : 'Billing saved',
    ),
};
