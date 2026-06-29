const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate.middleware');
const authenticate = require('../middleware/auth.middleware');
const requireSuperAdmin = require('../middleware/role.middleware');
const { uploadImport } = require('../config/multer');
const inquiryController = require('../controllers/inquiry.controller');
const {
  listInquiriesSchema,
  createInquirySchema,
  updateInquirySchema,
  bulkUpdateInquiriesSchema,
  bulkIdsSchema,
  exportQuerySchema,
} = require('../validations/domain.validation');
const { idParamSchema } = require('../validations/event.validation');

const router = express.Router();
router.use(authenticate, requireSuperAdmin);

router.get('/stats', asyncHandler(inquiryController.stats));
router.get('/export', validate(exportQuerySchema, 'query'), asyncHandler(inquiryController.export));
router.post('/import', uploadImport.single('file'), asyncHandler(inquiryController.import));
router.get('/', validate(listInquiriesSchema, 'query'), asyncHandler(inquiryController.list));
router.post('/', validate(createInquirySchema), asyncHandler(inquiryController.create));
router.post('/bulk-delete', validate(bulkIdsSchema), asyncHandler(inquiryController.bulkDelete));
router.patch('/bulk-update', validate(bulkUpdateInquiriesSchema), asyncHandler(inquiryController.bulkUpdate));
router.get('/:id', validate(idParamSchema, 'params'), asyncHandler(inquiryController.getById));
router.patch('/:id', validate(idParamSchema, 'params'), validate(updateInquirySchema), asyncHandler(inquiryController.update));
router.delete('/:id', validate(idParamSchema, 'params'), asyncHandler(inquiryController.remove));
router.post('/:id/convert', validate(idParamSchema, 'params'), asyncHandler(inquiryController.convert));

module.exports = router;
