const { sendSuccess } = require('../../helpers/response');
const managerEventService = require('../../services/manager/event.service');

module.exports = {
  list: async (req, res) =>
    sendSuccess(res, await managerEventService.list(req.managerStaffId, req.query)),
  calendar: async (req, res) =>
    sendSuccess(res, await managerEventService.calendar(req.managerStaffId, req.query)),
  today: async (req, res) =>
    sendSuccess(res, await managerEventService.today(req.managerStaffId)),
  upcoming: async (req, res) =>
    sendSuccess(res, await managerEventService.upcoming(req.managerStaffId)),
  completed: async (req, res) =>
    sendSuccess(res, await managerEventService.listCompleted(req.managerStaffId, req.query)),
  cancelled: async (req, res) =>
    sendSuccess(res, await managerEventService.listCancelled(req.managerStaffId, req.query)),
  meta: async (_req, res) => sendSuccess(res, managerEventService.getMeta()),
  getById: async (req, res) =>
    sendSuccess(res, await managerEventService.getById(req.managerStaffId, req.params.id)),
  create: async (req, res) =>
    sendSuccess(
      res,
      await managerEventService.create(req.managerStaffId, req.body, req.user.id),
      'Event created',
      201
    ),
  update: async (req, res) =>
    sendSuccess(
      res,
      await managerEventService.update(req.managerStaffId, req.params.id, req.body, req.user.id)
    ),
  remove: async (req, res) =>
    sendSuccess(
      res,
      await managerEventService.delete(req.managerStaffId, req.params.id, req.user.id)
    ),
  addFunction: async (req, res) =>
    sendSuccess(
      res,
      await managerEventService.addFunction(req.managerStaffId, req.params.eventId, req.body),
      'Function added',
      201
    ),
  updateFunction: async (req, res) =>
    sendSuccess(
      res,
      await managerEventService.updateFunction(
        req.managerStaffId,
        req.params.eventId,
        req.params.functionId,
        req.body
      )
    ),
  deleteFunction: async (req, res) =>
    sendSuccess(
      res,
      await managerEventService.deleteFunction(
        req.managerStaffId,
        req.params.eventId,
        req.params.functionId
      )
    ),
};
