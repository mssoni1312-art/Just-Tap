const Joi = require('joi');

const idParam = Joi.alternatives().try(
  Joi.number().integer().positive(),
  Joi.string().pattern(/^\d+$/),
  Joi.string().uuid()
);

const eventIdParam = Joi.object({ eventId: idParam.required() });
const idParamSchema = Joi.object({ id: idParam.required() });

const paginationQuery = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(500),
  search: Joi.string().allow(''),
  sortBy: Joi.string(),
  sortOrder: Joi.string().valid('asc', 'desc'),
});

const exportQuerySchema = paginationQuery.keys({
  format: Joi.string().valid('json', 'csv').default('json'),
  download: Joi.boolean().truthy('true').falsy('false'),
});

const bulkIdsSchema = Joi.object({
  ids: Joi.array().items(idParam).min(1).required(),
});

const importRecordsSchema = Joi.object({
  records: Joi.array().items(Joi.object()).min(1).required(),
});

module.exports = {
  idParam,
  eventIdParam,
  idParamSchema,
  paginationQuery,
  exportQuerySchema,
  bulkIdsSchema,
  importRecordsSchema,
};
