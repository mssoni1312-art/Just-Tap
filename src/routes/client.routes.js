const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate.middleware');
const authenticate = require('../middleware/auth.middleware');
const requireSuperAdmin = require('../middleware/role.middleware');
const clientController = require('../controllers/client.controller');
const { listClientsSchema, createClientSchema } = require('../validations/domain.validation');
const { idParamSchema } = require('../validations/common.validation');

const router = express.Router();
router.use(authenticate, requireSuperAdmin);

router.get('/', validate(listClientsSchema, 'query'), asyncHandler(clientController.list));
router.post('/', validate(createClientSchema), asyncHandler(clientController.create));
router.get('/:id', validate(idParamSchema, 'params'), asyncHandler(clientController.getById));

module.exports = router;
