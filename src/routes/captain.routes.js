const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate.middleware');
const authenticate = require('../middleware/auth.middleware');
const requireSuperAdmin = require('../middleware/role.middleware');
const captainController = require('../controllers/captain.controller');
const { listCaptainsSchema, createCaptainSchema } = require('../validations/domain.validation');

const router = express.Router();
router.use(authenticate, requireSuperAdmin);

router.get('/', validate(listCaptainsSchema, 'query'), asyncHandler(captainController.list));
router.post('/', validate(createCaptainSchema), asyncHandler(captainController.create));

module.exports = router;
