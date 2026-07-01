const Joi = require('joi');
const { idParamSchema, eventIdParam, bulkIdsSchema } = require('./common.validation');

const eventStatuses = ['inquiry', 'confirmed', 'cancelled', 'r_menu', 'live', 'tentative'];

const listEventsSchema = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(500),
  search: Joi.string().allow(''),
  sortBy: Joi.string(),
  sortOrder: Joi.string().valid('asc', 'desc'),
  status: Joi.string().valid(...eventStatuses),
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso(),
});

const calendarSchema = Joi.object({
  year: Joi.number().integer().min(2000).max(2100),
  month: Joi.number().integer().min(1).max(12),
});

const functionSchema = Joi.object({
  name: Joi.string().required(),
  venue: Joi.string().allow(null, ''),
  date: Joi.date().iso().allow(null),
  startTime: Joi.string().allow(null, ''),
  endTime: Joi.string().allow(null, ''),
  pax: Joi.number().integer().min(0).allow(null),
  rate: Joi.number().min(0).allow(null),
});

const justTapInformationSchema = Joi.object({
  noOfTablets: Joi.number().integer().min(0).allow(null),
  noOfCaptains: Joi.number().integer().min(0).allow(null),
  assignedCaptainIds: Joi.array().items(Joi.number().integer()).max(50),
  noOfManagers: Joi.number().integer().min(0).allow(null),
  assignedManagerIds: Joi.array().items(Joi.number().integer()).max(50),
  rate: Joi.number().min(0).allow(null),
});

const photographyVideographySchema = Joi.object({
  enabled: Joi.boolean().default(false),
  name: Joi.string().allow(null, ''),
  number: Joi.string().allow(null, ''),
  city: Joi.string().allow(null, ''),
  description: Joi.string().allow(null, ''),
  rate: Joi.number().min(0).allow(null),
});

const justSocialInformationSchema = Joi.object({
  clientInstagramId: Joi.string().allow(null, ''),
  noOfFollowers: Joi.number().integer().min(0).allow(null),
  noOfFoodReels: Joi.number().integer().min(0).allow(null),
  noOfTestimonialReels: Joi.number().integer().min(0).allow(null),
});

const brideGroomInformationSchema = Joi.object({
  brideName: Joi.string().allow(null, ''),
  brideInstagramId: Joi.string().allow(null, ''),
  groomName: Joi.string().allow(null, ''),
  groomInstagramId: Joi.string().allow(null, ''),
  imageUrls: Joi.array().items(Joi.string()).max(20),
});

const pricingSchema = Joi.object({
  totalRate: Joi.number().min(0).allow(null),
  discountRate: Joi.number().min(0).max(100).allow(null),
  finalRate: Joi.number().min(0).allow(null),
});

const eventBodySchema = Joi.object({
  inquiryId: Joi.alternatives().try(Joi.number().integer(), Joi.string().uuid()).allow(null),
  clientId: Joi.alternatives().try(Joi.number().integer(), Joi.string().uuid()).allow(null),
  clientName: Joi.string().allow(null, ''),
  clientMobile: Joi.string().allow(null, ''),
  catererName: Joi.string().allow(null, ''),
  reference: Joi.string().allow(null, ''),
  isHighPriority: Joi.boolean().default(false),
  venueName: Joi.string().required(),
  cityName: Joi.string().required(),
  inquiryDate: Joi.date().iso().allow(null),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().required(),
  eventFunctionName: Joi.string().allow(null, ''),
  status: Joi.string().valid(...eventStatuses),
  packageId: Joi.number().integer().allow(null),
  assignedManagerId: Joi.number().integer().allow(null),
  assignedManagerIds: Joi.array().items(Joi.number().integer()).max(50),
  justTapInformation: justTapInformationSchema,
  photographyVideography: photographyVideographySchema,
  justSocialInformation: justSocialInformationSchema,
  brideGroomInformation: brideGroomInformationSchema,
  pricing: pricingSchema,
  functions: Joi.array().items(functionSchema),
  menuItemIds: Joi.array().items(Joi.alternatives().try(Joi.number().integer(), Joi.string().uuid())),
});

const createEventSchema = eventBodySchema.custom((value, helpers) => {
  const hasClientId = value.clientId !== undefined && value.clientId !== null && value.clientId !== '';
  if (!hasClientId) {
    const missing = [];
    if (!value.clientName) missing.push('clientName');
    if (!value.catererName) missing.push('catererName');
    if (!value.cityName) missing.push('cityName');
    if (!value.clientMobile) missing.push('clientMobile');
    if (!value.reference) missing.push('reference');
    if (missing.length) {
      return helpers.message(`When clientId is omitted, required: ${missing.join(', ')}`);
    }
  }

  const photo = value.photographyVideography;
  if (photo?.enabled) {
    const missing = [];
    if (!photo.name) missing.push('photographyVideography.name');
    if (!photo.number) missing.push('photographyVideography.number');
    if (missing.length) {
      return helpers.message(`When photography/videography is enabled, required: ${missing.join(', ')}`);
    }
  }

  if (value.startDate && value.endDate) {
    const start = new Date(value.startDate);
    const end = new Date(value.endDate);
    if (end < start) {
      return helpers.message('endDate must be on or after startDate');
    }
  }

  return value;
});

const updateEventSchema = eventBodySchema.fork(
  ['venueName', 'cityName', 'startDate', 'endDate'],
  (s) => s.optional()
);

const bulkDeleteSchema = bulkIdsSchema;

const bulkUpdateSchema = bulkIdsSchema.keys({
  status: Joi.string().valid(...eventStatuses).required(),
});

const functionIdParamSchema = Joi.object({
  eventId: Joi.alternatives().try(Joi.number().integer(), Joi.string().uuid()).required(),
  functionId: Joi.number().integer().required(),
});

const tableNumberParamSchema = Joi.object({
  eventId: Joi.alternatives().try(Joi.number().integer(), Joi.string().uuid()).required(),
  tableNumber: Joi.number().integer().required(),
});

module.exports = {
  listEventsSchema,
  calendarSchema,
  createEventSchema,
  updateEventSchema,
  bulkDeleteSchema,
  bulkUpdateSchema,
  functionSchema,
  idParamSchema,
  eventIdParam,
  functionIdParamSchema,
  tableNumberParamSchema,
  eventStatuses,
};
