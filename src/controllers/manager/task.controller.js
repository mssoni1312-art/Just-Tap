const { sendSuccess } = require('../../helpers/response');
const managerTaskService = require('../../services/manager/task.service');
const managerAllTaskService = require('../../services/manager/allTask.service');

module.exports = {
  summary: async (_req, res) => sendSuccess(res, await managerTaskService.getSummary()),
  listTemplates: async (req, res) =>
    sendSuccess(res, await managerTaskService.listTemplates(req.query)),
  list: async (req, res) =>
    sendSuccess(res, await managerTaskService.list(req.managerStaffId, req.query)),
  getById: async (req, res) =>
    sendSuccess(res, await managerTaskService.getById(req.managerStaffId, req.params.id)),
  create: async (req, res) =>
    sendSuccess(
      res,
      await managerTaskService.create(req.managerStaffId, req.body.eventId, req.body),
      'Task created',
      201
    ),
  assign: async (req, res) =>
    sendSuccess(
      res,
      await managerTaskService.assign(req.managerStaffId, req.params.eventId, req.body)
    ),
  listByEvent: async (req, res) =>
    sendSuccess(
      res,
      await managerTaskService.listByEvent(req.managerStaffId, req.params.eventId, req.query)
    ),
  update: async (req, res) =>
    sendSuccess(res, await managerTaskService.update(req.managerStaffId, req.params.id, req.body)),
  complete: async (req, res) =>
    sendSuccess(res, await managerTaskService.complete(req.managerStaffId, req.params.id)),
  remove: async (req, res) =>
    sendSuccess(res, await managerTaskService.remove(req.managerStaffId, req.params.id)),

  getAllTasks: async (req, res) =>
    sendSuccess(
      res,
      await managerAllTaskService.getAllTasks(req.managerStaffId, req.params.eventId)
    ),
  updateAllTasks: async (req, res) =>
    sendSuccess(
      res,
      await managerAllTaskService.update(req.managerStaffId, req.params.eventId, req.body)
    ),
  completeAllTasks: async (req, res) =>
    sendSuccess(
      res,
      await managerAllTaskService.complete(req.managerStaffId, req.params.eventId),
      'All tasks marked as completed'
    ),
  abandonAllTasks: async (req, res) =>
    sendSuccess(
      res,
      await managerAllTaskService.abandon(req.managerStaffId, req.params.eventId),
      'All tasks abandoned'
    ),
  uploadAllTaskAttachment: async (req, res) =>
    sendSuccess(
      res,
      await managerAllTaskService.addAttachment(
        req.managerStaffId,
        req.params.eventId,
        req.file,
        req.user.id
      ),
      'Attachment uploaded',
      201
    ),
  removeAllTaskAttachment: async (req, res) =>
    sendSuccess(
      res,
      await managerAllTaskService.removeAttachment(
        req.managerStaffId,
        req.params.eventId,
        req.params.attachmentId
      ),
      'Attachment deleted'
    ),
};
