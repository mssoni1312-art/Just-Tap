const { sendSuccess } = require('../helpers/response');
const eventService = require('../services/event.service');

module.exports = {
  list: async (req, res) => sendSuccess(res, await eventService.list(req.query)),
  calendar: async (req, res) => sendSuccess(res, await eventService.calendar(req.query)),
  today: async (_req, res) => sendSuccess(res, await eventService.today()),
  upcoming: async (_req, res) => sendSuccess(res, await eventService.upcoming()),
  meta: async (_req, res) => sendSuccess(res, eventService.getMeta()),
  export: async (req, res) => eventService.export(res, req.query),
  getById: async (req, res) => sendSuccess(res, await eventService.getById(req.params.id)),
  create: async (req, res) => sendSuccess(res, await eventService.create(req.body, req.user.id), 'Event created', 201),
  update: async (req, res) => sendSuccess(res, await eventService.update(req.params.id, req.body, req.user.id)),
  remove: async (req, res) => sendSuccess(res, await eventService.delete(req.params.id, req.user.id)),
  bulkDelete: async (req, res) => sendSuccess(res, await eventService.bulkDelete(req.body.ids, req.user.id)),
  bulkUpdate: async (req, res) => sendSuccess(res, await eventService.bulkUpdate(req.body.ids, req.body.status, req.user.id)),
  addFunction: async (req, res) => sendSuccess(res, await eventService.addFunction(req.params.eventId, req.body), 'Function added', 201),
  updateFunction: async (req, res) => sendSuccess(res, await eventService.updateFunction(req.params.eventId, req.params.functionId, req.body)),
  deleteFunction: async (req, res) => sendSuccess(res, await eventService.deleteFunction(req.params.eventId, req.params.functionId)),
};
