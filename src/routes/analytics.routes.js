const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const authenticate = require('../middleware/auth.middleware');
const requireSuperAdmin = require('../middleware/role.middleware');
const domain = require('../controllers/domain.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Analytics
 *     description: Analytics and charts
 */

router.get('/sales', authenticate, requireSuperAdmin, asyncHandler(domain.analytics.sales));
router.get('/menu-report', authenticate, requireSuperAdmin, asyncHandler(domain.analytics.menuReport));

module.exports = router;
