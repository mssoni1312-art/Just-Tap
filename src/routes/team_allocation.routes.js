const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate.middleware');
const authenticate = require('../middleware/auth.middleware');
const requireSuperAdmin = require('../middleware/role.middleware');
const teamAllocationService = require('../services/team_allocation.service');
const { assignTasksSchema } = require('../validations/domain.validation');

const router = express.Router();

router.get(
  '/:teamType',
  authenticate,
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    const { sendSuccess } = require('../helpers/response');
    sendSuccess(res, await teamAllocationService.getAllocation(req.params.teamType));
  })
);

router.get(
  '/:teamType/staff/:staffId/report',
  authenticate,
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    const { sendSuccess } = require('../helpers/response');
    sendSuccess(
      res,
      await teamAllocationService.getStaffReport(req.params.teamType, req.params.staffId)
    );
  })
);

router.get(
  '/:teamType/staff/:staffId/tasks',
  authenticate,
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    const { sendSuccess } = require('../helpers/response');
    sendSuccess(
      res,
      await teamAllocationService.getStaffTasks(req.params.teamType, req.params.staffId)
    );
  })
);

router.post(
  '/:teamType/staff/:staffId/tasks/assign',
  authenticate,
  requireSuperAdmin,
  validate(assignTasksSchema),
  asyncHandler(async (req, res) => {
    const { sendSuccess } = require('../helpers/response');
    sendSuccess(
      res,
      await teamAllocationService.assignTasksToStaff(
        req.params.teamType,
        req.params.staffId,
        req.body
      )
    );
  })
);

module.exports = router;
