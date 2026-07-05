const { sendSuccess } = require('../../helpers/response');
const managerMenuService = require('../../services/manager/menu.service');

module.exports = {
  listCategories: async (req, res) =>
    sendSuccess(res, await managerMenuService.listCategories(req.query)),
  getCategory: async (req, res) =>
    sendSuccess(res, await managerMenuService.getCategory(req.params.id)),
  createCategory: async (req, res) =>
    sendSuccess(res, await managerMenuService.createCategory(req.body), 'Category created', 201),
  updateCategory: async (req, res) =>
    sendSuccess(res, await managerMenuService.updateCategory(req.params.id, req.body)),
  deleteCategory: async (req, res) =>
    sendSuccess(res, await managerMenuService.deleteCategory(req.params.id)),
  listSubCategories: async (req, res) =>
    sendSuccess(res, await managerMenuService.listSubCategories(req.query)),
  createSubCategory: async (req, res) =>
    sendSuccess(res, await managerMenuService.createSubCategory(req.body), 'Subcategory created', 201),
  listItems: async (req, res) =>
    sendSuccess(res, await managerMenuService.listItems(req.query)),
  getItem: async (req, res) =>
    sendSuccess(res, await managerMenuService.getItem(req.params.id)),
  createItem: async (req, res) =>
    sendSuccess(res, await managerMenuService.createItem(req.body), 'Item created', 201),
  updateItem: async (req, res) =>
    sendSuccess(res, await managerMenuService.updateItem(req.params.id, req.body)),
  deleteItem: async (req, res) =>
    sendSuccess(res, await managerMenuService.deleteItem(req.params.id)),
  listPackages: async (_req, res) => sendSuccess(res, await managerMenuService.listPackages()),
  getPackage: async (req, res) => sendSuccess(res, await managerMenuService.getPackage(req.params.id)),
  createPackage: async (req, res) =>
    sendSuccess(res, await managerMenuService.createPackage(req.body), 'Package created', 201),
  updatePackage: async (req, res) =>
    sendSuccess(res, await managerMenuService.updatePackage(req.params.id, req.body)),
  deletePackage: async (req, res) =>
    sendSuccess(res, await managerMenuService.deletePackage(req.params.id)),
  listCourses: async (_req, res) => sendSuccess(res, await managerMenuService.listCourses()),
  getManagePackages: async (_req, res) => sendSuccess(res, await managerMenuService.getManagePackages()),
  createPackageFeature: async (req, res) =>
    sendSuccess(res, await managerMenuService.createPackageFeature(req.body), 'Feature created', 201),
  updatePackageFeature: async (req, res) =>
    sendSuccess(res, await managerMenuService.updatePackageFeature(req.params.id, req.body)),
  deletePackageFeature: async (req, res) =>
    sendSuccess(res, await managerMenuService.deletePackageFeature(req.params.id)),
  savePackageSettings: async (req, res) =>
    sendSuccess(res, await managerMenuService.savePackageSettings(req.body), 'Package settings saved'),
  getPlanning: async (req, res) =>
    sendSuccess(
      res,
      await managerMenuService.getPlanning(req.managerStaffId, req.params.eventId, req.query.category)
    ),
  updatePlanning: async (req, res) =>
    sendSuccess(
      res,
      await managerMenuService.updatePlanning(
        req.managerStaffId,
        req.params.eventId,
        req.body.menuItemIds
      )
    ),
};
