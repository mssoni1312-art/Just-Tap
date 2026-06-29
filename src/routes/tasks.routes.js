const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate.middleware');
const authenticate = require('../middleware/auth.middleware');
const requireSuperAdmin = require('../middleware/role.middleware');
const taskController = require('../controllers/task.controller');
const {
  createTaskSchema,
  updateTaskSchema,
  listTasksSchema,
  bulkIdsSchema,
  exportQuerySchema,
} = require('../validations/domain.validation');
const { idParamSchema } = require('../validations/event.validation');

const router = express.Router();
router.use(authenticate, requireSuperAdmin);

router.get('/summary', asyncHandler(taskController.summary));
router.get('/export', validate(exportQuerySchema, 'query'), asyncHandler(taskController.export));
router.get('/', validate(listTasksSchema, 'query'), asyncHandler(taskController.list));
router.post('/', validate(createTaskSchema), asyncHandler(taskController.create));
router.post('/bulk-delete', validate(bulkIdsSchema), asyncHandler(taskController.bulkDelete));
router.get('/:id', validate(idParamSchema, 'params'), asyncHandler(taskController.getById));
router.patch('/:id', validate(idParamSchema, 'params'), validate(updateTaskSchema), asyncHandler(taskController.update));
router.delete('/:id', validate(idParamSchema, 'params'), asyncHandler(taskController.remove));

module.exports = router;
