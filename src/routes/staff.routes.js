const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate.middleware');
const authenticate = require('../middleware/auth.middleware');
const requireSuperAdmin = require('../middleware/role.middleware');
const { uploadImport } = require('../config/multer');
const staffController = require('../controllers/staff.controller');
const {
  createStaffSchema,
  updateStaffSchema,
  listStaffSchema,
  bulkIdsSchema,
  bulkUpdateStaffSchema,
  exportQuerySchema,
} = require('../validations/domain.validation');
const { idParamSchema } = require('../validations/event.validation');

const router = express.Router();
router.use(authenticate, requireSuperAdmin);

router.get('/export', validate(exportQuerySchema, 'query'), asyncHandler(staffController.export));
router.post('/import', uploadImport.single('file'), asyncHandler(staffController.import));
router.get('/', validate(listStaffSchema, 'query'), asyncHandler(staffController.list));
router.post('/', validate(createStaffSchema), asyncHandler(staffController.create));
router.post('/bulk-delete', validate(bulkIdsSchema), asyncHandler(staffController.bulkDelete));
router.patch('/bulk-update', validate(bulkUpdateStaffSchema), asyncHandler(staffController.bulkUpdate));
router.get('/:id', validate(idParamSchema, 'params'), asyncHandler(staffController.getById));
router.patch('/:id', validate(idParamSchema, 'params'), validate(updateStaffSchema), asyncHandler(staffController.update));
router.delete('/:id', validate(idParamSchema, 'params'), asyncHandler(staffController.remove));

module.exports = router;
