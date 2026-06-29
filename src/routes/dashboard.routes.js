const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const authenticate = require('../middleware/auth.middleware');
const requireSuperAdmin = require('../middleware/role.middleware');
const dashboardController = require('../controllers/dashboard.controller');

const router = express.Router();
router.use(authenticate, requireSuperAdmin);

router.get('/home', asyncHandler(dashboardController.home));

module.exports = router;
