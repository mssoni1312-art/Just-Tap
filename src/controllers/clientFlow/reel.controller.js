const { sendSuccess } = require('../../helpers/response');
const clientFlowReelService = require('../../services/clientFlow/reel.service');

module.exports = {
  list: async (req, res) => sendSuccess(res, await clientFlowReelService.list(req.query)),
};
