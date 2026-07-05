const express = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../helpers/response');
const authenticate = require('../../middleware/auth.middleware');
const requireManager = require('../../middleware/requireManager.middleware');
const resolveManagerStaff = require('../../middleware/resolveManagerStaff.middleware');
const { analyticsService } = require('../../services/profile.service');

const router = express.Router();
router.use(authenticate, requireManager, resolveManagerStaff);

router.get(
  '/sales',
  asyncHandler(async (_req, res) => sendSuccess(res, await analyticsService.getSales())),
);

router.get(
  '/menu-report',
  asyncHandler(async (req, res) =>
    sendSuccess(
      res,
      await analyticsService.getMenuReport({
        search: req.query.search,
        category: req.query.category,
      }),
    ),
  ),
);

router.get(
  '/package-revenue',
  asyncHandler(async (req, res) =>
    sendSuccess(res, await analyticsService.getPackageRevenue(req.managerStaffId)),
  ),
);

module.exports = router;
