const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate.middleware');
const authenticate = require('../middleware/auth.middleware');
const requireSuperAdmin = require('../middleware/role.middleware');
const eventController = require('../controllers/event.controller');
const menuController = require('../controllers/menu.controller');
const taskController = require('../controllers/task.controller');
const feedbackController = require('../controllers/feedback.controller');
const feedbackQuestionController = require('../controllers/feedbackQuestion.controller');
const clientDashboardContentController = require('../controllers/clientDashboardContent.controller');
const { uploadVideo } = require('../config/multer');
const billingController = require('../controllers/billing.controller');
const managerCostController = require('../controllers/managerCost.controller');
const domain = require('../controllers/domain.controller');
const {
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
  assignEventManagersSchema,
} = require('../validations/event.validation');
const {
  menuPlanningSchema,
  saveBillingPreviewSchema,
  saveManagerCostSchema,
  bulkTablesSchema,
  tableAssignmentSchema,
  assignTableManagerSchema,
  assignManagerTablesSchema,
  tableAllocationSchema,
  assignTasksSchema,
  listFeedbackSchema,
  listFeedbackSubmissionsSchema,
  listFeedbackQuestionsSchema,
  adminEventFeedbackQuestionSchema,
  eventFeedbackQuestionIdParamSchema,
  createClientDashboardContentSchema,
  updateDiscoverExperienceSchema,
  updateTestimonialSchema,
  orderTableQuerySchema,
  reportQuerySchema,
  listTasksSchema,
  exportQuerySchema,
} = require('../validations/domain.validation');

const router = express.Router();
router.use(authenticate, requireSuperAdmin);

router.get('/meta', asyncHandler(eventController.meta));
router.get('/calendar', validate(calendarSchema, 'query'), asyncHandler(eventController.calendar));
router.get('/today', asyncHandler(eventController.today));
router.get('/upcoming', asyncHandler(eventController.upcoming));
router.get('/export', validate(exportQuerySchema, 'query'), asyncHandler(eventController.export));
router.get('/', validate(listEventsSchema, 'query'), asyncHandler(eventController.list));
router.post('/', validate(createEventSchema), asyncHandler(eventController.create));
router.post('/bulk-delete', validate(bulkDeleteSchema), asyncHandler(eventController.bulkDelete));
router.patch('/bulk-update', validate(bulkUpdateSchema), asyncHandler(eventController.bulkUpdate));

router.get('/:id', validate(idParamSchema, 'params'), asyncHandler(eventController.getById));
router.patch('/:id', validate(idParamSchema, 'params'), validate(updateEventSchema), asyncHandler(eventController.update));
router.delete('/:id', validate(idParamSchema, 'params'), asyncHandler(eventController.remove));

router.post(
  '/:eventId/assign-managers',
  validate(eventIdParam, 'params'),
  validate(assignEventManagersSchema),
  asyncHandler(eventController.assignManagers),
);

router.get('/:eventId/tasks', validate(eventIdParam, 'params'), validate(listTasksSchema, 'query'), asyncHandler(taskController.listByEvent));
router.post('/:eventId/tasks/assign', validate(eventIdParam, 'params'), validate(assignTasksSchema), asyncHandler(taskController.assign));

router.post('/:eventId/functions', validate(eventIdParam, 'params'), validate(functionSchema), asyncHandler(eventController.addFunction));
router.patch('/:eventId/functions/:functionId', validate(functionIdParamSchema, 'params'), validate(functionSchema), asyncHandler(eventController.updateFunction));
router.delete('/:eventId/functions/:functionId', validate(functionIdParamSchema, 'params'), asyncHandler(eventController.deleteFunction));

router.get('/:eventId/menu-planning', validate(eventIdParam, 'params'), asyncHandler(menuController.getPlanning));
router.put('/:eventId/menu-planning', validate(eventIdParam, 'params'), validate(menuPlanningSchema), asyncHandler(menuController.updatePlanning));

router.get('/:eventId/billing', validate(eventIdParam, 'params'), asyncHandler(billingController.get));
router.get('/:eventId/billing/preview', validate(eventIdParam, 'params'), asyncHandler(billingController.getClientPreview));
router.put('/:eventId/billing/save-preview', validate(eventIdParam, 'params'), validate(saveBillingPreviewSchema), asyncHandler(billingController.savePreview));

router.get('/:eventId/manager-cost', validate(eventIdParam, 'params'), asyncHandler(managerCostController.get));
router.put('/:eventId/manager-cost', validate(eventIdParam, 'params'), validate(saveManagerCostSchema), asyncHandler(managerCostController.save));

router.get('/:eventId/tables', validate(eventIdParam, 'params'), asyncHandler(domain.table.get));
router.put('/:eventId/tables', validate(eventIdParam, 'params'), validate(bulkTablesSchema), asyncHandler(domain.table.bulkSave));
router.post('/:eventId/tables/assign-manager', validate(eventIdParam, 'params'), validate(assignManagerTablesSchema), asyncHandler(domain.table.assignManager));
router.post('/:eventId/tables/:tableNumber/assign-manager', validate(tableNumberParamSchema, 'params'), validate(assignTableManagerSchema), asyncHandler(domain.table.assignTableManager));
router.post('/:eventId/tables/:tableNumber/assign', validate(tableNumberParamSchema, 'params'), validate(tableAssignmentSchema), asyncHandler(domain.table.assign));
router.post('/:eventId/table-allocation', validate(eventIdParam, 'params'), validate(tableAllocationSchema), asyncHandler(domain.table.allocate));

router.get('/:eventId/orders/summary', validate(eventIdParam, 'params'), asyncHandler(domain.order.summary));
router.get('/:eventId/orders/tables', validate(eventIdParam, 'params'), asyncHandler(domain.order.tables));
router.get('/:eventId/orders/tables/:tableNumber', validate(tableNumberParamSchema, 'params'), validate(orderTableQuerySchema, 'query'), asyncHandler(domain.order.tableDetail));
router.get('/:eventId/orders/report', validate(eventIdParam, 'params'), validate(reportQuerySchema, 'query'), asyncHandler(domain.order.report));

router.get('/:eventId/feedback/export', validate(eventIdParam, 'params'), validate(exportQuerySchema, 'query'), asyncHandler(feedbackController.export));
router.get('/:eventId/feedback/summary', validate(eventIdParam, 'params'), asyncHandler(feedbackController.summary));
router.get('/:eventId/feedback', validate(eventIdParam, 'params'), validate(listFeedbackSchema, 'query'), asyncHandler(feedbackController.list));
router.get(
  '/:eventId/feedback/questions',
  validate(eventIdParam, 'params'),
  validate(listFeedbackQuestionsSchema, 'query'),
  asyncHandler(feedbackQuestionController.listByEvent)
);
router.post(
  '/:eventId/feedback/questions',
  validate(eventIdParam, 'params'),
  validate(adminEventFeedbackQuestionSchema),
  asyncHandler(feedbackQuestionController.createForEvent)
);
router.delete(
  '/:eventId/feedback/questions/:questionId',
  validate(eventFeedbackQuestionIdParamSchema, 'params'),
  asyncHandler(feedbackQuestionController.removeForEvent)
);
router.get('/:eventId/feedback-questionnaire/submissions', validate(eventIdParam, 'params'), validate(listFeedbackSubmissionsSchema, 'query'), asyncHandler(feedbackQuestionController.listSubmissions));

// Backward-compatible aliases — eventId is ignored; content is global
router.get(
  '/:eventId/client-dashboard/discover-experiences',
  validate(eventIdParam, 'params'),
  asyncHandler(clientDashboardContentController.listDiscoverExperiences)
);
router.post(
  '/:eventId/client-dashboard/discover-experiences',
  validate(eventIdParam, 'params'),
  uploadVideo.single('file'),
  validate(createClientDashboardContentSchema),
  asyncHandler(clientDashboardContentController.create)
);
router.get(
  '/:eventId/client-dashboard/discover-experiences/:id',
  validate(eventIdParam, 'params'),
  validate(idParamSchema, 'params'),
  asyncHandler(clientDashboardContentController.getDiscoverExperience)
);
router.patch(
  '/:eventId/client-dashboard/discover-experiences/:id',
  validate(eventIdParam, 'params'),
  validate(idParamSchema, 'params'),
  uploadVideo.single('file'),
  validate(updateDiscoverExperienceSchema),
  asyncHandler(clientDashboardContentController.updateDiscoverExperience)
);
router.delete(
  '/:eventId/client-dashboard/discover-experiences/:id',
  validate(eventIdParam, 'params'),
  validate(idParamSchema, 'params'),
  asyncHandler(clientDashboardContentController.removeDiscoverExperience)
);

router.get(
  '/:eventId/client-dashboard/testimonials',
  validate(eventIdParam, 'params'),
  asyncHandler(clientDashboardContentController.listTestimonials)
);
router.get(
  '/:eventId/client-dashboard/testimonials/:id',
  validate(eventIdParam, 'params'),
  validate(idParamSchema, 'params'),
  asyncHandler(clientDashboardContentController.getTestimonial)
);
router.patch(
  '/:eventId/client-dashboard/testimonials/:id',
  validate(eventIdParam, 'params'),
  validate(idParamSchema, 'params'),
  uploadVideo.single('file'),
  validate(updateTestimonialSchema),
  asyncHandler(clientDashboardContentController.updateTestimonial)
);
router.delete(
  '/:eventId/client-dashboard/testimonials/:id',
  validate(eventIdParam, 'params'),
  validate(idParamSchema, 'params'),
  asyncHandler(clientDashboardContentController.removeTestimonial)
);

module.exports = router;
