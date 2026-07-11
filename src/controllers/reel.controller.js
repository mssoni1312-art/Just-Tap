const { sendSuccess } = require('../helpers/response');
const reelService = require('../services/reel.service');

module.exports = {
  list: async (req, res) => sendSuccess(res, await reelService.list(req.query)),
  create: async (req, res) =>
    sendSuccess(res, await reelService.create(req.file, req.body, req.user.id), 'Reel saved', 201),
  remove: async (req, res) =>
    sendSuccess(res, await reelService.remove(req.params.id), 'Reel deleted'),
};
