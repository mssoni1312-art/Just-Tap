const { sendSuccess } = require('../helpers/response');
const functionNameService = require('../services/functionName.service');

module.exports = {
  list: async (req, res) => sendSuccess(res, await functionNameService.list(req.query)),
  getById: async (req, res) => sendSuccess(res, await functionNameService.getById(req.params.id)),
  create: async (req, res) =>
    sendSuccess(res, await functionNameService.create(req.body), 'Function name created', 201),
  update: async (req, res) =>
    sendSuccess(res, await functionNameService.update(req.params.id, req.body), 'Function name updated'),
  remove: async (req, res) =>
    sendSuccess(res, await functionNameService.remove(req.params.id), 'Function name deleted'),
};
