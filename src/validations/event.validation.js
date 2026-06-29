const Joi = require('joi');
const { idParamSchema, eventIdParam, bulkIdsSchema } = require('./common.validation');

const eventStatuses = ['inquiry', 'confirmed', 'cancelled', 'r_menu', 'live'];

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

const createEventSchema = Joi.object({
  inquiryId: Joi.alternatives().try(Joi.number().integer(), Joi.string().uuid()).allow(null),
  clientName: Joi.string().required(),
  clientMobile: Joi.string().allow(null, ''),
  venueName: Joi.string().required(),
  cityName: Joi.string().required(),
  inquiryDate: Joi.date().iso().allow(null),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().required(),
  eventFunctionName: Joi.string().allow(null, ''),
  status: Joi.string().valid(...eventStatuses),
  packageId: Joi.number().integer().allow(null),
  assignedManagerId: Joi.number().integer().allow(null),
  functions: Joi.array().items(functionSchema),
  menuItemIds: Joi.array().items(Joi.alternatives().try(Joi.number().integer(), Joi.string().uuid())),
});

const updateEventSchema = createEventSchema.fork(
  ['clientName', 'venueName', 'cityName', 'startDate', 'endDate'],
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
