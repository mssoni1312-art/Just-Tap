const { sendSuccess } = require('../helpers/response');
const inquiryService = require('../services/inquiry.service');
const { parseCsv } = require('../helpers/exportImport');

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
    throw new (require('../utils/AppError'))('Import requires records array or CSV file', 422);
  }
  return req.body.records;
};

module.exports = {
  stats: async (_req, res) => sendSuccess(res, await inquiryService.getStats()),
  list: async (req, res) => sendSuccess(res, await inquiryService.list(req.query)),
  getById: async (req, res) => sendSuccess(res, await inquiryService.getById(req.params.id)),
  create: async (req, res) => sendSuccess(res, await inquiryService.create(req.body, req.user.id), 'Inquiry created', 201),
  update: async (req, res) => sendSuccess(res, await inquiryService.update(req.params.id, req.body, req.user.id)),
  remove: async (req, res) => sendSuccess(res, await inquiryService.remove(req.params.id, req.user.id)),
  bulkDelete: async (req, res) => sendSuccess(res, await inquiryService.bulkDelete(req.body.ids, req.user.id)),
  bulkUpdate: async (req, res) => sendSuccess(res, await inquiryService.bulkUpdate(req.body.ids, req.body, req.user.id)),
  convert: async (req, res) => sendSuccess(res, await inquiryService.convert(req.params.id)),
  export: async (req, res) => inquiryService.export(res, req.query),
  import: async (req, res) => {
    const records = getRecords(req);
    sendSuccess(res, await inquiryService.importRecords(records, req.user.id), 'Inquiries imported', 201);
  },
};
