const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate.middleware');
const authenticate = require('../middleware/auth.middleware');
const requireSuperAdmin = require('../middleware/role.middleware');
const managerController = require('../controllers/manager.controller');
const { listManagersSchema } = require('../validations/domain.validation');

const router = express.Router();
router.use(authenticate, requireSuperAdmin);

router.get('/', validate(listManagersSchema, 'query'), asyncHandler(managerController.list));

module.exports = router;
