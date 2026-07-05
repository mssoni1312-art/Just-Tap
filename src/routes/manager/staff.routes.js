const express = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middleware/validate.middleware');
const authenticate = require('../../middleware/auth.middleware');
const requireManager = require('../../middleware/requireManager.middleware');
const resolveManagerStaff = require('../../middleware/resolveManagerStaff.middleware');
const { sendSuccess } = require('../../helpers/response');
const staffService = require('../../services/staff.service');
const { listStaffSchema } = require('../../validations/domain.validation');

const router = express.Router();
router.use(authenticate, requireManager, resolveManagerStaff);

router.get('/', validate(listStaffSchema, 'query'), asyncHandler(async (req, res) =>
  sendSuccess(res, await staffService.list(req.query)),
));

module.exports = router;
