const { sendSuccess } = require('../helpers/response');
const feedbackQuestionService = require('../services/feedbackQuestion.service');

module.exports = {
  list: async (req, res) => sendSuccess(res, await feedbackQuestionService.list(req.query)),
  getById: async (req, res) => sendSuccess(res, await feedbackQuestionService.getById(req.params.id)),
  create: async (req, res) =>
    sendSuccess(res, await feedbackQuestionService.create(req.body, req.user.id), 'Question created', 201),
  update: async (req, res) =>
    sendSuccess(res, await feedbackQuestionService.update(req.params.id, req.body, req.user.id)),
  remove: async (req, res) =>
    sendSuccess(res, await feedbackQuestionService.remove(req.params.id, req.user.id)),
  bulkDelete: async (req, res) =>
    sendSuccess(res, await feedbackQuestionService.bulkDelete(req.body.ids, req.user.id)),
  reorder: async (req, res) =>
    sendSuccess(res, await feedbackQuestionService.reorder(req.body.items, req.user.id)),
  listByEvent: async (req, res) =>
    sendSuccess(res, await feedbackQuestionService.listByEvent(req.params.eventId, req.query)),
  createForEvent: async (req, res) =>
    sendSuccess(
      res,
      await feedbackQuestionService.createForEvent(req.params.eventId, req.body, req.user.id),
      'Question created',
      201
    ),
  removeForEvent: async (req, res) =>
    sendSuccess(
      res,
      await feedbackQuestionService.removeForEvent(req.params.eventId, req.params.questionId, req.user.id)
    ),
  listSubmissions: async (req, res) =>
    sendSuccess(res, await feedbackQuestionService.listSubmissions(req.params.eventId, req.query)),
  getActiveForEvent: async (req, res) =>
    sendSuccess(res, await feedbackQuestionService.getActiveForEvent(req.params.eventId)),
  getActiveByQuery: async (req, res) =>
    sendSuccess(res, await feedbackQuestionService.getActiveForEvent(req.query.eventId)),
  submit: async (req, res) =>
    sendSuccess(res, await feedbackQuestionService.submitResponses(req.body), 'Feedback submitted', 201),
};
