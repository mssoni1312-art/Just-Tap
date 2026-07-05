const express = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middleware/validate.middleware');
const authenticate = require('../../middleware/auth.middleware');
const requireManager = require('../../middleware/requireManager.middleware');
const resolveManagerStaff = require('../../middleware/resolveManagerStaff.middleware');
const orderController = require('../../controllers/manager/order.controller');
const { lineItemIdParamSchema } = require('../../validations/common.validation');

const router = express.Router();
router.use(authenticate, requireManager, resolveManagerStaff);

router.get(
  '/items/:lineItemId',
  validate(lineItemIdParamSchema, 'params'),
  asyncHandler(orderController.lineItem)
);

module.exports = router;
