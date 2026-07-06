const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate.middleware');
const authenticate = require('../middleware/auth.middleware');
const requireSuperAdmin = require('../middleware/role.middleware');
const functionNameController = require('../controllers/functionName.controller');
const {
  listFunctionNamesSchema,
  createFunctionNameSchema,
  updateFunctionNameSchema,
} = require('../validations/domain.validation');
const { idParamSchema } = require('../validations/common.validation');

const router = express.Router();
router.use(authenticate, requireSuperAdmin);

router.get('/', validate(listFunctionNamesSchema, 'query'), asyncHandler(functionNameController.list));
router.post('/', validate(createFunctionNameSchema), asyncHandler(functionNameController.create));
router.get('/:id', validate(idParamSchema, 'params'), asyncHandler(functionNameController.getById));
router.patch('/:id', validate(idParamSchema, 'params'), validate(updateFunctionNameSchema), asyncHandler(functionNameController.update));
router.delete('/:id', validate(idParamSchema, 'params'), asyncHandler(functionNameController.remove));

module.exports = router;
