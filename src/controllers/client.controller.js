const { sendSuccess } = require('../helpers/response');
const clientService = require('../services/client.service');

module.exports = {
  list: async (req, res) => sendSuccess(res, await clientService.list(req.query)),
  getById: async (req, res) => sendSuccess(res, await clientService.getById(req.params.id)),
  create: async (req, res) => sendSuccess(res, await clientService.create(req.body), 'Client created', 201),
};
