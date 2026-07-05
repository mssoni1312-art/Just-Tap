const express = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middleware/validate.middleware');
const authenticate = require('../../middleware/auth.middleware');
const requireManager = require('../../middleware/requireManager.middleware');
const resolveManagerStaff = require('../../middleware/resolveManagerStaff.middleware');
const eventController = require('../../controllers/manager/event.controller');
const menuController = require('../../controllers/manager/menu.controller');
const taskController = require('../../controllers/manager/task.controller');
const feedbackController = require('../../controllers/manager/feedback.controller');
const feedbackQuestionController = require('../../controllers/manager/feedbackQuestion.controller');
const tableController = require('../../controllers/manager/table.controller');
const orderController = require('../../controllers/manager/order.controller');
const billingController = require('../../controllers/manager/billing.controller');
const {
  listEventsSchema,
  functionSchema,
  idParamSchema,
  eventIdParam,
  functionIdParamSchema,
} = require('../../validations/event.validation');
const {
  menuPlanningSchema,
  assignTasksSchema,
  listFeedbackSchema,
  listTasksSchema,
  orderTableQuerySchema,
  reportQuerySchema,
  saveBillingPreviewSchema,
  bulkTablesSchema,
  assignManagerTablesSchema,
  assignTableManagerSchema,
  tableAssignmentSchema,
  tableAllocationSchema,
} = require('../../validations/domain.validation');
const { tableNumberParamSchema } = require('../../validations/event.validation');
const { uploadDocument } = require('../../config/multer');
const {
  managerCalendarSchema,
  createManagerEventSchema,
  updateManagerEventSchema,
  updateManagerAllTasksSchema,
  attachmentIdParamSchema,
  managerEventFeedbackQuestionSchema,
  managerEventFeedbackQuestionIdParamSchema,
} = require('../../validations/manager.validation');

const router = express.Router();
router.use(authenticate, requireManager, resolveManagerStaff);

router.get('/meta', asyncHandler(eventController.meta));
router.get('/calendar', validate(managerCalendarSchema, 'query'), asyncHandler(eventController.calendar));
router.get('/today', asyncHandler(eventController.today));
router.get('/upcoming', asyncHandler(eventController.upcoming));
router.get('/completed', validate(listEventsSchema, 'query'), asyncHandler(eventController.completed));
router.get('/cancelled', validate(listEventsSchema, 'query'), asyncHandler(eventController.cancelled));
router.get('/', validate(listEventsSchema, 'query'), asyncHandler(eventController.list));
router.post('/', validate(createManagerEventSchema), asyncHandler(eventController.create));

router.get('/:id', validate(idParamSchema, 'params'), asyncHandler(eventController.getById));
router.patch('/:id', validate(idParamSchema, 'params'), validate(updateManagerEventSchema), asyncHandler(eventController.update));
router.delete('/:id', validate(idParamSchema, 'params'), asyncHandler(eventController.remove));

router.get('/:eventId/tasks', validate(eventIdParam, 'params'), validate(listTasksSchema, 'query'), asyncHandler(taskController.listByEvent));
router.post('/:eventId/tasks/assign', validate(eventIdParam, 'params'), validate(assignTasksSchema), asyncHandler(taskController.assign));

router.get('/:eventId/all-tasks', validate(eventIdParam, 'params'), asyncHandler(taskController.getAllTasks));
router.patch('/:eventId/all-tasks', validate(eventIdParam, 'params'), validate(updateManagerAllTasksSchema), asyncHandler(taskController.updateAllTasks));
router.post('/:eventId/all-tasks/complete', validate(eventIdParam, 'params'), asyncHandler(taskController.completeAllTasks));
router.post('/:eventId/all-tasks/abandon', validate(eventIdParam, 'params'), asyncHandler(taskController.abandonAllTasks));
router.post(
  '/:eventId/all-tasks/attachments',
  validate(eventIdParam, 'params'),
  uploadDocument.single('file'),
  asyncHandler(taskController.uploadAllTaskAttachment)
);
router.delete(
  '/:eventId/all-tasks/attachments/:attachmentId',
  validate(attachmentIdParamSchema, 'params'),
  asyncHandler(taskController.removeAllTaskAttachment)
);

router.get('/:eventId/menu-planning', validate(eventIdParam, 'params'), asyncHandler(menuController.getPlanning));
router.put('/:eventId/menu-planning', validate(eventIdParam, 'params'), validate(menuPlanningSchema), asyncHandler(menuController.updatePlanning));

router.get('/:eventId/billing', validate(eventIdParam, 'params'), asyncHandler(billingController.get));
router.put(
  '/:eventId/billing/save-preview',
  validate(eventIdParam, 'params'),
  validate(saveBillingPreviewSchema),
  asyncHandler(billingController.savePreview),
);

router.get('/:eventId/tables', validate(eventIdParam, 'params'), asyncHandler(tableController.listByEvent));
router.put('/:eventId/tables', validate(eventIdParam, 'params'), validate(bulkTablesSchema), asyncHandler(tableController.bulkSave));
router.post(
  '/:eventId/tables/assign-manager',
  validate(eventIdParam, 'params'),
  validate(assignManagerTablesSchema),
  asyncHandler(tableController.assignManager),
);
router.post(
  '/:eventId/tables/:tableNumber/assign-manager',
  validate(tableNumberParamSchema, 'params'),
  validate(assignTableManagerSchema),
  asyncHandler(tableController.assignTableManager),
);
router.post(
  '/:eventId/tables/:tableNumber/assign',
  validate(tableNumberParamSchema, 'params'),
  validate(tableAssignmentSchema),
  asyncHandler(tableController.assign),
);
router.post(
  '/:eventId/table-allocation',
  validate(eventIdParam, 'params'),
  validate(tableAllocationSchema),
  asyncHandler(tableController.allocate),
);

router.get('/:eventId/orders/summary', validate(eventIdParam, 'params'), asyncHandler(orderController.summary));
router.get('/:eventId/orders/tables', validate(eventIdParam, 'params'), asyncHandler(orderController.tables));
router.get(
  '/:eventId/orders/tables/:tableNumber',
  validate(tableNumberParamSchema, 'params'),
  validate(orderTableQuerySchema, 'query'),
  asyncHandler(orderController.tableDetail)
);
router.get(
  '/:eventId/orders/report',
  validate(eventIdParam, 'params'),
  validate(reportQuerySchema, 'query'),
  asyncHandler(orderController.report)
);

router.get('/:eventId/feedback/summary', validate(eventIdParam, 'params'), asyncHandler(feedbackController.summary));
router.get('/:eventId/feedback', validate(eventIdParam, 'params'), validate(listFeedbackSchema, 'query'), asyncHandler(feedbackController.listByEvent));
router.get(
  '/:eventId/feedback/questions',
  validate(eventIdParam, 'params'),
  asyncHandler(feedbackQuestionController.list)
);
router.post(
  '/:eventId/feedback/questions',
  validate(eventIdParam, 'params'),
  validate(managerEventFeedbackQuestionSchema),
  asyncHandler(feedbackQuestionController.create)
);
router.delete(
  '/:eventId/feedback/questions/:questionId',
  validate(managerEventFeedbackQuestionIdParamSchema, 'params'),
  asyncHandler(feedbackQuestionController.remove)
);

router.post('/:eventId/functions', validate(eventIdParam, 'params'), validate(functionSchema), asyncHandler(eventController.addFunction));
router.patch('/:eventId/functions/:functionId', validate(functionIdParamSchema, 'params'), validate(functionSchema), asyncHandler(eventController.updateFunction));
router.delete('/:eventId/functions/:functionId', validate(functionIdParamSchema, 'params'), asyncHandler(eventController.deleteFunction));

module.exports = router;
