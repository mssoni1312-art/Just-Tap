const Joi = require('joi');
const { idParam, paginationQuery, exportQuerySchema, bulkIdsSchema, importRecordsSchema } = require('./common.validation');

const listInquiriesSchema = paginationQuery.keys({
  status: Joi.string().valid('pending', 'converted'),
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso(),
});

const createInquirySchema = Joi.object({
  refNumber: Joi.string(),
  clientName: Joi.string().required(),
  clientPhone: Joi.string().allow(null, ''),
  eventDate: Joi.date().iso().required(),
  timeSlot: Joi.string().required(),
  venue: Joi.string().required(),
  functionName: Joi.string().required(),
  packageName: Joi.string().required(),
  packageId: Joi.number().integer().allow(null),
  capacity: Joi.string().required(),
});

const updateInquirySchema = createInquirySchema.fork(
  ['clientName', 'eventDate', 'timeSlot', 'venue', 'functionName', 'packageName', 'capacity'],
  (s) => s.optional()
).keys({
  status: Joi.string().valid('pending', 'converted'),
});

const bulkUpdateInquiriesSchema = bulkIdsSchema.keys({
  status: Joi.string().valid('pending', 'converted').required(),
});

const createStaffSchema = Joi.object({
  name: Joi.string().required(),
  role: Joi.string().valid('event_manager', 'waiter', 'captain', 'other'),
  isActive: Joi.boolean(),
});

const updateStaffSchema = Joi.object({
  name: Joi.string(),
  role: Joi.string().valid('event_manager', 'waiter', 'captain', 'other'),
  isActive: Joi.boolean(),
});

const listStaffSchema = paginationQuery.keys({
  role: Joi.string().valid('event_manager', 'waiter', 'captain', 'other'),
  includeInactive: Joi.string().valid('true', 'false'),
});

const listManagersSchema = paginationQuery.keys({
  includeInactive: Joi.string().valid('true', 'false'),
});

const bulkUpdateStaffSchema = bulkIdsSchema.keys({
  isActive: Joi.boolean(),
  role: Joi.string().valid('event_manager', 'waiter', 'captain', 'other'),
});

const createCategorySchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow(null, ''),
  sort_order: Joi.number().integer().min(0),
});

const updateCategorySchema = Joi.object({
  name: Joi.string(),
  description: Joi.string().allow(null, ''),
  sort_order: Joi.number().integer().min(0),
});

const bulkUpdateCategoriesSchema = bulkIdsSchema.keys({
  sort_order: Joi.number().integer().min(0).required(),
});

const createItemSchema = Joi.object({
  category_id: Joi.number().integer().required(),
  name: Joi.string().required(),
  description: Joi.string().allow(null, ''),
  price: Joi.number().min(0).required(),
  is_veg: Joi.boolean(),
  image_url: Joi.string().uri().allow(null, ''),
  is_best_seller: Joi.boolean(),
  is_active: Joi.boolean(),
});

const updateItemSchema = createItemSchema.fork(['category_id', 'name', 'price'], (s) => s.optional());

const bulkUpdateItemsSchema = bulkIdsSchema.keys({
  isActive: Joi.boolean(),
  categoryId: Joi.number().integer(),
});

const menuPlanningSchema = Joi.object({
  menuItemIds: Joi.array().items(idParam).min(1).required(),
});

const tableAssignmentSchema = Joi.object({
  tableNumber: Joi.number().integer().required(),
  allocationType: Joi.string().valid('dining', 'captain'),
  userCode: Joi.string().allow(null, ''),
  description: Joi.string().allow(null, ''),
  eventLabel: Joi.string().allow(null, ''),
});

const bulkTablesSchema = Joi.object({
  assignments: Joi.array().items(tableAssignmentSchema).min(1).required(),
});

const tableAllocationSchema = Joi.object({
  diningTables: Joi.array().items(Joi.number().integer()),
  captainTables: Joi.array().items(Joi.number().integer()),
});

const createTaskSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow(null, ''),
  category: Joi.string().allow(null, ''),
});

const updateTaskSchema = Joi.object({
  name: Joi.string(),
  description: Joi.string().allow(null, ''),
  category: Joi.string().allow(null, ''),
  is_active: Joi.boolean(),
});

const listTasksSchema = paginationQuery.keys({
  category: Joi.string().allow(''),
});

const assignTasksSchema = Joi.object({
  tasks: Joi.array().items(Joi.object({
    task_template_id: Joi.alternatives().try(Joi.number().integer(), Joi.string().uuid()).allow(null),
    title: Joi.string().required(),
    description: Joi.string().allow(null, ''),
    due_date: Joi.date().iso().allow(null),
  })).min(1),
  assignedTo: Joi.alternatives().try(Joi.number().integer(), Joi.string().uuid()).allow(null),
});

const feedbackReplySchema = Joi.object({
  replyText: Joi.string().required(),
});

const listFeedbackSchema = paginationQuery.keys({
  stars: Joi.number().integer().min(1).max(5),
  sentiment: Joi.string().valid('HAPPY', 'NEUTRAL', 'UNHAPPY'),
});

const orderTableQuerySchema = Joi.object({
  category: Joi.string().allow(''),
});

const reportQuerySchema = Joi.object({
  format: Joi.string().valid('json', 'csv'),
});

module.exports = {
  listInquiriesSchema,
  createInquirySchema,
  updateInquirySchema,
  bulkUpdateInquiriesSchema,
  createStaffSchema,
  updateStaffSchema,
  listStaffSchema,
  listManagersSchema,
  bulkUpdateStaffSchema,
  createCategorySchema,
  updateCategorySchema,
  bulkUpdateCategoriesSchema,
  createItemSchema,
  updateItemSchema,
  bulkUpdateItemsSchema,
  bulkIdsSchema,
  importRecordsSchema,
  exportQuerySchema,
  menuPlanningSchema,
  tableAssignmentSchema,
  bulkTablesSchema,
  tableAllocationSchema,
  createTaskSchema,
  updateTaskSchema,
  listTasksSchema,
  assignTasksSchema,
  feedbackReplySchema,
  listFeedbackSchema,
  orderTableQuerySchema,
  reportQuerySchema,
};
