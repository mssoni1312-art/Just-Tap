const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate.middleware');
const reelController = require('../controllers/clientFlow/reel.controller');
const clientEventTitleController = require('../controllers/clientFlow/clientEventTitle.controller');
const clientDashboardContentController = require('../controllers/clientFlow/clientDashboardContent.controller');
const clientInquiryController = require('../controllers/clientFlow/inquiry.controller');
const {
  clientFlowReelsListSchema,
  listClientEventTitlesSchema,
  createClientInquirySchema,
} = require('../validations/domain.validation');

const router = express.Router();

router.get(
  '/reels',
  validate(clientFlowReelsListSchema, 'query'),
  asyncHandler(reelController.list)
);

router.get(
  '/our-events',
  validate(listClientEventTitlesSchema, 'query'),
  asyncHandler(clientEventTitleController.list)
);

router.get(
  '/discover-experiences',
  asyncHandler(clientDashboardContentController.listDiscoverExperiences)
);

router.get(
  '/testimonials',
  asyncHandler(clientDashboardContentController.listTestimonials)
);

router.get(
  '/client-dashboard',
  asyncHandler(clientDashboardContentController.getDashboard)
);

router.post(
  '/inquiries',
  validate(createClientInquirySchema),
  asyncHandler(clientInquiryController.create)
);

module.exports = router;
