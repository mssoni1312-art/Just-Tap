const express = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middleware/validate.middleware');
const authenticate = require('../../middleware/auth.middleware');
const requireManager = require('../../middleware/requireManager.middleware');
const resolveManagerStaff = require('../../middleware/resolveManagerStaff.middleware');
const taskController = require('../../controllers/manager/task.controller');
const { listTasksSchema } = require('../../validations/domain.validation');
const {
  createManagerTaskSchema,
  updateManagerEventTaskSchema,
} = require('../../validations/manager.validation');
const { idParamSchema, eventIdParam } = require('../../validations/event.validation');

const router = express.Router();
router.use(authenticate, requireManager, resolveManagerStaff);

router.get('/summary', asyncHandler(taskController.summary));
router.get('/templates', validate(listTasksSchema, 'query'), asyncHandler(taskController.listTemplates));
router.get('/', validate(listTasksSchema, 'query'), asyncHandler(taskController.list));
router.post('/', validate(createManagerTaskSchema), asyncHandler(taskController.create));
router.get('/:id', validate(idParamSchema, 'params'), asyncHandler(taskController.getById));
router.patch('/:id', validate(idParamSchema, 'params'), validate(updateManagerEventTaskSchema), asyncHandler(taskController.update));
router.post('/:id/complete', validate(idParamSchema, 'params'), asyncHandler(taskController.complete));
router.delete('/:id', validate(idParamSchema, 'params'), asyncHandler(taskController.remove));

module.exports = router;
