const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate.middleware');
const authenticate = require('../middleware/auth.middleware');
const requireSuperAdmin = require('../middleware/role.middleware');
const managerController = require('../controllers/manager.controller');
const { idParamSchema } = require('../validations/event.validation');
const {
  listManagersSchema,
  createManagerSchema,
  registerManagerSchema,
} = require('../validations/domain.validation');

const router = express.Router();
router.use(authenticate, requireSuperAdmin);

router.get('/', validate(listManagersSchema, 'query'), asyncHandler(managerController.list));
router.post('/', validate(createManagerSchema), asyncHandler(managerController.create));
router.post(
  '/:id/register',
  validate(idParamSchema, 'params'),
  validate(registerManagerSchema),
  asyncHandler(managerController.register)
);

module.exports = router;
