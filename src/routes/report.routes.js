const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate.middleware');
const authenticate = require('../middleware/auth.middleware');
const requireSuperAdmin = require('../middleware/role.middleware');
const { uploadImage } = require('../config/multer');
const reportController = require('../controllers/report.controller');
const {
  createReportSchema,
  listReportTemplatesSchema,
  selectTemplateSchema,
  updateThemeSchema,
  updateTypographySchema,
  updateGridSchema,
  updatePhotoFilterSchema,
  uploadPhotoSchema,
  saveDraftSchema,
  publishReportSchema,
  shareReportSchema,
  generatePdfSchema,
  reportIdParamSchema,
} = require('../validations/report.validation');
const { idParamSchema } = require('../validations/common.validation');

const router = express.Router();
router.use(authenticate, requireSuperAdmin);

router.get('/meta', asyncHandler(reportController.meta));
router.get('/templates', validate(listReportTemplatesSchema, 'query'), asyncHandler(reportController.listTemplates));
router.post('/create', validate(createReportSchema), asyncHandler(reportController.create));
router.post(
  '/upload-photo',
  uploadImage.single('file'),
  validate(uploadPhotoSchema),
  asyncHandler(reportController.uploadPhoto),
);
router.post('/template/select', validate(selectTemplateSchema), asyncHandler(reportController.selectTemplate));
router.patch('/theme', validate(updateThemeSchema), asyncHandler(reportController.updateTheme));
router.patch('/typography', validate(updateTypographySchema), asyncHandler(reportController.updateTypography));
router.patch('/grid', validate(updateGridSchema), asyncHandler(reportController.updateGrid));
router.patch('/photo-filter', validate(updatePhotoFilterSchema), asyncHandler(reportController.updatePhotoFilter));
router.post('/save-draft', validate(saveDraftSchema), asyncHandler(reportController.saveDraft));
router.post('/publish', validate(publishReportSchema), asyncHandler(reportController.publish));
router.post('/share', validate(shareReportSchema), asyncHandler(reportController.share));
router.post('/generate-pdf', validate(generatePdfSchema), asyncHandler(reportController.generatePdf));
router.get('/pdf/:reportId/download', validate(reportIdParamSchema, 'params'), asyncHandler(reportController.downloadPdf));
router.delete('/pdf/:reportId', validate(reportIdParamSchema, 'params'), asyncHandler(reportController.deletePdf));
router.get('/:id', validate(idParamSchema, 'params'), asyncHandler(reportController.getById));

module.exports = router;
