const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate.middleware');
const authenticate = require('../middleware/auth.middleware');
const requireClient = require('../middleware/requireClient.middleware');
const resolveClientProfile = require('../middleware/resolveClientProfile.middleware');
const reelController = require('../controllers/clientFlow/reel.controller');
const clientEventTitleController = require('../controllers/clientFlow/clientEventTitle.controller');
const clientDashboardContentController = require('../controllers/clientFlow/clientDashboardContent.controller');
const clientInquiryController = require('../controllers/clientFlow/inquiry.controller');
const clientFlowAuthRoutes = require('./clientFlow/auth.routes');
const {
  clientFlowReelsListSchema,
  listClientEventTitlesSchema,
  createClientInquirySchema,
} = require('../validations/domain.validation');
const { listClientInquiriesSchema } = require('../validations/clientAuth.validation');

const router = express.Router();

router.use('/auth', clientFlowAuthRoutes);

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

router.get(
  '/inquiries',
  authenticate,
  requireClient,
  resolveClientProfile,
  validate(listClientInquiriesSchema, 'query'),
  asyncHandler(clientInquiryController.list)
);

router.post(
  '/inquiries',
  authenticate,
  requireClient,
  resolveClientProfile,
  validate(createClientInquirySchema),
  asyncHandler(clientInquiryController.create)
);

module.exports = router;
