const { sendSuccess } = require('../helpers/response');
const taskService = require('../services/task.service');

module.exports = {
  summary: async (_req, res) => sendSuccess(res, await taskService.getSummary()),
  list: async (req, res) => sendSuccess(res, await taskService.list(req.query)),
  listAssignments: async (req, res) =>
    sendSuccess(res, await taskService.listAssignments(req.query)),
  getById: async (req, res) => sendSuccess(res, await taskService.getById(req.params.id)),
  create: async (req, res) => sendSuccess(res, await taskService.createTemplate(req.body), 'Task created', 201),
  update: async (req, res) => sendSuccess(res, await taskService.updateTemplate(req.params.id, req.body)),
  remove: async (req, res) => sendSuccess(res, await taskService.removeTemplate(req.params.id)),
  bulkDelete: async (req, res) => sendSuccess(res, await taskService.bulkDelete(req.body.ids)),
  export: async (req, res) => taskService.export(res, req.query),
  listByEvent: async (req, res) => sendSuccess(res, await taskService.listByEvent(req.params.eventId, req.query)),
  assign: async (req, res) => sendSuccess(res, await taskService.assignToEvent(req.params.eventId, req.body)),
};
