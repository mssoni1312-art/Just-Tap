const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate.middleware');
const authenticate = require('../middleware/auth.middleware');
const requireSuperAdmin = require('../middleware/role.middleware');
const domain = require('../controllers/domain.controller');

const ordersRouter = express.Router();
ordersRouter.get('/items/:lineItemId', authenticate, requireSuperAdmin, asyncHandler(domain.order.lineItem));

module.exports = { ordersRouter };
