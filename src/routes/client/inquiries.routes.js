const express = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middleware/validate.middleware');
const authenticate = require('../../middleware/auth.middleware');
const requireClient = require('../../middleware/requireClient.middleware');
const resolveClientProfile = require('../../middleware/resolveClientProfile.middleware');
const inquiryController = require('../../controllers/client/inquiry.controller');
const { listClientInquiriesSchema } = require('../../validations/clientAuth.validation');
const { createClientInquirySchema } = require('../../validations/domain.validation');

const router = express.Router();

router.use(authenticate, requireClient, resolveClientProfile);

router.get('/', validate(listClientInquiriesSchema, 'query'), asyncHandler(inquiryController.list));
router.post('/', validate(createClientInquirySchema), asyncHandler(inquiryController.create));

module.exports = router;
