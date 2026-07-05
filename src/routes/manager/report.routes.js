const express = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middleware/validate.middleware');
const authenticate = require('../../middleware/auth.middleware');
const requireManager = require('../../middleware/requireManager.middleware');
const resolveManagerStaff = require('../../middleware/resolveManagerStaff.middleware');
const { uploadImage } = require('../../config/multer');
const domain = require('../../controllers/manager/domain.controller');
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
  photoIdParamSchema,
} = require('../../validations/report.validation');
const { idParamSchema } = require('../../validations/common.validation');

const router = express.Router();
router.use(authenticate, requireManager, resolveManagerStaff);

router.get('/meta', asyncHandler(domain.report.meta));
router.get('/templates', validate(listReportTemplatesSchema, 'query'), asyncHandler(domain.report.listTemplates));
router.post('/create', validate(createReportSchema), asyncHandler(domain.report.create));
router.post(
  '/upload-photo',
  uploadImage.single('file'),
  validate(uploadPhotoSchema),
  asyncHandler(domain.report.uploadPhoto)
);
router.delete('/photo/:photoId', validate(photoIdParamSchema, 'params'), asyncHandler(domain.report.deletePhoto));
router.post('/template/select', validate(selectTemplateSchema), asyncHandler(domain.report.selectTemplate));
router.patch('/theme', validate(updateThemeSchema), asyncHandler(domain.report.updateTheme));
router.patch('/typography', validate(updateTypographySchema), asyncHandler(domain.report.updateTypography));
router.patch('/grid', validate(updateGridSchema), asyncHandler(domain.report.updateGrid));
router.patch('/photo-filter', validate(updatePhotoFilterSchema), asyncHandler(domain.report.updatePhotoFilter));
router.post('/save-draft', validate(saveDraftSchema), asyncHandler(domain.report.saveDraft));
router.post('/publish', validate(publishReportSchema), asyncHandler(domain.report.publish));
router.post('/share', validate(shareReportSchema), asyncHandler(domain.report.share));
router.post('/generate-pdf', validate(generatePdfSchema), asyncHandler(domain.report.generatePdf));
router.get('/pdf/:reportId/download', validate(reportIdParamSchema, 'params'), asyncHandler(domain.report.downloadPdf));
router.delete('/pdf/:reportId', validate(reportIdParamSchema, 'params'), asyncHandler(domain.report.deletePdf));
router.get('/:id', validate(idParamSchema, 'params'), asyncHandler(domain.report.getById));

module.exports = router;
