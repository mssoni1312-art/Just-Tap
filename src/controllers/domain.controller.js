const { sendSuccess } = require('../helpers/response');
const tableService = require('../services/table.service');
const orderService = require('../services/order.service');
const { profileService, contentService, uploadService, analyticsService } = require('../services/profile.service');
const authService = require('../services/auth.service');
const { sendExport } = require('../helpers/exportImport');

module.exports = {
  profile: {
    getMe: async (req, res) => sendSuccess(res, await authService.getMe(req.user.id)),
    update: async (req, res) => sendSuccess(res, await profileService.updateProfile(req.user.id, req.body)),
    preferences: async (req, res) => sendSuccess(res, await profileService.updatePreferences(req.user.id, req.body)),
    avatar: async (req, res) => sendSuccess(res, await profileService.saveAvatar(req.user.id, req.file)),
  },
  table: {
    get: async (req, res) => sendSuccess(res, await tableService.getTables(req.params.eventId)),
    bulkSave: async (req, res) => sendSuccess(res, await tableService.bulkSave(req.params.eventId, req.body.assignments)),
    assign: async (req, res) => sendSuccess(res, await tableService.assignSingle(req.params.eventId, req.params.tableNumber, req.body)),
    assignTableManager: async (req, res) => sendSuccess(
      res,
      await tableService.assignTableToManager(
        req.params.eventId,
        Number(req.params.tableNumber),
        req.body.staffId,
        req.body.allocationType
      ),
      'Manager assigned to table'
    ),
    assignManager: async (req, res) => sendSuccess(
      res,
      await tableService.assignTablesToManager(
        req.params.eventId,
        req.body.staffId,
        req.body.tableNumbers,
        req.body.allocationType
      ),
      'Tables assigned to manager'
    ),
    allocate: async (req, res) => sendSuccess(res, await tableService.saveAllocation(req.params.eventId, req.body)),
  },
  order: {
    summary: async (req, res) => sendSuccess(res, await orderService.getSummary(req.params.eventId)),
    tables: async (req, res) => sendSuccess(res, await orderService.getTables(req.params.eventId)),
    tableDetail: async (req, res) => sendSuccess(res, await orderService.getTableOrder(req.params.eventId, req.params.tableNumber, req.query.category)),
    lineItem: async (req, res) => sendSuccess(res, await orderService.getLineItemDetail(req.params.lineItemId)),
    report: async (req, res) => {
      const report = await orderService.getReport(req.params.eventId, req.query.format);
      if (req.query.format === 'csv' && report.content) {
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="order-report-${req.params.eventId}.csv"`);
        return res.status(200).send(report.content);
      }
      sendSuccess(res, report);
    },
  },
  content: {
    about: async (_req, res) => sendSuccess(res, await contentService.getAbout()),
    contact: async (_req, res) => sendSuccess(res, await contentService.getContact()),
  },
  upload: {
    image: async (req, res) => sendSuccess(res, await uploadService.saveUpload(req.user.id, req.file, 'image'), 'Image uploaded', 201),
    document: async (req, res) => sendSuccess(res, await uploadService.saveUpload(req.user.id, req.file, 'document'), 'Document uploaded', 201),
  },
  analytics: {
    sales: async (_req, res) => sendSuccess(res, await analyticsService.getSales()),
    menuReport: async (req, res) =>
      sendSuccess(
        res,
        await analyticsService.getMenuReport({
          search: req.query.search,
          category: req.query.category,
        }),
      ),
  },
};
