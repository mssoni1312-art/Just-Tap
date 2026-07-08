const { sendSuccess } = require('../helpers/response');
const reelService = require('../services/reel.service');

module.exports = {
  create: async (req, res) =>
    sendSuccess(res, await reelService.create(req.file, req.body, req.user.id), 'Reel saved', 201),
};
