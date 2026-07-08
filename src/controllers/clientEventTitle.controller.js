const { sendSuccess } = require('../helpers/response');
const clientEventTitleService = require('../services/clientEventTitle.service');

module.exports = {
  list: async (req, res) => sendSuccess(res, await clientEventTitleService.list(req.query)),
  create: async (req, res) =>
    sendSuccess(
      res,
      await clientEventTitleService.create(req.body, req.user.id),
      'Our event title created',
      201
    ),
  remove: async (req, res) =>
    sendSuccess(res, await clientEventTitleService.remove(req.params.id), 'Our event title deleted'),
};
