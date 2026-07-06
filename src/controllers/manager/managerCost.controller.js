const { sendSuccess } = require('../../helpers/response');
const managerCostService = require('../../services/managerCost.service');
const managerManagerCostService = require('../../services/manager/managerCost.service');

module.exports = {
  get: async (req, res) => {
    const data =
      req.user.role === 'super_admin'
        ? await managerCostService.get(req.params.eventId)
        : await managerManagerCostService.get(req.managerStaffId, req.params.eventId);

    return sendSuccess(res, data);
  },

  save: async (req, res) => {
    const data =
      req.user.role === 'super_admin'
        ? await managerCostService.save(req.params.eventId, req.body, req.user.id)
        : await managerManagerCostService.save(
            req.managerStaffId,
            req.params.eventId,
            req.body,
            req.user.id,
          );

    return sendSuccess(res, data, 'Manager cost saved');
  },
};
