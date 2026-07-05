const menuService = require('../menu.service');
const { assertManagerOwnsEvent } = require('../../helpers/managerScope');
const { resolveId } = require('../../helpers/idResolver');

const managerMenuService = {
  listCategories: (query) => menuService.listCategories(query),
  getCategory: (id) => menuService.getCategory(id),
  createCategory: (data) => menuService.createCategory(data),
  updateCategory: (id, data) => menuService.updateCategory(id, data),
  deleteCategory: (id) => menuService.deleteCategory(id),

  listSubCategories: (query) => menuService.listSubCategories(query),
  getSubCategory: (id) => menuService.getSubCategory(id),
  createSubCategory: (data) => menuService.createSubCategory(data),
  updateSubCategory: (id, data) => menuService.updateSubCategory(id, data),
  deleteSubCategory: (id) => menuService.deleteSubCategory(id),

  listItems: (query) => menuService.listItems(query),
  getItem: (id) => menuService.getItem(id),
  createItem: (data) => menuService.createItem(data),
  updateItem: (id, data) => menuService.updateItem(id, data),
  deleteItem: (id) => menuService.deleteItem(id),

  listPackages: () => menuService.listPackages(),
  getPackage: (id) => menuService.getPackage(id),
  createPackage: (data) => menuService.createPackage(data),
  updatePackage: (id, data) => menuService.updatePackage(id, data),
  deletePackage: (id) => menuService.deletePackage(id),
  listCourses: () => menuService.listCourses(),
  getManagePackages: () => menuService.getManagePackages(),
  createPackageFeature: (data) => menuService.createPackageFeature(data),
  updatePackageFeature: (id, data) => menuService.updatePackageFeature(id, data),
  deletePackageFeature: (id) => menuService.deletePackageFeature(id),
  savePackageSettings: (data) => menuService.savePackageSettings(data),

  async getPlanning(staffId, eventIdOrUuid, category) {
    const eventId = await resolveId('events', eventIdOrUuid);
    await assertManagerOwnsEvent(staffId, eventId);
    return menuService.getPlanning(eventId, category);
  },

  async updatePlanning(staffId, eventIdOrUuid, menuItemIds) {
    const eventId = await resolveId('events', eventIdOrUuid);
    await assertManagerOwnsEvent(staffId, eventId);
    return menuService.updatePlanning(eventId, menuItemIds);
  },
};

module.exports = managerMenuService;
