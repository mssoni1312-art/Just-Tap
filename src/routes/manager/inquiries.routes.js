const express = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middleware/validate.middleware');
const authenticate = require('../../middleware/auth.middleware');
const requireManager = require('../../middleware/requireManager.middleware');
const resolveManagerStaff = require('../../middleware/resolveManagerStaff.middleware');
const { sendSuccess } = require('../../helpers/response');
const inquiryService = require('../../services/inquiry.service');
const { listInquiriesSchema } = require('../../validations/domain.validation');

const router = express.Router();
router.use(authenticate, requireManager, resolveManagerStaff);

router.get('/stats', asyncHandler(async (_req, res) => sendSuccess(res, await inquiryService.getStats())));

router.get('/', validate(listInquiriesSchema, 'query'), asyncHandler(async (req, res) =>
  sendSuccess(res, await inquiryService.list(req.query)),
));

module.exports = router;
