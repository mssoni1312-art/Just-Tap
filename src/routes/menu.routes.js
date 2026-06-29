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
  createItemSchema,
  updateItemSchema,
  bulkIdsSchema,
  bulkUpdateCategoriesSchema,
  bulkUpdateItemsSchema,
  exportQuerySchema,
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
router.get('/courses', asyncHandler(menuController.listCourses));

module.exports = router;
