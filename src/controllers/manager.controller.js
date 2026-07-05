const { sendSuccess } = require('../helpers/response');
const managerService = require('../services/manager.service');

module.exports = {
  list: async (req, res) => sendSuccess(res, await managerService.list(req.query)),
  create: async (req, res) =>
    sendSuccess(res, await managerService.create(req.body), 'Manager created', 201),
};
