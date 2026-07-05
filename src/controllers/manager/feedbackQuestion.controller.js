const { sendSuccess } = require('../../helpers/response');
const managerFeedbackQuestionService = require('../../services/manager/feedbackQuestion.service');

module.exports = {
  list: async (req, res) =>
    sendSuccess(
      res,
      await managerFeedbackQuestionService.list(req.managerStaffId, req.params.eventId)
    ),
  create: async (req, res) =>
    sendSuccess(
      res,
      await managerFeedbackQuestionService.create(
        req.managerStaffId,
        req.params.eventId,
        req.body
      ),
      'Question created',
      201
    ),
  remove: async (req, res) =>
    sendSuccess(
      res,
      await managerFeedbackQuestionService.remove(
        req.managerStaffId,
        req.params.eventId,
        req.params.questionId
      )
    ),
};
