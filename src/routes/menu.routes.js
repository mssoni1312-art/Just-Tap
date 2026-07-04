const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate.middleware');
const authenticate = require('../middleware/auth.middleware');
const requireSuperAdmin = require('../middleware/role.middleware');
const { uploadImport } = require('../config/multer');
const menuController = require('../controllers/menu.controller');
const { paginationSchema } = require('../validations/auth.validation');
const {
  createCategorySchema,
  updateCategorySchema,
  createSubCategorySchema,
  updateSubCategorySchema,
  listSubCategoriesSchema,
  createItemSchema,
  updateItemSchema,
  bulkIdsSchema,
  bulkUpdateCategoriesSchema,
  bulkUpdateItemsSchema,
  exportQuerySchema,
  createPackageFeatureSchema,
  updatePackageFeatureSchema,
  createManagePackageSchema,
  updateManagePackageSchema,
  savePackageSettingsSchema,
} = require('../validations/domain.validation');
const { idParamSchema } = require('../validations/event.validation');

const router = express.Router();
router.use(authenticate, requireSuperAdmin);

router.get('/categories/export', validate(exportQuerySchema, 'query'), asyncHandler(menuController.exportCategories));
router.post('/categories/import', uploadImport.single('file'), asyncHandler(menuController.importCategories));
router.get('/categories', validate(paginationSchema, 'query'), asyncHandler(menuController.listCategories));
router.post('/categories', validate(createCategorySchema), asyncHandler(menuController.createCategory));
router.post('/categories/bulk-delete', validate(bulkIdsSchema), asyncHandler(menuController.bulkDeleteCategories));
router.patch('/categories/bulk-update', validate(bulkUpdateCategoriesSchema), asyncHandler(menuController.bulkUpdateCategories));
router.get('/categories/:id', validate(idParamSchema, 'params'), asyncHandler(menuController.getCategory));
router.patch('/categories/:id', validate(idParamSchema, 'params'), validate(updateCategorySchema), asyncHandler(menuController.updateCategory));
router.delete('/categories/:id', validate(idParamSchema, 'params'), asyncHandler(menuController.deleteCategory));

router.get('/subcategories', validate(listSubCategoriesSchema, 'query'), asyncHandler(menuController.listSubCategories));
router.post('/subcategories', validate(createSubCategorySchema), asyncHandler(menuController.createSubCategory));
router.get('/subcategories/:id', validate(idParamSchema, 'params'), asyncHandler(menuController.getSubCategory));
router.patch('/subcategories/:id', validate(idParamSchema, 'params'), validate(updateSubCategorySchema), asyncHandler(menuController.updateSubCategory));
router.delete('/subcategories/:id', validate(idParamSchema, 'params'), asyncHandler(menuController.deleteSubCategory));

router.get('/items/export', validate(exportQuerySchema, 'query'), asyncHandler(menuController.exportItems));
router.post('/items/import', uploadImport.single('file'), asyncHandler(menuController.importItems));
router.get('/items', validate(paginationSchema, 'query'), asyncHandler(menuController.listItems));
router.post('/items', validate(createItemSchema), asyncHandler(menuController.createItem));
router.post('/items/bulk-delete', validate(bulkIdsSchema), asyncHandler(menuController.bulkDeleteItems));
router.patch('/items/bulk-update', validate(bulkUpdateItemsSchema), asyncHandler(menuController.bulkUpdateItems));
router.get('/items/:id', validate(idParamSchema, 'params'), asyncHandler(menuController.getItem));
router.patch('/items/:id', validate(idParamSchema, 'params'), validate(updateItemSchema), asyncHandler(menuController.updateItem));
router.delete('/items/:id', validate(idParamSchema, 'params'), asyncHandler(menuController.deleteItem));

router.get('/packages', asyncHandler(menuController.listPackages));
router.post('/packages', validate(createManagePackageSchema), asyncHandler(menuController.createPackage));
router.patch('/package-settings', validate(savePackageSettingsSchema), asyncHandler(menuController.savePackageSettings));
router.get('/package-features', asyncHandler(menuController.getManagePackages));
router.post('/package-features', validate(createPackageFeatureSchema), asyncHandler(menuController.createPackageFeature));
router.patch('/package-features/:id', validate(idParamSchema, 'params'), validate(updatePackageFeatureSchema), asyncHandler(menuController.updatePackageFeature));
router.delete('/package-features/:id', validate(idParamSchema, 'params'), asyncHandler(menuController.deletePackageFeature));
router.get('/packages/:id', validate(idParamSchema, 'params'), asyncHandler(menuController.getPackage));
router.patch('/packages/:id', validate(idParamSchema, 'params'), validate(updateManagePackageSchema), asyncHandler(menuController.updatePackage));
router.delete('/packages/:id', validate(idParamSchema, 'params'), asyncHandler(menuController.deletePackage));
router.get('/courses', asyncHandler(menuController.listCourses));

module.exports = router;
