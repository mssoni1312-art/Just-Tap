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
  role: Joi.string().valid('event_manager', 'waiter', 'other'),
  isActive: Joi.boolean(),
});

const updateStaffSchema = Joi.object({
  name: Joi.string(),
  role: Joi.string().valid('event_manager', 'waiter', 'other'),
  isActive: Joi.boolean(),
});

const listStaffSchema = paginationQuery.keys({
  role: Joi.string().valid('event_manager', 'waiter', 'other'),
  includeInactive: Joi.string().valid('true', 'false'),
});

const listManagersSchema = paginationQuery.keys({
  includeInactive: Joi.string().valid('true', 'false'),
  forSelect: Joi.string().valid('true', 'false'),
});

const listClientsSchema = paginationQuery.keys({
  forSelect: Joi.string().valid('true', 'false'),
});

const listFunctionNamesSchema = paginationQuery.keys({
  forSelect: Joi.string().valid('true', 'false'),
  includeInactive: Joi.string().valid('true', 'false'),
});

const createFunctionNameSchema = Joi.object({
  name: Joi.string().trim().required(),
  sortOrder: Joi.number().integer().min(0).default(0),
  isActive: Joi.boolean().default(true),
});

const updateFunctionNameSchema = Joi.object({
  name: Joi.string().trim(),
  sortOrder: Joi.number().integer().min(0),
  isActive: Joi.boolean(),
}).min(1);

const createManagerSchema = Joi.object({
  name: Joi.string().trim(),
  memberName: Joi.string().trim(),
  designation: Joi.string().max(150).allow(null, '').trim(),
  isActive: Joi.boolean().default(true),
  email: Joi.string().trim().email(),
  username: Joi.string().trim().email(),
  password: Joi.string().min(6),
}).or('name', 'memberName');

const registerManagerSchema = Joi.object({
  email: Joi.string().trim().email(),
  username: Joi.string().trim().email().description('Login email (alias for email)'),
  password: Joi.string().min(6).required(),
}).or('email', 'username');

const createClientSchema = Joi.object({
  name: Joi.string().trim().required(),
  catererName: Joi.string().trim().allow(null, '').optional(),
  cityName: Joi.string().trim().allow(null, '').optional(),
  contactNo: Joi.string().trim().allow(null, '').optional(),
  reference: Joi.string().trim().allow(null, '').optional(),
  isHighPriority: Joi.boolean().default(false),
});

const bulkUpdateStaffSchema = bulkIdsSchema.keys({
  isActive: Joi.boolean(),
  role: Joi.string().valid('event_manager', 'waiter', 'other'),
});

const createCategorySchema = Joi.object({
  name: Joi.string(),
  name_english: Joi.string(),
  description: Joi.string().allow(null, ''),
  slogan: Joi.string().allow(null, ''),
  image_url: Joi.string().uri().allow(null, ''),
  sort_order: Joi.number().integer().min(0),
}).or('name', 'name_english');

const updateCategorySchema = Joi.object({
  name: Joi.string(),
  name_english: Joi.string(),
  description: Joi.string().allow(null, ''),
  slogan: Joi.string().allow(null, ''),
  image_url: Joi.string().uri().allow(null, ''),
  sort_order: Joi.number().integer().min(0),
});

const createSubCategorySchema = Joi.object({
  category_id: Joi.alternatives().try(Joi.number().integer(), Joi.string().uuid()).required(),
  name: Joi.string(),
  name_english: Joi.string(),
  sort_order: Joi.number().integer().min(0),
}).or('name', 'name_english');

const updateSubCategorySchema = Joi.object({
  category_id: Joi.alternatives().try(Joi.number().integer(), Joi.string().uuid()),
  name: Joi.string(),
  name_english: Joi.string(),
  sort_order: Joi.number().integer().min(0),
});

const listSubCategoriesSchema = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  sortBy: Joi.string(),
  sortOrder: Joi.string().valid('asc', 'desc'),
  search: Joi.string().allow(''),
  categoryId: Joi.alternatives().try(Joi.number().integer(), Joi.string().uuid()),
});

const bulkUpdateCategoriesSchema = bulkIdsSchema.keys({
  sort_order: Joi.number().integer().min(0).required(),
});

const createItemSchema = Joi.object({
  category_id: Joi.number().integer().required(),
  subcategory_id: Joi.alternatives().try(Joi.number().integer(), Joi.string().uuid()).allow(null),
  name: Joi.string(),
  name_english: Joi.string(),
  description: Joi.string().allow(null, ''),
  slogan: Joi.string().allow(null, ''),
  price: Joi.number().min(0).default(0),
  is_veg: Joi.boolean(),
  image_url: Joi.string().uri().allow(null, ''),
  is_best_seller: Joi.boolean(),
  is_active: Joi.boolean(),
}).or('name', 'name_english');

const updateItemSchema = Joi.object({
  category_id: Joi.number().integer(),
  subcategory_id: Joi.alternatives().try(Joi.number().integer(), Joi.string().uuid()).allow(null),
  name: Joi.string(),
  name_english: Joi.string(),
  description: Joi.string().allow(null, ''),
  slogan: Joi.string().allow(null, ''),
  price: Joi.number().min(0),
  is_veg: Joi.boolean(),
  image_url: Joi.string().uri().allow(null, ''),
  is_best_seller: Joi.boolean(),
  is_active: Joi.boolean(),
});

const bulkUpdateItemsSchema = bulkIdsSchema.keys({
  isActive: Joi.boolean(),
  categoryId: Joi.number().integer(),
});

const menuPlanningSchema = Joi.object({
  menuItemIds: Joi.array().items(idParam).min(1).required(),
});

const billingFunctionChargeSchema = Joi.object({
  label: Joi.alternatives().try(Joi.string(), Joi.number()).allow(null, ''),
  description: Joi.alternatives().try(Joi.string(), Joi.number()).allow(null, ''),
  amount: Joi.number().min(0).default(0),
});

const billingFunctionSchema = Joi.object({
  eventFunctionId: Joi.alternatives().try(Joi.number().integer(), Joi.string().uuid()).allow(null),
  name: Joi.string().required(),
  description: Joi.alternatives().try(Joi.string(), Joi.number()).allow(null, ''),
  date: Joi.date().iso().allow(null),
  startTime: Joi.string().allow(null, ''),
  pax: Joi.number().integer().min(0).allow(null),
  extraCharges: Joi.number().min(0),
  extraAmount: Joi.number().min(0),
  ratePerPlate: Joi.number().min(0).allow(null),
  amount: Joi.number().min(0).allow(null),
  charges: Joi.array().items(billingFunctionChargeSchema).default([]),
});

const billingPaymentSchema = Joi.object({
  amount: Joi.number().min(0).default(0),
  paidAt: Joi.date().iso().allow(null),
  description: Joi.string().allow(null, ''),
});

const billingEstimateSchema = Joi.object({
  cgstPercent: Joi.number().min(0).max(100).allow(null),
  cgstAmount: Joi.number().min(0).allow(null),
  sgstPercent: Joi.number().min(0).max(100).allow(null),
  sgstAmount: Joi.number().min(0).allow(null),
  discount: Joi.number().min(0).default(0),
  roundOff: Joi.number().allow(null),
  grandTotal: Joi.number().min(0).allow(null),
});

const saveBillingPreviewSchema = Joi.object({
  showToClient: Joi.boolean().default(false),
  functions: Joi.array().items(billingFunctionSchema).default([]),
  estimate: billingEstimateSchema.default({}),
  payments: Joi.array().items(billingPaymentSchema).default([]),
  advancePayments: Joi.array().items(billingPaymentSchema),
  notes: Joi.string().allow(null, '').default(''),
});

const managerCostAmountSchema = Joi.number().min(0).allow(null);

const saveManagerCostSchema = Joi.object({
  clientCost: managerCostAmountSchema,
  tabletCost: managerCostAmountSchema,
  transportationCost: managerCostAmountSchema,
  assignManagerCost: managerCostAmountSchema,
  photographyVideographyCost: managerCostAmountSchema,
  otherCharges: managerCostAmountSchema,
});

const tableAssignmentSchema = Joi.object({
  tableNumber: Joi.number().integer().required(),
  allocationType: Joi.string().valid('dining', 'captain'),
  staffId: Joi.alternatives().try(Joi.number().integer(), Joi.string().uuid()).allow(null),
  userCode: Joi.string().allow(null, ''),
  description: Joi.string().allow(null, ''),
  eventLabel: Joi.string().allow(null, ''),
});

const bulkTablesSchema = Joi.object({
  assignments: Joi.array().items(tableAssignmentSchema).min(1).required(),
});

const assignTableManagerSchema = Joi.object({
  staffId: Joi.alternatives().try(Joi.number().integer(), Joi.string().uuid()).required(),
  allocationType: Joi.string().valid('dining', 'captain').default('dining'),
});

const assignManagerTablesSchema = Joi.object({
  staffId: Joi.alternatives().try(Joi.number().integer(), Joi.string().uuid()).required(),
  tableNumbers: Joi.array().items(Joi.number().integer().positive()).min(1).required(),
  allocationType: Joi.string().valid('dining', 'captain').default('dining'),
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

const listTaskAssignmentsSchema = paginationQuery.keys({
  status: Joi.string().valid('pending', 'assigned', 'in_progress', 'completed', 'overdue'),
  eventId: Joi.alternatives().try(Joi.number().integer(), Joi.string().uuid()),
  assignedTo: Joi.alternatives().try(Joi.number().integer(), Joi.string().uuid()),
  unassigned: Joi.string().valid('true', 'false'),
  search: Joi.string().allow(''),
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

const createPackageFeatureSchema = Joi.object({
  name: Joi.string().required(),
  isActive: Joi.boolean().default(true),
  sortOrder: Joi.number().integer().min(0),
});

const updatePackageFeatureSchema = Joi.object({
  name: Joi.string(),
  isActive: Joi.boolean(),
  sortOrder: Joi.number().integer().min(0),
});

const createManagePackageSchema = Joi.object({
  name: Joi.string().required(),
  price: Joi.number().min(0).allow(null),
  type: Joi.string().valid('premium', 'silver', 'gold', 'custom').default('custom'),
  isMostPopular: Joi.boolean().default(false),
  sortOrder: Joi.number().integer().min(0),
  includedFeatureIds: Joi.array().items(Joi.number().integer()),
});

const updateManagePackageSchema = Joi.object({
  name: Joi.string(),
  price: Joi.number().min(0).allow(null),
  type: Joi.string().valid('premium', 'silver', 'gold', 'custom'),
  isMostPopular: Joi.boolean(),
  sortOrder: Joi.number().integer().min(0),
  isActive: Joi.boolean(),
  includedFeatureIds: Joi.array().items(Joi.number().integer()),
});

const savePackageSettingsSchema = Joi.object({
  features: Joi.array().items(Joi.object({
    id: Joi.number().integer().required(),
    isActive: Joi.boolean().required(),
    name: Joi.string(),
    sortOrder: Joi.number().integer().min(0),
  })),
  packages: Joi.array().items(Joi.object({
    id: Joi.number().integer().required(),
    name: Joi.string(),
    price: Joi.number().min(0).allow(null),
    isMostPopular: Joi.boolean(),
    sortOrder: Joi.number().integer().min(0),
    includedFeatureIds: Joi.array().items(Joi.number().integer()),
  })),
}).or('features', 'packages');

const questionTypeSchema = Joi.string().valid('rating', 'text', 'single_choice', 'multiple_choice', 'yes_no');

const optionalQuestionTypeSchema = Joi.string()
  .trim()
  .lowercase()
  .empty(['', null])
  .default('rating')
  .valid('rating', 'text', 'single_choice', 'multiple_choice', 'yes_no');

const createFeedbackQuestionSchema = Joi.object({
  questionText: Joi.string().required(),
  questionType: questionTypeSchema.required(),
  options: Joi.array().items(Joi.string()).min(2).when('questionType', {
    is: Joi.valid('single_choice', 'multiple_choice'),
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),
  isRequired: Joi.boolean().default(true),
  sortOrder: Joi.number().integer().min(0).default(0),
  isActive: Joi.boolean().default(true),
  eventId: Joi.alternatives().try(Joi.number().integer(), Joi.string().uuid(), Joi.string().pattern(/^\d+$/)).allow(null),
});

const updateFeedbackQuestionSchema = Joi.object({
  questionText: Joi.string(),
  questionType: questionTypeSchema,
  options: Joi.array().items(Joi.string()).min(2),
  isRequired: Joi.boolean(),
  sortOrder: Joi.number().integer().min(0),
  isActive: Joi.boolean(),
  eventId: Joi.alternatives().try(Joi.number().integer(), Joi.string().uuid(), Joi.string().pattern(/^\d+$/)).allow(null),
});

const listFeedbackQuestionsSchema = paginationQuery.keys({
  eventId: Joi.alternatives().try(Joi.number().integer(), Joi.string().uuid(), Joi.string().pattern(/^\d+$/)),
  scope: Joi.string().valid('global'),
  isActive: Joi.boolean(),
});

const reorderFeedbackQuestionsSchema = Joi.object({
  items: Joi.array().items(
    Joi.object({
      id: Joi.alternatives().try(Joi.number().integer(), Joi.string().uuid(), Joi.string().pattern(/^\d+$/)).required(),
      sortOrder: Joi.number().integer().min(0).required(),
    })
  ).min(1).required(),
});

const publicFeedbackQuestionsSchema = Joi.object({
  eventId: Joi.alternatives().try(Joi.number().integer(), Joi.string().uuid(), Joi.string().pattern(/^\d+$/)).required(),
});

const feedbackAnswerSchema = Joi.object({
  questionId: Joi.alternatives().try(Joi.number().integer(), Joi.string().uuid(), Joi.string().pattern(/^\d+$/)).required(),
  answerText: Joi.string().allow(null, ''),
  answerRating: Joi.number().min(1).max(5).allow(null),
  answerOptions: Joi.array().items(Joi.string()),
});

const submitFeedbackQuestionnaireSchema = Joi.object({
  eventId: Joi.alternatives().try(Joi.number().integer(), Joi.string().uuid(), Joi.string().pattern(/^\d+$/)).required(),
  clientName: Joi.string().allow(null, ''),
  tableNo: Joi.string().allow(null, ''),
  answers: Joi.array().items(feedbackAnswerSchema).min(1).required(),
});

const listFeedbackSubmissionsSchema = paginationQuery;

const adminEventFeedbackQuestionSchema = Joi.object({
  questionText: Joi.string().trim(),
  question: Joi.string().trim(),
  questionType: optionalQuestionTypeSchema,
  options: Joi.alternatives().try(
    Joi.array().items(Joi.string()).min(2),
    Joi.object({
      audience: Joi.string().valid('guest_catering', 'client_service'),
    })
  ),
  isRequired: Joi.boolean().default(true),
  sortOrder: Joi.number().integer().min(0),
  isActive: Joi.boolean().default(true),
  audience: Joi.string().valid('guest_catering', 'client_service'),
}).custom((value, helpers) => {
  const questionText = value.questionText || value.question;
  if (!questionText) {
    return helpers.error('any.custom', { message: 'questionText or question is required' });
  }
  return {
    ...value,
    questionText,
    questionType: value.questionType || 'rating',
  };
});

const eventFeedbackQuestionIdParamSchema = Joi.object({
  eventId: Joi.alternatives().try(Joi.number().integer(), Joi.string().uuid(), Joi.string().pattern(/^\d+$/)).required(),
  questionId: Joi.alternatives().try(Joi.number().integer(), Joi.string().uuid(), Joi.string().pattern(/^\d+$/)).required(),
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
  listClientsSchema,
  listFunctionNamesSchema,
  createFunctionNameSchema,
  updateFunctionNameSchema,
  createManagerSchema,
  registerManagerSchema,
  createClientSchema,
  bulkUpdateStaffSchema,
  createCategorySchema,
  updateCategorySchema,
  createSubCategorySchema,
  updateSubCategorySchema,
  listSubCategoriesSchema,
  bulkUpdateCategoriesSchema,
  createItemSchema,
  updateItemSchema,
  bulkUpdateItemsSchema,
  bulkIdsSchema,
  importRecordsSchema,
  exportQuerySchema,
  menuPlanningSchema,
  saveBillingPreviewSchema,
  saveManagerCostSchema,
  tableAssignmentSchema,
  bulkTablesSchema,
  assignTableManagerSchema,
  assignManagerTablesSchema,
  tableAllocationSchema,
  createTaskSchema,
  updateTaskSchema,
  listTasksSchema,
  listTaskAssignmentsSchema,
  assignTasksSchema,
  feedbackReplySchema,
  listFeedbackSchema,
  orderTableQuerySchema,
  reportQuerySchema,
  createPackageFeatureSchema,
  updatePackageFeatureSchema,
  createManagePackageSchema,
  updateManagePackageSchema,
  savePackageSettingsSchema,
  createFeedbackQuestionSchema,
  updateFeedbackQuestionSchema,
  listFeedbackQuestionsSchema,
  reorderFeedbackQuestionsSchema,
  publicFeedbackQuestionsSchema,
  submitFeedbackQuestionnaireSchema,
  listFeedbackSubmissionsSchema,
  adminEventFeedbackQuestionSchema,
  eventFeedbackQuestionIdParamSchema,
};
