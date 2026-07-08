const { sendSuccess } = require('../../helpers/response');
const clientEventTitleService = require('../../services/clientEventTitle.service');

module.exports = {
  list: async (req, res) => sendSuccess(res, await clientEventTitleService.list(req.query)),
};
