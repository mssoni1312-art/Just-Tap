const express = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../helpers/response');
const validate = require('../../middleware/validate.middleware');
const authenticate = require('../../middleware/auth.middleware');
const requireManager = require('../../middleware/requireManager.middleware');
const resolveManagerStaff = require('../../middleware/resolveManagerStaff.middleware');
const teamAllocationService = require('../../services/team_allocation.service');
const { assignTasksSchema } = require('../../validations/domain.validation');

const router = express.Router();
router.use(authenticate, requireManager, resolveManagerStaff);

router.get(
  '/:teamType',
  asyncHandler(async (req, res) =>
    sendSuccess(res, await teamAllocationService.getAllocation(req.params.teamType)),
  ),
);

router.get(
  '/:teamType/staff/:staffId/report',
  asyncHandler(async (req, res) =>
    sendSuccess(
      res,
      await teamAllocationService.getStaffReport(req.params.teamType, req.params.staffId),
    ),
  ),
);

router.post(
  '/:teamType/staff/:staffId/tasks/assign',
  validate(assignTasksSchema),
  asyncHandler(async (req, res) =>
    sendSuccess(
      res,
      await teamAllocationService.assignTasksToStaff(
        req.params.teamType,
        req.params.staffId,
        req.body,
      ),
    ),
  ),
);

module.exports = router;
