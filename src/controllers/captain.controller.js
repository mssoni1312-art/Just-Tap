const { sendSuccess } = require('../helpers/response');
const captainService = require('../services/captain.service');

module.exports = {
  list: async (req, res) => sendSuccess(res, await captainService.list(req.query)),
  create: async (req, res) => sendSuccess(res, await captainService.create(req.body), 'Captain created', 201),
};
