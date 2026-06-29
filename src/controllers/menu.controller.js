const { sendSuccess } = require('../helpers/response');
const menuService = require('../services/menu.service');
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
  listCategories: async (req, res) => sendSuccess(res, await menuService.listCategories(req.query)),
  getCategory: async (req, res) => sendSuccess(res, await menuService.getCategory(req.params.id)),
  createCategory: async (req, res) => sendSuccess(res, await menuService.createCategory(req.body), 'Category created', 201),
  updateCategory: async (req, res) => sendSuccess(res, await menuService.updateCategory(req.params.id, req.body)),
  deleteCategory: async (req, res) => sendSuccess(res, await menuService.deleteCategory(req.params.id)),
  bulkDeleteCategories: async (req, res) => sendSuccess(res, await menuService.bulkDeleteCategories(req.body.ids)),
  bulkUpdateCategories: async (req, res) => sendSuccess(res, await menuService.bulkUpdateCategories(req.body.ids, req.body)),
  exportCategories: async (req, res) => menuService.exportCategories(res, req.query),
  importCategories: async (req, res) => {
    sendSuccess(res, await menuService.importCategories(getRecords(req)), 'Categories imported', 201);
  },

  listItems: async (req, res) => sendSuccess(res, await menuService.listItems(req.query)),
  getItem: async (req, res) => sendSuccess(res, await menuService.getItem(req.params.id)),
  createItem: async (req, res) => sendSuccess(res, await menuService.createItem(req.body), 'Item created', 201),
  updateItem: async (req, res) => sendSuccess(res, await menuService.updateItem(req.params.id, req.body)),
  deleteItem: async (req, res) => sendSuccess(res, await menuService.deleteItem(req.params.id)),
  bulkDeleteItems: async (req, res) => sendSuccess(res, await menuService.bulkDeleteItems(req.body.ids)),
  bulkUpdateItems: async (req, res) => sendSuccess(res, await menuService.bulkUpdateItems(req.body.ids, req.body)),
  exportItems: async (req, res) => menuService.exportItems(res, req.query),
  importItems: async (req, res) => {
    sendSuccess(res, await menuService.importItems(getRecords(req)), 'Items imported', 201);
  },

  listPackages: async (_req, res) => sendSuccess(res, await menuService.listPackages()),
  listCourses: async (_req, res) => sendSuccess(res, await menuService.listCourses()),
  getPlanning: async (req, res) => sendSuccess(res, await menuService.getPlanning(req.params.eventId, req.query.category)),
  updatePlanning: async (req, res) => sendSuccess(res, await menuService.updatePlanning(req.params.eventId, req.body.menuItemIds)),
};
