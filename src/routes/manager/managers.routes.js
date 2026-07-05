const express = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middleware/validate.middleware');
const authenticate = require('../../middleware/auth.middleware');
const requireManager = require('../../middleware/requireManager.middleware');
const resolveManagerStaff = require('../../middleware/resolveManagerStaff.middleware');
const { sendSuccess } = require('../../helpers/response');
const managerService = require('../../services/manager.service');
const { listManagersSchema } = require('../../validations/domain.validation');

const router = express.Router();
router.use(authenticate, requireManager, resolveManagerStaff);

router.get('/', validate(listManagersSchema, 'query'), asyncHandler(async (req, res) =>
  sendSuccess(res, await managerService.list(req.query)),
));

module.exports = router;
