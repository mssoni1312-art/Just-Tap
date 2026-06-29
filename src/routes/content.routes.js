const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const authenticate = require('../middleware/auth.middleware');
const requireSuperAdmin = require('../middleware/role.middleware');
const domain = require('../controllers/domain.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Content
 *     description: Static content pages
 */

router.get('/about', authenticate, requireSuperAdmin, asyncHandler(domain.content.about));
router.get('/contact', authenticate, requireSuperAdmin, asyncHandler(domain.content.contact));

module.exports = router;
