const { sendSuccess } = require('../../helpers/response');
const managerFeedbackService = require('../../services/manager/feedback.service');

module.exports = {
  list: async (req, res) =>
    sendSuccess(res, await managerFeedbackService.list(req.managerStaffId, req.query)),
  getById: async (req, res) =>
    sendSuccess(res, await managerFeedbackService.getById(req.managerStaffId, req.params.id)),
  listByEvent: async (req, res) =>
    sendSuccess(
      res,
      await managerFeedbackService.listByEvent(req.managerStaffId, req.params.eventId, req.query)
    ),
  summary: async (req, res) =>
    sendSuccess(
      res,
      await managerFeedbackService.getSummary(req.managerStaffId, req.params.eventId)
    ),
  reply: async (req, res) =>
    sendSuccess(
      res,
      await managerFeedbackService.reply(req.managerStaffId, req.params.id, req.body.replyText)
    ),
  flag: async (req, res) =>
    sendSuccess(res, await managerFeedbackService.flag(req.managerStaffId, req.params.id)),
  remove: async (req, res) =>
    sendSuccess(res, await managerFeedbackService.remove(req.managerStaffId, req.params.id)),
};
