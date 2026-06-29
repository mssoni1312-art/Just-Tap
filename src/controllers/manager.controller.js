const { sendSuccess } = require('../helpers/response');
const managerService = require('../services/manager.service');

module.exports = {
  list: async (req, res) => sendSuccess(res, await managerService.list(req.query)),
};
