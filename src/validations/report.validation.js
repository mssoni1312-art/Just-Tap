const Joi = require('joi');
const { idParam, paginationQuery } = require('./common.validation');

const colorValueSchema = Joi.object({
  hex: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).required(),
  opacity: Joi.number().min(0).max(100).default(100),
});

const reportIdBody = Joi.object({
  reportId: idParam.required(),
});

const createReportSchema = Joi.object({
  eventId: idParam.required(),
  packageId: idParam.allow(null),
  templateId: idParam.allow(null),
  includeMenuInTemplate: Joi.boolean().default(true),
  layoutPosition: Joi.string().valid('top', 'background', 'side').allow(null),
});

const listReportTemplatesSchema = paginationQuery.keys({
  category: Joi.string().valid('all', 'luxury', 'minimal', 'classic', 'custom').default('all'),
});

const selectTemplateSchema = reportIdBody.keys({
  templateId: idParam.required(),
});

const updateThemeSchema = reportIdBody.keys({
  colors: Joi.object().pattern(
    Joi.string(),
    colorValueSchema
  ).min(1).required(),
});

const updateTypographySchema = reportIdBody.keys({
  fontPairing: Joi.string().valid('playfair_inter', 'space_grotesk_mono', 'fraunces_inter'),
  sizeScaling: Joi.number().min(50).max(200),
}).or('fontPairing', 'sizeScaling');

const updateGridSchema = reportIdBody.keys({
  preset: Joi.string().valid('compact', 'default', 'spacious'),
  customIntensity: Joi.number().min(0).max(100),
}).or('preset', 'customIntensity');

const updatePhotoFilterSchema = reportIdBody.keys({
  preset: Joi.string().valid('none', 'vintage_gold', 'high_contrast', 'warm', 'cool', 'sepia'),
  intensity: Joi.number().min(0).max(100),
}).or('preset', 'intensity');

const uploadPhotoSchema = Joi.object({
  reportId: idParam.required(),
  sortOrder: Joi.number().integer().min(0),
  setAsBrideGroomPhoto: Joi.boolean().truthy('true').falsy('false').default(false),
});

const uploadTemplateSchema = Joi.object({
  name: Joi.string().trim().max(150).allow('', null),
});

const saveDraftSchema = reportIdBody.keys({
  packageId: idParam.allow(null),
  includeMenuInTemplate: Joi.boolean(),
  layoutPosition: Joi.string().valid('top', 'background', 'side').allow(null),
});

const publishReportSchema = reportIdBody;

const shareReportSchema = reportIdBody.keys({
  notes: Joi.string().allow('', null).max(500),
  expiresAt: Joi.date().iso().allow(null),
});

const generatePdfSchema = Joi.object({
  reportId: idParam.required(),
}).prefs({ convert: true });

const reportIdParamSchema = Joi.object({
  reportId: idParam.required(),
});

const photoIdParamSchema = Joi.object({
  photoId: idParam.required(),
});

const eventIdParamSchema = Joi.object({
  eventId: idParam.required(),
});

module.exports = {
  createReportSchema,
  listReportTemplatesSchema,
  selectTemplateSchema,
  updateThemeSchema,
  updateTypographySchema,
  updateGridSchema,
  updatePhotoFilterSchema,
  uploadPhotoSchema,
  uploadTemplateSchema,
  saveDraftSchema,
  publishReportSchema,
  shareReportSchema,
  generatePdfSchema,
  reportIdParamSchema,
  photoIdParamSchema,
  eventIdParamSchema,
};
