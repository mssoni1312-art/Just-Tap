const express = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const authenticate = require('../../middleware/auth.middleware');
const requireManager = require('../../middleware/requireManager.middleware');
const resolveManagerStaff = require('../../middleware/resolveManagerStaff.middleware');
const dashboardController = require('../../controllers/manager/dashboard.controller');

const router = express.Router();
router.use(authenticate, requireManager, resolveManagerStaff);
router.get('/home', asyncHandler(dashboardController.home));
router.get('/evaluate-income', asyncHandler(dashboardController.evaluateIncome));

module.exports = router;
