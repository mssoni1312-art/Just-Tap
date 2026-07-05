const express = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const authenticate = require('../../middleware/auth.middleware');
const requireManager = require('../../middleware/requireManager.middleware');
const resolveManagerStaff = require('../../middleware/resolveManagerStaff.middleware');
const { sendSuccess } = require('../../helpers/response');
const { contentService } = require('../../services/profile.service');

const router = express.Router();
router.use(authenticate, requireManager, resolveManagerStaff);

router.get('/about', asyncHandler(async (_req, res) => sendSuccess(res, await contentService.getAbout())));

router.get('/contact', asyncHandler(async (_req, res) => sendSuccess(res, await contentService.getContact())));

module.exports = router;
