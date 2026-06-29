const { sendSuccess } = require('../helpers/response');
const feedbackService = require('../services/feedback.service');

module.exports = {
  summary: async (req, res) => sendSuccess(res, await feedbackService.getSummary(req.params.eventId)),
  list: async (req, res) => sendSuccess(res, await feedbackService.list(req.params.eventId, req.query)),
  reply: async (req, res) => sendSuccess(res, await feedbackService.reply(req.params.id, req.body.replyText)),
  flag: async (req, res) => sendSuccess(res, await feedbackService.flag(req.params.id)),
  bulkFlag: async (req, res) => sendSuccess(res, await feedbackService.bulkFlag(req.body.ids)),
  bulkDelete: async (req, res) => sendSuccess(res, await feedbackService.bulkDelete(req.body.ids)),
  export: async (req, res) => feedbackService.export(res, req.params.eventId, req.query),
};
