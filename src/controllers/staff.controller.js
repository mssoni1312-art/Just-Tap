const { sendSuccess } = require('../helpers/response');
const staffService = require('../services/staff.service');
const { parseCsv } = require('../helpers/exportImport');
const AppError = require('../utils/AppError');

const getRecords = (req) => {
  if (req.file) {
    const content = req.file.buffer.toString('utf8');
    if (req.file.mimetype === 'application/json' || req.file.originalname.endsWith('.json')) {
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) ? parsed : parsed.records || [];
    }
    return parseCsv(content);
  }
  if (!req.body.records?.length) {
    throw new AppError('Import requires records array or CSV file', 422);
  }
  return req.body.records;
};

module.exports = {
  list: async (req, res) => sendSuccess(res, await staffService.list(req.query)),
  getById: async (req, res) => sendSuccess(res, await staffService.getById(req.params.id)),
  create: async (req, res) => sendSuccess(res, await staffService.create(req.body), 'Staff created', 201),
  update: async (req, res) => sendSuccess(res, await staffService.update(req.params.id, req.body)),
  remove: async (req, res) => sendSuccess(res, await staffService.remove(req.params.id)),
  bulkDelete: async (req, res) => sendSuccess(res, await staffService.bulkDelete(req.body.ids)),
  bulkUpdate: async (req, res) => sendSuccess(res, await staffService.bulkUpdate(req.body.ids, req.body)),
  export: async (req, res) => staffService.export(res, req.query),
  import: async (req, res) => {
    sendSuccess(res, await staffService.importRecords(getRecords(req)), 'Staff imported', 201);
  },
};
